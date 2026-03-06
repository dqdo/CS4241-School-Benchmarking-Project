import { GoogleGenAI } from "@google/genai";
import { Ollama } from "ollama";
import { Router } from "express";
import { Db } from "mongodb";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();
const router = Router();

// Load AI prompt configurations from JSON file containing rules, guidelines, and examples for different user types
const configPrompts = JSON.parse(fs.readFileSync("./src/server/prompt-config.json", "utf8"));

// AI provider configuration - supports both Ollama (cloud) and Gemini (cloud) models
const AI_PROVIDER: "gemini" | "ollama" = "ollama";
const OLLAMA_MODEL = "gpt-oss:120b";
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of query retry attempts

const ollama = new Ollama({
    host: "https://ollama.com",
    headers: {
        Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
    },
});

// Custom claim key in Auth user object (req.oidc.user)
const SCHOOL_NAMESPACE = "https://cs4241-school-benchmarking-project-1.onrender.com/schoolId";

let db: Db | undefined;

// Initialize database connection and fetch schema on startup
export function setDb(database: Db) {
    db = database;
    fetchLiveSchema()
        .then(() => console.log("[schema] Schema fetched successfully"))
        .catch((err) => console.error("[schema] Failed to fetch on startup:", err));
}

// Compile prompt configuration object into a structured text prompt for AI consumption
// Combines role, output format, rules, KPI formulas, field translations, and examples
function compilePrompt(promptObj: Record<string, any>): string {
    const parts: string[] = [];

    if (promptObj.role) parts.push(promptObj.role);
    if (promptObj.outputShape) parts.push(promptObj.outputShape);

    // Query rules e.g. how to look up a school by name, what fields to avoid
    if (Array.isArray(promptObj.rules)) {
        parts.push("Rules:\n" + promptObj.rules.map((r: string) => `- ${r}`).join("\n"));
    }

    // KPI formulas e.g. acceptance rate, yield rate, attrition rate
    if (promptObj.kpiFormulas && typeof promptObj.kpiFormulas === "object") {
        const lines = Object.entries(promptObj.kpiFormulas)
            .map(([k, v]) => `  ${k} = ${v}`)
            .join("\n");
        parts.push("KPI FORMULAS - use these when a user asks about rates, ratios, or performance:\n" + lines);
    }

    // Output formatting rules e.g. no markdown, plain text only
    if (Array.isArray(promptObj.formattingRules)) {
        parts.push("Formatting rules:\n" + promptObj.formattingRules.map((r: string) => `- ${r}`).join("\n"));
    }

    // Maps raw field names like COMPLETED_APPLICATION_TOTAL to human readable labels
    if (promptObj.fieldTranslations && typeof promptObj.fieldTranslations === "object") {
        const lines = Object.entries(promptObj.fieldTranslations)
            .map(([k, v]) => `  ${k} = ${v}`)
            .join("\n");
        parts.push("Field name translations - always use these when describing data:\n" + lines);
    }

    // General response guidelines e.g. what to say when no results are found
    if (Array.isArray(promptObj.guidelines)) {
        parts.push("Guidelines:\n" + promptObj.guidelines.map((g: string) => `- ${g}`).join("\n"));
    }

    if (Array.isArray(promptObj.exampleQuestions)) {
        parts.push("Example questions:\n" + promptObj.exampleQuestions.map((q: string) => `- ${q}`).join("\n"));
    }

    return parts.join("\n\n");
}

// Introspect MongoDB database to extract live schema information
// Samples up to 20 documents from each collection to identify available fields
async function fetchLiveSchema(): Promise<string> {
    if (!db) throw new Error("Database not connected");

    const collections = await db.listCollections().toArray();
    const lines: string[] = ["LIVE DATABASE SCHEMA (auto-detected from MongoDB):\n"];

    await Promise.all(
        collections.map(async (colInfo) => {
            const name = colInfo.name;
            try {
                const docs = await db!.collection(name).find({}).limit(20).toArray();
                const fields = new Set<string>();
                for (const doc of docs) {
                    for (const key of Object.keys(doc)) {
                        if (key !== "_id") fields.add(key);
                    }
                }
                lines.push(name);
                lines.push(`  ${Array.from(fields).sort().join(", ")}`);
                lines.push("");
            } catch (err) {
                console.warn(`[schema] Failed to introspect "${name}":`, err);
            }
        })
    );

    return lines.join("\n");
}

// Append live database schema to the base prompt for query generation
async function buildQueryPrompt(basePrompt: string): Promise<string> {
    const schema = await fetchLiveSchema();
    console.log("[schema] Live schema preview (first 500 chars):\n", schema.slice(0, 500));
    return `${basePrompt}\n\n${schema}`;
}

// Throw a consistent error when the client has cancelled the request
function assertNotAborted(signal?: AbortSignal) {
    if (signal?.aborted) {
        throw new Error("Request aborted by client");
    }
}

// Make a single-turn AI request with system prompt and user message
// Supports both Ollama (cloud) and Gemini (cloud) providers
async function callAI(systemPrompt: string, userMessage: string, signal?: AbortSignal): Promise<string> {
    assertNotAborted(signal);

    if (AI_PROVIDER === "ollama") {
        const response = await ollama.chat({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
        });

        assertNotAborted(signal);

        const content = response.message.content;
        if (!content || content.trim().length === 0) {
            console.warn("[callAI] Ollama returned empty content");
        }
        return content;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        config: { systemInstruction: systemPrompt },
    });

    assertNotAborted(signal);

    return response.text ?? "";
}

// Make a multi-turn AI request with conversation history
// Normalizes message formats between Ollama and Gemini
async function callAIWithHistory(systemPrompt: string, history: any[], message: string, signal?: AbortSignal): Promise<string> {
    assertNotAborted(signal);

    if (AI_PROVIDER === "ollama") {
        const messages = [
            { role: "system", content: systemPrompt },
            ...(Array.isArray(history)
                ? history.map((h) => ({
                    role: h.role === "model" ? "assistant" : h.role,
                    content: h.parts?.[0]?.text ?? h.content ?? "",
                }))
                : []),
            { role: "user", content: message },
        ];

        const response = await ollama.chat({
            model: OLLAMA_MODEL,
            stream: false,
            messages,
        });

        assertNotAborted(signal);

        return response.message.content;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [...(Array.isArray(history) ? history : []), { role: "user", parts: [{ text: message }] }],
        config: { systemInstruction: systemPrompt },
    });

    assertNotAborted(signal);

    return response.text ?? "";
}

// Type definitions for AI response structures
interface ClassificationResult {
    isDataQuestion: boolean;
    reasoning?: string;
}

interface QueryPlan {
    needsData: boolean;
    collection?: string;
    operation?: "find" | "aggregate";
    query?: Record<string, any>;
    projection?: Record<string, any>;
    pipeline?: any[];
    limit?: number;
    suggestedFix?: string;
}

interface ValidationResult {
    isValid: boolean;
    reasoning: string;
    suggestedFix?: string;
}

// Step 1: Classify whether user question requires database query or conversational response
// Uses AI classifier with recent conversation history to handle follow-up questions
async function classifyQuestion(question: string, history: any[], isAdmin: boolean, signal?: AbortSignal): Promise<ClassificationResult> {
    console.log(`[classifyQuestion] Classifying: "${question}"`);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const classifierPrompt = compilePrompt(userPrompts.classifier);

    // Include recent history context for follow-up detection
    const historyContext =
        history.length > 0
            ? `\n\nRecent conversation:\n${history
                .slice(-4)
                .map((h: any) => {
                    const role = h.role === "model" ? "Assistant" : "User";
                    const text = h.parts?.[0]?.text ?? h.content ?? "";
                    return `${role}: ${text}`;
                })
                .join("\n")}`
            : "";

    const classifierMessage = `Question: ${question}${historyContext}`;

    try {
        const rawResponse = await callAI(classifierPrompt, classifierMessage, signal);
        console.log("[classifyQuestion] AI response:\n", rawResponse);

        const strippedResponse = rawResponse.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

        if (!strippedResponse.startsWith("{")) {
            console.warn("[classifyQuestion] Response is not JSON, treating as conversational question");
            return { isDataQuestion: false, reasoning: "AI response was not JSON" };
        }

        const classification = parseJsonFromAI(rawResponse);
        console.log("[classifyQuestion] Classification:", classification);

        return {
            isDataQuestion: classification.isDataQuestion ?? false,
            reasoning: classification.reasoning,
        };
    } catch (err) {
        console.error("[classifyQuestion] Error:", err);
        return { isDataQuestion: false, reasoning: "Classification failed, defaulting to conversational" };
    }
}

// Parse JSON response from AI, extracting from markdown code blocks if necessary
// Handles empty responses, malformed JSON, and provides detailed error messages
function parseJsonFromAI(rawText: string): any {
    // Remove markdown code blocks
    let stripped = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Check for empty response
    if (!stripped || stripped.length === 0) {
        throw new Error("AI returned empty response - no JSON to parse");
    }

    // Extract JSON object from response (find first { to last })
    const jsonStart = stripped.indexOf("{");
    const jsonEnd = stripped.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error(`No JSON object found in response. Raw text: ${stripped.substring(0, 100)}...`);
    }

    stripped = stripped.slice(jsonStart, jsonEnd + 1);

    // Attempt to parse with better error message
    try {
        return JSON.parse(stripped);
    } catch (parseError: any) {
        throw new Error(
            `Failed to parse JSON. Error: ${parseError.message}. JSON text: ${stripped.substring(0, 200)}...`
        );
    }
}

// Execute MongoDB query based on query plan (supports both find and aggregate operations)
// Respects AbortSignal: checks before issuing the DB call
async function executeQuery(queryPlan: QueryPlan, signal?: AbortSignal): Promise<any[]> {
    assertNotAborted(signal);

    if (!db) throw new Error("Database not connected");
    if (!queryPlan.collection) throw new Error("No collection specified");

    const collection = db.collection(queryPlan.collection);

    if (queryPlan.operation === "aggregate" && queryPlan.pipeline) {
        console.log("[executeQuery] Running aggregate with pipeline:", JSON.stringify(queryPlan.pipeline, null, 2));
        const results = await collection.aggregate(queryPlan.pipeline).toArray();
        assertNotAborted(signal);
        return results;
    }

    console.log("[executeQuery] Running find with query:", JSON.stringify(queryPlan.query ?? {}, null, 2));
    let cursor = collection.find(queryPlan.query ?? {});

    if (queryPlan.projection) {
        cursor = cursor.project(queryPlan.projection);
    }

    if (queryPlan.limit) {
        cursor = cursor.limit(queryPlan.limit);
    }

    const results = await cursor.toArray();
    assertNotAborted(signal);
    return results;
}

// Validate AI-generated answer against query results to ensure accuracy.
// Checks for calculation errors, field mismatches, and logical inconsistencies.
async function validateAnswer(
    question: string,
    queryPlan: QueryPlan,
    results: any[],
    answer: string,
    isAdmin: boolean,
    history: any[],
    signal?: AbortSignal
): Promise<ValidationResult> {
    console.log("[validateAnswer] Validating answer...");

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const validatorPrompt = compilePrompt(userPrompts.validator);

    const validatorHistoryContext =
        history.length > 0
            ? `\n\nRecent conversation (use this to verify the correct school, year, or entity is being addressed):\n` +
            history
                .slice(-4)
                .map((h: any) => {
                    const role = h.role === "model" ? "Assistant" : "User";
                    const text = h.parts?.[0]?.text ?? h.content ?? "";
                    return `${role}: ${text}`;
                })
                .join("\n")
            : "";

    const validationMessage = `
Original question: ${question}${validatorHistoryContext}

Query plan used:
${JSON.stringify(queryPlan, null, 2)}

Query results (${results.length} records):
${JSON.stringify(results, null, 2)}

AI-generated answer:
${answer}

Validate whether the answer correctly interprets the data (correct KPI formulas, right school/year, no fabricated numbers).
`;

    try {
        const rawResponse = await callAI(validatorPrompt, validationMessage, signal);
        console.log("[validateAnswer] AI response:\n", rawResponse);

        if (!rawResponse || rawResponse.trim().length === 0) {
            console.warn("[validateAnswer] Received empty response from AI validator");
            return {
                isValid: true,
                reasoning: "Validator returned empty response, defaulting to valid",
            };
        }

        const validation = parseJsonFromAI(rawResponse);
        console.log("[validateAnswer] Validation result:", validation);

        return {
            isValid: validation.isValid ?? true,
            reasoning: validation.reasoning ?? "No reasoning provided",
            suggestedFix: validation.suggestedFix,
        };
    } catch (err: any) {
        console.error("[validateAnswer] Validation error:", err);
        console.error("[validateAnswer] Error details:", err.message);
        return {
            isValid: true,
            reasoning: "Validation failed, defaulting to valid",
        };
    }
}

// Remove MongoDB-specific fields (_id) from results for AI processing
function sanitiseResults(results: any[]): any[] {
    return results.slice(0, 200).map((doc) => {
        const { _id, ...rest } = doc;
        return rest;
    });
}

// Step 2: Generate MongoDB query plan from natural language question
// Includes retry logic with context from previous failed attempts
async function generateQueryWithRetry(
    question: string,
    history: any[],
    isAdmin: boolean,
    signal?: AbortSignal,
    previousAttempt?: { queryPlan: QueryPlan; error: string },
    schoolId?: number
): Promise<QueryPlan> {
    console.log("[generateQueryWithRetry] Generating query plan...");

    assertNotAborted(signal);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const queryGeneratorPrompt = compilePrompt(userPrompts.queryGenerator);
    const querySystemPrompt = await buildQueryPrompt(queryGeneratorPrompt);

    // Build conversation history context so the query generator can resolve
    // references like "the school" or "its id" from prior turns.
    const historyContext =
        history.length > 0
            ? `\n\nRecent conversation (use this to resolve any ambiguous references like "the school", "its", "that" etc.):\n` +
            history
                .slice(-6)
                .map((h: any) => {
                    const role = h.role === "model" ? "Assistant" : "User";
                    const text = h.parts?.[0]?.text ?? h.content ?? "";
                    return `${role}: ${text}`;
                })
                .join("\n")
            : "";

    const scopeHint =
        !isAdmin && Number.isFinite(schoolId as number)
            ? `\n\nACCESS SCOPE:\n- This user can only access SCHOOL_ID=${schoolId}.\n- If the question asks for overall averages/benchmarks across all schools, return only aggregate results with no per-school breakdown and no school names/IDs.\n`
            : "";

    const queryMessage = previousAttempt
        ? `
Previous query attempt FAILED with this plan:
${JSON.stringify(previousAttempt.queryPlan, null, 2)}

Error encountered: ${previousAttempt.error}

Please generate a DIFFERENT query approach for this question: ${question}
${historyContext}
${scopeHint}

${previousAttempt.queryPlan.suggestedFix || "Try a different collection, operation type, or query structure."}
`
        : `${question}${historyContext}${scopeHint}`;

    const rawPlan = await callAI(querySystemPrompt, queryMessage, signal);
    console.log("[generateQueryWithRetry] AI response:\n", rawPlan);

    const strippedPlan = rawPlan.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    if (!strippedPlan.startsWith("{")) {
        throw new Error("Response is not JSON");
    }

    const queryPlan = parseJsonFromAI(rawPlan);
    console.log("[generateQueryWithRetry] Parsed:\n", JSON.stringify(queryPlan, null, 2));

    return queryPlan;
}

// Main pipeline: Orchestrates the entire question-answering process with retry and validation logic
async function answerWithData(
    question: string,
    history: any[],
    isAdmin: boolean,
    signal?: AbortSignal,
    validationAttempt: number = 0,
    priorQueryPlan: QueryPlan | null = null,
    schoolId?: number
): Promise<{ reply: string; queryPlan: QueryPlan | null; validation?: ValidationResult }> {
    console.log(
        `[answerWithData] Question: "${question}" | isAdmin: ${isAdmin} | history: ${history.length} turn(s) | validationAttempt: ${validationAttempt}`
    );

    assertNotAborted(signal);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const conversationalPrompt = compilePrompt(userPrompts.conversational);
    const interpreterSystemPrompt = compilePrompt(userPrompts.interpreter);

    // STEP 1: Classify the question
    const classification = await classifyQuestion(question, history, isAdmin, signal);

    assertNotAborted(signal);

    if (!classification.isDataQuestion) {
        console.log("[answerWithData] Not a data question, using conversational response");
        const reply = await callAIWithHistory(conversationalPrompt, history, question, signal);
        return { reply, queryPlan: null };
    }

    let queryPlan: QueryPlan | null = priorQueryPlan;
    let results: any[] = [];
    let queryError: string | null = null;
    let attempt = 0;

    while (attempt < MAX_RETRY_ATTEMPTS) {
        attempt++;
        console.log(`[answerWithData] Query attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);

        assertNotAborted(signal);

        try {
            const previousAttempt = queryPlan
                ? {
                    queryPlan,
                    error:
                        queryError ??
                        `Query returned 0 results. Try a different approach — for example, loosening filters, checking field names, trying a different collection, or using a simpler pipeline.`,
                }
                : undefined;

            queryError = null;

            const globalQ = !isAdmin && isGlobalBenchQuestion(question);

            queryPlan = await generateQueryWithRetry(question, history, isAdmin, signal, previousAttempt, schoolId);

            assertNotAborted(signal);

            if (!queryPlan.needsData) {
                console.log("[answerWithData] needsData=false, using conversational response");
                const reply = await callAIWithHistory(conversationalPrompt, history, question, signal);
                return { reply, queryPlan: null };
            }

            if (!isAdmin && Number.isFinite(schoolId as number)) {
                queryPlan = enforceSchoolScope(queryPlan, schoolId as number, globalQ);
            }

            console.log(`[executeQuery] Collection: "${queryPlan.collection}" Operation: "${queryPlan.operation}"`);
            const raw = await executeQuery(queryPlan, signal);
            console.log(`[executeQuery] Raw results preview (first 500 chars):\n`, JSON.stringify(raw).slice(0, 500));
            results = sanitiseResults(raw);
            console.log(`[executeQuery] Returned ${results.length} document(s) after sanitisation`);

            if (globalQ) {
                results = sanitizeGlobalResults(results);
            }

            if (results.length > 0) {
                break;
            }

            console.log(`[answerWithData] Attempt ${attempt} returned 0 results, retrying with different query...`);
        } catch (err: any) {
            if (err?.message === "Request aborted by client") throw err;

            queryError = err?.message ?? "Unknown error";
            console.error(`[executeQuery] Attempt ${attempt} failed:`, queryError);

            if (attempt >= MAX_RETRY_ATTEMPTS) {
                console.error("[executeQuery] Max retry attempts reached");
            }
        }
    }

    assertNotAborted(signal);

    // STEP 3: Handle hard query execution error after all retries
    if (queryError) {
        const errorMessage = `I tried ${MAX_RETRY_ATTEMPTS} different approaches to retrieve the data but encountered errors each time. ${
            results.length === 0
                ? "Could you rephrase your question or provide more specific details?"
                : "However, I was able to retrieve some partial results."
        }`;

        if (results.length > 0) {
            const errorHistoryContext =
                history.length > 0
                    ? `\n\nConversation history:\n${history
                        .slice(-4)
                        .map((h: any) => {
                            const role = h.role === "model" ? "Assistant" : "User";
                            const text = h.parts?.[0]?.text ?? h.content ?? "";
                            return `${role}: ${text}`;
                        })
                        .join("\n")}`
                    : "";
            const dataContext = `Query results (${results.length} record${results.length === 1 ? "" : "s"}):\n${JSON.stringify(
                results,
                null,
                2
            )}`;
            const interpreterMessage = `User question: ${question}${errorHistoryContext}\n\n${dataContext}\n\nNote: This data may be incomplete due to query issues.`;
            const reply = await callAI(interpreterSystemPrompt, interpreterMessage, signal);
            return { reply: `${errorMessage}\n\n${reply}`, queryPlan };
        }

        return { reply: errorMessage, queryPlan };
    }

    // STEP 4: No results found after exhausting all retry attempts
    if (results.length === 0) {
        const noResultsHistoryContext =
            history.length > 0
                ? `\n\nConversation history:\n${history
                    .slice(-4)
                    .map((h: any) => {
                        const role = h.role === "model" ? "Assistant" : "User";
                        const text = h.parts?.[0]?.text ?? h.content ?? "";
                        return `${role}: ${text}`;
                    })
                    .join("\n")}`
                : "";
        const reply = await callAI(
            interpreterSystemPrompt,
            `User question: ${question}${noResultsHistoryContext}\n\nAll ${MAX_RETRY_ATTEMPTS} query attempts returned no results. Let the user know nothing was found and suggest why that might be (e.g., school name spelled incorrectly, no data for that year, grade level name may differ in the database, etc.).`,
            signal
        );
        return { reply, queryPlan };
    }

    // STEP 5: Generate initial answer from results
    const dataContext = `Query results (${results.length} record${results.length === 1 ? "" : "s"}):\n${JSON.stringify(
        results,
        null,
        2
    )}`;
    const historyContext =
        history.length > 0
            ? `\n\nConversation history:\n${history
                .slice(-4)
                .map((h: any) => {
                    const role = h.role === "model" ? "Assistant" : "User";
                    const text = h.parts?.[0]?.text ?? h.content ?? "";
                    return `${role}: ${text}`;
                })
                .join("\n")}`
            : "";

    const interpreterMessage = `User question: ${question}${historyContext}\n\n${dataContext}`;
    let reply = await callAI(interpreterSystemPrompt, interpreterMessage, signal);

    assertNotAborted(signal);

    // STEP 6: Validate the answer.
    const isDisplayOnlyRequest =
        /^\s*(list|show|display|give me|what are|can you (list|show)|tell me).{0,60}(all|those|the).{0,40}(ids?|names?|schools?|records?)\s*\??\s*$/i.test(
            question
        );

    if (isDisplayOnlyRequest) {
        console.log("[answerWithData] Display-only request detected — skipping validation to prevent hallucination");
        return {
            reply,
            queryPlan,
            validation: { isValid: true, reasoning: "Validation skipped for list/display request" },
        };
    }

    if (validationAttempt < MAX_RETRY_ATTEMPTS) {
        const validation = await validateAnswer(question, queryPlan!, results, reply, isAdmin, history, signal);

        assertNotAborted(signal);

        if (!validation.isValid) {
            console.log(
                `[answerWithData] Answer validation failed (attempt ${validationAttempt + 1}/${MAX_RETRY_ATTEMPTS}), regenerating with query context`
            );

            if (validation.suggestedFix && queryPlan) {
                (queryPlan as any).suggestedFix = validation.suggestedFix;
            }

            // IMPORTANT: keep schoolId on retries
            return answerWithData(question, history, isAdmin, signal, validationAttempt + 1, queryPlan, schoolId);
        }

        console.log(`[answerWithData] Final answer generated (valid=${validation.isValid})`);
        return { reply, queryPlan, validation };
    } else {
        console.log(
            `[answerWithData] Max validation attempts (${MAX_RETRY_ATTEMPTS}) reached, accepting answer despite validation concerns`
        );
        const validation: ValidationResult = {
            isValid: false,
            reasoning: "Maximum validation attempts reached, answer accepted by default",
        };
        return { reply, queryPlan, validation };
    }
}

function isGlobalBenchQuestion(q: string): boolean {
    return /\b(average|avg|overall|across all schools|all schools|benchmark|mean|median|percentile)\b/i.test(q);
}

function enforceSchoolScope(queryPlan: QueryPlan, schoolId: number, isGlobal: boolean): QueryPlan {
    const qp: QueryPlan = JSON.parse(JSON.stringify(queryPlan));

    // Global benchmark queries are allowed only as aggregate queries with no school identity exposure
    if (isGlobal) {
        if (qp.operation !== "aggregate") {
            throw new Error("School users may only run aggregate queries for global benchmarks");
        }
        return qp;
    }

    if (qp.collection === "School") {
        if (qp.operation === "find") {
            qp.query = { ID: schoolId };
            qp.projection = {
                ...(qp.projection ?? {}),
                ID: 1,
                NAME_TX: 1,
            };
            return qp;
        }

        if (qp.operation === "aggregate") {
            qp.pipeline = [
                { $match: { ID: schoolId } },
                ...((qp.pipeline ?? []).filter((stage) => !stage.$lookup && !stage.$match))
            ];
            return qp;
        }

        return qp;
    }

    if (qp.operation === "find") {
        qp.query = { SCHOOL_ID: schoolId };
        return qp;
    }

    if (qp.operation === "aggregate") {
        const cleanedPipeline = (qp.pipeline ?? []).filter((stage) => {
            if (!stage.$match) return true;

            const badKeys = [
                "SCHOOL_ID",
                "school.NAME_TX",
                "school.ID",
                "NAME_TX",
                "ID",
                "schoolId",
                "name"
            ];

            return !Object.keys(stage.$match).some((k) => badKeys.includes(k));
        });

        qp.pipeline = [{ $match: { SCHOOL_ID: schoolId } }, ...cleanedPipeline];
        return qp;
    }

    return qp;
}

function sanitizeGlobalResults(results: any[]): any[] {
    return results.map((doc) => {
        if (!doc || typeof doc !== "object") return doc;
        const copy = JSON.parse(JSON.stringify(doc));

        delete copy.SCHOOL_ID;
        delete copy.schoolId;
        delete copy.schoolID;
        delete copy.school;
        delete copy.schoolName;
        delete copy.NAME_TX;
        delete copy.name;

        return copy;
    });
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isForbiddenSchoolLookupForSchoolUser(
    message: string,
    schoolId: number,
    schoolName?: string
): boolean {
    const lower = message.toLowerCase();

    // Block explicit school-id lookups unless it is their own id
    const idMatches = [...lower.matchAll(/\bschool\s+id\s+(?:is\s+|which\s+is\s+|= \s*)?(\d+)\b/g)];
    for (const match of idMatches) {
        const requestedId = Number(match[1]);
        if (requestedId !== schoolId) return true;
    }

    // Also catch "id 3", "school with id 3", etc.
    const genericIdMatches = [...lower.matchAll(/\b(?:school\s+with\s+)?id\s+(\d+)\b/g)];
    for (const match of genericIdMatches) {
        const requestedId = Number(match[1]);
        if (requestedId !== schoolId) return true;
    }

    // Block questions asking for school names by id
    if (
        /\b(name of (the )?school id|what is the name of the school id|which school is id|school with id)\b/i.test(message)
    ) {
        const nums = [...message.matchAll(/\b\d+\b/g)].map((m) => Number(m[0]));
        if (nums.some((n) => n !== schoolId)) return true;
    }

    // Block rankings/comparisons/listing other schools
    if (/\b(top|bottom|rank|ranking|best|worst|compare|comparison|list|some schools|which schools)\b/i.test(message)
        && /\bschool|schools\b/i.test(message)) {
        return true;
    }

    // If we know the user's school name, block mentions of other school names
    if (schoolName) {
        const own = schoolName.toLowerCase().trim();
        const schoolNamePattern = /\b[a-z]{2,}[_ -]?school[_ -]?\d+\b/i; // catches SC_School_02 style names
        const found = message.match(schoolNamePattern);
        if (found && found[0].toLowerCase() !== own) {
            return true;
        }
    }

    return false;
}

// Express route handler: Processes chat messages and returns AI generated responses
router.post("/chat", async (req, res) => {
    const { message, history } = req.body;

    const user = (req as any).oidc?.user;
    if (!user) {
        return res.status(401).json({ error: "User not found" });
    }
    if (!db) {
        return res.status(500).json({ error: "Database not connected" });
    }

    const rawSchoolId = user?.[SCHOOL_NAMESPACE];
    const isAdmin =
        (typeof rawSchoolId === "string" && rawSchoolId.toLowerCase() === "admin") || !!(req as any).user?.isAdmin;

    const schoolId = !isAdmin
        ? typeof rawSchoolId === "number"
            ? rawSchoolId
            : typeof rawSchoolId === "string"
                ? Number(rawSchoolId)
                : NaN
        : NaN;

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message" });
    }

    if (!isAdmin && !Number.isFinite(schoolId)) {
        return res.status(403).json({ error: "Missing schoolId for school user" });
    }

    let ownSchoolName: string | undefined;
    if (!isAdmin) {
        const ownSchool = await db.collection("School").findOne(
            { ID: schoolId },
            { projection: { _id: 0, NAME_TX: 1 } }
        );
        ownSchoolName = ownSchool?.NAME_TX;
    }

    if (!isAdmin && isForbiddenSchoolLookupForSchoolUser(message, schoolId, ownSchoolName)) {
        return res.status(200).json({
            reply: "I can only provide information about your own school. I can help with your school’s data or with overall benchmark averages that do not identify other schools.",
            queryPlan: null,
            validation: null,
        });
    }

    // Block ranking queries for school users (they would leak other schools)
    const rankingReq = /\b(top|bottom|rank|ranking|best|worst)\b/i.test(message) && /\bschools?\b/i.test(message);
    if (!isAdmin && rankingReq) {
        res.status(200).json({
            reply:
                "I can’t rank or list other schools for school users. I can tell you information about your school or an average among all schools if you want.",
            queryPlan: null,
            validation: null,
        });
        return;
    }

    const abortController = new AbortController();

    try {
        const { reply, queryPlan, validation } = await answerWithData(
            message,
            history ?? [],
            isAdmin,
            abortController.signal,
            0,
            null,
            Number.isFinite(schoolId) ? schoolId : undefined
        );

        if (!res.headersSent) {
            res.status(200).json({
                reply,
                queryPlan: queryPlan ?? null,
                validation: validation ?? null,
            });
        }
    } catch (err: any) {
        if (err?.message === "Request aborted by client") {
            if (!res.headersSent) res.status(499).end();
            return;
        }
        console.error(`${AI_PROVIDER} error:`, err);
        if (!res.headersSent) {
            res.status(500).json({ error: `${AI_PROVIDER} request failed` });
        }
    }
});

export default router;
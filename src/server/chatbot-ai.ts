import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { Db } from "mongodb";
import fs from "fs";

const router = Router();

// Load AI prompt configurations from JSON file containing rules, guidelines, and examples for different user types
const configPrompts = JSON.parse(fs.readFileSync("./src/server/prompt-config.json", "utf8"));

// AI provider configuration - supports both Ollama (local) and Gemini (cloud) models
const AI_PROVIDER: "gemini" | "ollama" = "ollama";
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = "gpt-oss:120b-cloud";
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of query retry attempts

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
        const lines = Object.entries(promptObj.kpiFormulas).map(([k, v]) => `  ${k} = ${v}`).join("\n");
        parts.push("KPI FORMULAS - use these when a user asks about rates, ratios, or performance:\n" + lines);
    }

    // Output formatting rules e.g. no markdown, plain text only
    if (Array.isArray(promptObj.formattingRules)) {
        parts.push("Formatting rules:\n" + promptObj.formattingRules.map((r: string) => `- ${r}`).join("\n"));
    }

    // Maps raw field names like COMPLETED_APPLICATION_TOTAL to human readable labels
    if (promptObj.fieldTranslations && typeof promptObj.fieldTranslations === "object") {
        const lines = Object.entries(promptObj.fieldTranslations).map(([k, v]) => `  ${k} = ${v}`).join("\n");
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
    return `${basePrompt}\n\n${schema}`;
}

// Make a single-turn AI request with system prompt and user message
// Supports both Ollama (local) and Gemini (cloud) providers
async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
    if (AI_PROVIDER === "ollama") {
        const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama error: ${response.status} ${errorText}`);
        }

        const data = (await response.json()) as { choices: { message: { content: string } }[] };

        // Check if we got a valid response with content
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(`Ollama returned invalid response structure: ${JSON.stringify(data)}`);
        }

        const content = data.choices[0].message.content;
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
    return response.text ?? "";
}

// Make a multi-turn AI request with conversation history
// Normalizes message formats between Ollama and Gemini
async function callAIWithHistory(systemPrompt: string, history: any[], message: string): Promise<string> {
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
        const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: OLLAMA_MODEL, messages }),
        });
        if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
        const data = (await response.json()) as { choices: { message: { content: string } }[] };
        return data.choices[0].message.content;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            ...(Array.isArray(history) ? history : []),
            { role: "user", parts: [{ text: message }] },
        ],
        config: { systemInstruction: systemPrompt },
    });
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
async function classifyQuestion(question: string, history: any[], isAdmin: boolean): Promise<ClassificationResult> {
    console.log(`[classifyQuestion] Classifying: "${question}"`);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const classifierPrompt = compilePrompt(userPrompts.classifier);

    // Include recent history context for follow-up detection
    const historyContext = history.length > 0
        ? `\n\nRecent conversation:\n${history.slice(-4).map((h: any) => {
            const role = h.role === "model" ? "Assistant" : "User";
            const text = h.parts?.[0]?.text ?? h.content ?? "";
            return `${role}: ${text}`;
        }).join("\n")}`
        : "";

    const classifierMessage = `Question: ${question}${historyContext}`;

    try {
        const rawResponse = await callAI(classifierPrompt, classifierMessage);
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
        throw new Error(`Failed to parse JSON. Error: ${parseError.message}. JSON text: ${stripped.substring(0, 200)}...`);
    }
}

// Execute MongoDB query based on query plan (supports both find and aggregate operations)
async function executeQuery(queryPlan: QueryPlan): Promise<any[]> {
    if (!db) throw new Error("Database not connected");
    if (!queryPlan.collection) throw new Error("No collection specified");

    const collection = db.collection(queryPlan.collection);

    if (queryPlan.operation === "aggregate" && queryPlan.pipeline) {
        console.log("[executeQuery] Running aggregate with pipeline:", JSON.stringify(queryPlan.pipeline, null, 2));
        return collection.aggregate(queryPlan.pipeline).toArray();
    }

    console.log("[executeQuery] Running find with query:", JSON.stringify(queryPlan.query ?? {}, null, 2));
    let cursor = collection.find(queryPlan.query ?? {});

    if (queryPlan.projection) {
        cursor = cursor.project(queryPlan.projection);
    }

    if (queryPlan.limit) {
        cursor = cursor.limit(queryPlan.limit);
    }

    return cursor.toArray();
}

// Validate AI-generated answer against query results to ensure accuracy
// Checks for calculation errors, field mismatches, and logical inconsistencies
async function validateAnswer(
    question: string,
    queryPlan: QueryPlan,
    results: any[],
    answer: string,
    isAdmin: boolean
): Promise<ValidationResult> {
    console.log("[validateAnswer] Validating answer...");

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const validatorPrompt = compilePrompt(userPrompts.validator);

    const validationMessage = `
Original question: ${question}

Query plan used:
${JSON.stringify(queryPlan, null, 2)}

Query results (${results.length} records):
${JSON.stringify(results, null, 2)}

AI-generated answer:
${answer}

Validate whether the answer correctly interprets the data.
`;

    try {
        const rawResponse = await callAI(validatorPrompt, validationMessage);
        console.log("[validateAnswer] AI response:\n", rawResponse);

        // Check if we got an empty or invalid response
        if (!rawResponse || rawResponse.trim().length === 0) {
            console.warn("[validateAnswer] Received empty response from AI validator");
            return {
                isValid: true,
                reasoning: "Validator returned empty response, defaulting to valid"
            };
        }

        const validation = parseJsonFromAI(rawResponse);
        console.log("[validateAnswer] Validation result:", validation);

        return {
            isValid: validation.isValid ?? true,
            reasoning: validation.reasoning ?? "No reasoning provided",
            suggestedFix: validation.suggestedFix
        };
    } catch (err: any) {
        console.error("[validateAnswer] Validation error:", err);
        console.error("[validateAnswer] Error details:", err.message);
        return {
            isValid: true,
            reasoning: "Validation failed, defaulting to valid"
        };
    }
}

// Remove MongoDB-specific fields (_id) and limit result size for AI processing
function sanitiseResults(results: any[]): any[] {
    return results.slice(0, 50).map((doc) => {
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
    previousAttempt?: { queryPlan: QueryPlan; error: string }
): Promise<QueryPlan> {
    console.log("[generateQueryWithRetry] Generating query plan...");

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const queryGeneratorPrompt = compilePrompt(userPrompts.queryGenerator);
    const querySystemPrompt = await buildQueryPrompt(queryGeneratorPrompt);

    let queryMessage = question;

    // If this is a retry, include context about the previous failed attempt
    if (previousAttempt) {
        queryMessage = `
Previous query attempt FAILED with this plan:
${JSON.stringify(previousAttempt.queryPlan, null, 2)}

Error encountered: ${previousAttempt.error}

Please generate a DIFFERENT query approach for this question: ${question}

${previousAttempt.queryPlan.suggestedFix || "Try a different collection, operation type, or query structure."}
`;
    }

    const rawPlan = await callAI(querySystemPrompt, queryMessage);
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
// Steps: 1) Classify question, 2) Generate and execute query with retries, 3) Handle errors/empty results,
// 4) Generate answer from results, 5) Validate answer accuracy, 6) Retry if validation fails
async function answerWithData(
    question: string,
    history: any[],
    isAdmin: boolean,
    validationAttempt: number = 0
): Promise<{ reply: string; queryPlan: QueryPlan | null; validation?: ValidationResult }> {
    console.log(`[answerWithData] Question: "${question}" | isAdmin: ${isAdmin} | history: ${history.length} turn(s) | validationAttempt: ${validationAttempt}`);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const conversationalPrompt = compilePrompt(userPrompts.conversational);
    const interpreterSystemPrompt = compilePrompt(userPrompts.interpreter);

    // STEP 1: Classify the question
    const classification = await classifyQuestion(question, history, isAdmin);

    if (!classification.isDataQuestion) {
        console.log("[answerWithData] Not a data question, using conversational response");
        const reply = await callAIWithHistory(conversationalPrompt, history, question);
        return { reply, queryPlan: null };
    }

    // STEP 2: Generate and execute query (with retry logic)
    let queryPlan: QueryPlan | null = null;
    let results: any[] = [];
    let queryError: string | null = null;
    let attempt = 0;

    while (attempt < MAX_RETRY_ATTEMPTS) {
        attempt++;
        console.log(`[answerWithData] Query attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);

        try {
            // Generate query (with context from previous failure if retrying)
            const previousAttempt = queryError && queryPlan
                ? { queryPlan, error: queryError }
                : undefined;

            queryPlan = await generateQueryWithRetry(question, history, isAdmin, previousAttempt);

            if (!queryPlan.needsData) {
                console.log("[answerWithData] needsData=false, using conversational response");
                const reply = await callAIWithHistory(conversationalPrompt, history, question);
                return { reply, queryPlan: null };
            }

            // Execute query
            console.log(`[executeQuery] Collection: "${queryPlan.collection}" Operation: "${queryPlan.operation}"`);
            const raw = await executeQuery(queryPlan);
            results = sanitiseResults(raw);
            console.log(`[executeQuery] Returned ${results.length} document(s)`);

            // Query succeeded, break out of retry loop
            queryError = null;
            break;

        } catch (err: any) {
            queryError = err?.message ?? "Unknown error";
            console.error(`[executeQuery] Attempt ${attempt} failed:`, queryError);

            // If this was the last attempt, we'll handle the error below
            if (attempt >= MAX_RETRY_ATTEMPTS) {
                console.error("[executeQuery] Max retry attempts reached");
            }
        }
    }

    // STEP 3: Handle query failure after all retries
    if (queryError) {
        const errorMessage = `I tried multiple approaches to retrieve the data, but encountered errors. ${
            results.length === 0
                ? "The query couldn't be executed successfully. Could you rephrase your question or provide more specific details?"
                : "However, I was able to retrieve some partial results."
        }`;

        // If we have partial results, try to interpret them anyway
        if (results.length > 0) {
            const dataContext = `Query results (${results.length} record${results.length === 1 ? "" : "s"}):\n${JSON.stringify(results, null, 2)}`;
            const interpreterMessage = `User question: ${question}\n\n${dataContext}\n\nNote: This data may be incomplete due to query issues.`;
            const reply = await callAI(interpreterSystemPrompt, interpreterMessage);
            return { reply: `${errorMessage}\n\n${reply}`, queryPlan };
        }

        return { reply: errorMessage, queryPlan };
    }

    // STEP 4: Check if no results were found
    if (results.length === 0) {
        const reply = await callAI(
            interpreterSystemPrompt,
            `User question: ${question}\n\nThe query returned no results. Let the user know nothing was found and suggest why that might be (e.g., school name spelled incorrectly, no data for that year, etc.).`
        );
        return { reply, queryPlan };
    }

    // STEP 5: Generate initial answer from results
    const dataContext = `Query results (${results.length} record${results.length === 1 ? "" : "s"}):\n${JSON.stringify(results, null, 2)}`;
    const historyContext = history.length > 0
        ? `\n\nConversation history:\n${history.slice(-4).map((h: any) => {
            const role = h.role === "model" ? "Assistant" : "User";
            const text = h.parts?.[0]?.text ?? h.content ?? "";
            return `${role}: ${text}`;
        }).join("\n")}`
        : "";

    const interpreterMessage = `User question: ${question}${historyContext}\n\n${dataContext}`;
    let reply = await callAI(interpreterSystemPrompt, interpreterMessage);

    // STEP 6: Validate the answer (only if we haven't exceeded validation attempts)
    if (validationAttempt < MAX_RETRY_ATTEMPTS) {
        const validation = await validateAnswer(question, queryPlan!, results, reply, isAdmin);

        if (!validation.isValid) {
            console.log(`[answerWithData] Answer validation failed (attempt ${validationAttempt + 1}/${MAX_RETRY_ATTEMPTS}), attempting to regenerate query`);

            // Store the suggested fix in the query plan for the retry
            if (validation.suggestedFix && queryPlan) {
                (queryPlan as any).suggestedFix = validation.suggestedFix;
            }

            // Recursive call with incremented validation attempt counter
            return answerWithData(question, history, isAdmin, validationAttempt + 1);
        }

        console.log(`[answerWithData] Final answer generated (valid=${validation.isValid})`);
        return { reply, queryPlan, validation };
    } else {
        // Max validation attempts reached, return answer anyway with a warning
        console.log(`[answerWithData] Max validation attempts (${MAX_RETRY_ATTEMPTS}) reached, accepting answer despite validation concerns`);
        const validation: ValidationResult = {
            isValid: false,
            reasoning: "Maximum validation attempts reached, answer accepted by default"
        };
        return { reply, queryPlan, validation };
    }
}

// Express route handler: Processes chat messages and returns AI-generated responses
// Accepts message text, conversation history, and admin flag
router.post("/chat", async (req, res) => {
    const { message, history, isAdmin } = req.body;

    console.log("[chat] message:", message);
    console.log("[chat] history length:", history?.length ?? 0);
    console.log("[chat] isAdmin:", isAdmin);

    if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Missing or invalid message" });
        return;
    }

    try {
        const { reply, queryPlan, validation } = await answerWithData(message, history ?? [], !!isAdmin);
        res.status(200).json({
            reply,
            queryPlan: queryPlan ?? null,
            validation: validation ?? null
        });
    } catch (err) {
        console.error(`${AI_PROVIDER} error:`, err);
        res.status(500).json({ error: `${AI_PROVIDER} request failed` });
    }
});

export default router;
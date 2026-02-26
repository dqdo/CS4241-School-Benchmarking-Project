import { GoogleGenAI } from "@google/genai";
import { Router } from "express";
import { Db } from "mongodb";
import fs from "fs";

const router = Router();

const configPrompts = JSON.parse(fs.readFileSync("./src/server/prompt-config.json", "utf8"));

const AI_PROVIDER: "gemini" | "ollama" = "gemini";
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = "deepseek-r1:8b";

let db: Db | undefined;

export function setDb(database: Db) {
    // Called once by main.ts after MongoDB connects
    db = database;
    fetchLiveSchema()
        .then((schema) => console.log("[schema]\n", schema))
        .catch((err) => console.error("[schema] Failed to fetch on startup:", err));
}

function compilePrompt(promptObj: Record<string, any>): string {
    // Assembles a structured prompt config object into a single string for the AI
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

    return parts.join("\n\n");
}

async function fetchLiveSchema(): Promise<string> {
    // Samples documents from each collection to discover field names dynamically
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

async function buildQueryPrompt(basePrompt: string): Promise<string> {
    // Appends the live schema to the query generator prompt so the AI knows what fields exist
    const schema = await fetchLiveSchema();
    return `${basePrompt}\n\n${schema}`;
}

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
    // Single-turn call — used for query generation and result interpretation
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
        if (!response.ok) throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
        const data = (await response.json()) as { choices: { message: { content: string } }[] };
        return data.choices[0].message.content;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        config: { systemInstruction: systemPrompt },
    });
    return response.text ?? "";
}

async function callAIWithHistory(systemPrompt: string, history: any[], message: string): Promise<string> {
    // Multi-turn call — includes prior conversation so the AI can handle follow-up questions
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

interface QueryPlan {
    needsData: boolean;
    collection?: string;
    operation?: "find" | "aggregate";
    query?: Record<string, any>;
    projection?: Record<string, any>;
    pipeline?: any[];
    limit?: number;
}

async function executeQuery(plan: QueryPlan): Promise<any[]> {
    // Runs the AI-generated query plan against MongoDB, capped at 50 documents
    if (!db) throw new Error("Database not connected");

    const collection = db.collection(plan.collection!);
    const limit = Math.min(plan.limit ?? 50, 50);

    if (plan.operation === "aggregate" && Array.isArray(plan.pipeline)) {
        const hasLimit = plan.pipeline.some((s) => "$limit" in s);
        const pipeline = hasLimit ? plan.pipeline : [...plan.pipeline, { $limit: limit }];
        return collection.aggregate(pipeline).toArray();
    }

    return collection.find(plan.query ?? {}, { projection: plan.projection ?? {} }).limit(limit).toArray();
}

function sanitiseResults(results: any[]): any[] {
    // Removes MongoDB's internal _id field before passing results to the AI
    return results.map(({ _id, ...rest }) => rest);
}

function parseJsonFromAI(raw: string): any {
    // Extracts a JSON object from the AI response, handling markdown fences and leading prose
    const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    try {
        return JSON.parse(stripped);
    } catch {
        // If direct parse fails, find the first { ... } block in the response
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
            try {
                return JSON.parse(raw.slice(start, end + 1));
            } catch {
                // fall through
            }
        }
        console.error("[parseJsonFromAI] Could not extract JSON:\n", raw);
        throw new Error("AI response was not valid JSON");
    }
}

async function answerWithData(question: string, history: any[], isAdmin: boolean): Promise<string> {
    // Main pipeline: generate query → execute against MongoDB → interpret results into natural language
    console.log(`[answerWithData] Question: "${question}" | isAdmin: ${isAdmin} | history: ${history.length} turn(s)`);

    const userPrompts = isAdmin ? configPrompts.admin : configPrompts.schoolUser;
    const conversationalPrompt = compilePrompt(userPrompts.conversational);
    const querySystemPrompt = await buildQueryPrompt(compilePrompt(userPrompts.queryGenerator));
    const interpreterSystemPrompt = compilePrompt(userPrompts.interpreter);

    // Step 1: Ask the AI to produce a MongoDB query plan as JSON
    let queryPlan: QueryPlan;
    try {
        const rawPlan = await callAI(querySystemPrompt, question);
        console.log("[rawPlan] AI response:\n", rawPlan);

        if (!rawPlan.trim().startsWith("{")) {
            // Model returned prose instead of JSON, fall back to conversational
            console.warn("[queryPlan] Response is not JSON — falling back to conversational");
            return callAIWithHistory(conversationalPrompt, history, question);
        }

        queryPlan = parseJsonFromAI(rawPlan);
        console.log("[queryPlan] Parsed:\n", JSON.stringify(queryPlan, null, 2));
    } catch (err) {
        console.error("[queryPlan] Failed:", err);
        return callAIWithHistory(conversationalPrompt, history, question);
    }

    // Step 2: If the question doesn't need data, answer from conversation history
    if (!queryPlan.needsData) {
        console.log("[queryPlan] needsData=false → going conversational");
        return callAIWithHistory(conversationalPrompt, history, question);
    }

    // Step 3: Execute the query against MongoDB
    console.log(`[executeQuery] Collection: "${queryPlan.collection}"  Operation: "${queryPlan.operation}"`);
    if (queryPlan.operation === "aggregate") {
        console.log("[executeQuery] Pipeline:\n", JSON.stringify(queryPlan.pipeline, null, 2));
    } else {
        console.log("[executeQuery] Query:", JSON.stringify(queryPlan.query));
        console.log("[executeQuery] Projection:", JSON.stringify(queryPlan.projection));
    }

    let results: any[] = [];
    let queryError: string | null = null;
    try {
        const raw = await executeQuery(queryPlan);
        results = sanitiseResults(raw);
        console.log(`[executeQuery] Returned ${results.length} document(s)`);
        console.log("[executeQuery] Full results:\n", JSON.stringify(results, null, 2));
    } catch (err: any) {
        console.error("[executeQuery] Failed:", err);
        queryError = err?.message ?? "Unknown error";
    }

    // Step 4: Ask the AI to turn the raw results into a plain English response
    const dataContext = queryError
        ? `The query failed with error: ${queryError}. Please tell the user there was a problem retrieving the data.`
        : results.length === 0
            ? `The query returned no results. Let the user know nothing was found for their question.`
            : `Query results (${results.length} record${results.length === 1 ? "" : "s"}):\n${JSON.stringify(results, null, 2)}`;

    const historyContext = history.length > 0
        ? `\n\nConversation so far:\n${history.map((h: any) => {
            const role = h.role === "model" ? "Assistant" : "User";
            const text = h.parts?.[0]?.text ?? h.content ?? "";
            return `${role}: ${text}`;
        }).join("\n")}`
        : "";

    const interpreterMessage = `User question: ${question}${historyContext}\n\n${dataContext}`;
    return callAI(interpreterSystemPrompt, interpreterMessage);
}

router.post("/chat", async (req, res) => {
    // Entry point for all chat messages from the frontend
    const { message, history, isAdmin } = req.body;

    console.log("[chat] message:", message);
    console.log("[chat] history length:", history?.length ?? 0);
    console.log("[chat] isAdmin:", isAdmin);

    if (!message || typeof message !== "string") {
        res.status(400).json({ error: "Missing or invalid message" });
        return;
    }

    try {
        const reply = await answerWithData(message, history ?? [], !!isAdmin);
        res.status(200).json({ reply });
    } catch (err) {
        console.error(`${AI_PROVIDER} error:`, err);
        res.status(500).json({ error: `${AI_PROVIDER} request failed` });
    }
});

export default router;
import {GoogleGenAI} from "@google/genai";
import {Router} from "express";
import fs from 'fs';

const router = Router();

const prompts = fs.readFileSync('./src/server/prompt-config.json', 'utf8');
const configPrompts = JSON.parse(prompts);

// Receives a user message + history, calls Gemini via the SDK, and returns the AI reply
router.post("/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
        res.status(400).json({error: "Missing or invalid message"});
        return;
    }

    // Initialised here so dotenv.config() in main.ts has already run
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

    const contents = [
        ...(Array.isArray(history) ? history : []),
        { role: "user", parts: [{ text: message }] },
    ];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                systemInstruction: configPrompts.admin
            }
        });

        res.status(200).json({reply: response.text});
    } catch (err) {
        console.error("Gemini error:", err);
        res.status(500).json({error: "Gemini request failed"});
    }
});

export default router;
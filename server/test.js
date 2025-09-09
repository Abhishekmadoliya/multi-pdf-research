
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Init new GenAI client (for chat/LLM)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: "Hello, world!" }]
    });
    console.log("Job added to queue:", res.text);
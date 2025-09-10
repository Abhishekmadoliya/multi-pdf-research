import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";
import { createUserContent, GoogleGenAI } from "@google/genai";

// import { ChatGoogle } from "@langchain/google-gauth";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { log } from "console";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const app = express();
const port = 8000;

// Queue setup for file processing
const queue = new Queue("pdf-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

// Init new GenAI client (for chat/LLM)
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Multer storage for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Hello World!"));

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.file.mimetype || !req.file.mimetype.includes("pdf")) {
      return res.status(400).json({ error: "Uploaded file must be a PDF" });
    }

    // Add job to queue
    await queue.add("file-ready", {
      filename: req.file.originalname,
      source: req.file.destination,
      path: req.file.path,
    });

    res.status(200).json({
      message: "File uploaded successfully",
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process file upload" });
  }
});

// Chat route with retriever
app.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: GEMINI_API_KEY,
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "testing2",
      }
    );

    const retriever = vectorStore.asRetriever({ k: 2 });
    const results = await retriever.invoke(query);

    let prompt = ` You are an AI research assistant. Your task is to analyze information from multiple PDFs and web sources. 
      Use the provided context carefully to generate a clear, accurate, and insightful answer to the user’s query. 
      If the information is incomplete or missing, state this honestly and suggest what additional data might help.

      Context:
      ${results.map((doc) => doc.pageContent).join("\n")}

      Question: "${query}"

      Instructions:
      - Focus only on information relevant to the question.
      - Extract key insights, facts, and reasoning rather than just copying text.
      - Summarize findings concisely but with enough depth to be useful.
      - If multiple documents disagree, highlight the differences.
      - Provide valuable insights and actionable conclusions whenever possible.
      - Maintain a professional and neutral tone.
      - avoid symbols like * and - in your response.
      - If you don't know the answer, just say you don't know. or dont have context about this . Don't try to make up an answer.
      - avoid using " Based on the provided context" every time in your response.
      - use clear and concise language to convey your message.
      - Ensure the final answer is well-structured and easy to understand. `;

    // const response = await ai.generateContent(prompt);
    // console.log("prompt",prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    console.log("Gemini res", response.text);

    // if (!res || !res.contents || res.contents.length === 0) {
    //   throw new Error('Invalid response from Gemini');
    // }

    // const text = response.contents[0].text;
    const result = response.text;

    return res.json({
      // message: text,
      result: result,
      query,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

// Start server
app.listen(port, () =>
  console.log(`🚀 Server running at http://localhost:${port}`)
);

import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";
import { createUserContent, GoogleGenAI } from "@google/genai";
// import { ChatGoogle } from "@langchain/google-gauth";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

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

// Root
app.get("/", (req, res) => res.send("Hello World!"));

// Upload route
app.post("/upload/pdf", upload.single("pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  // Add uploaded file to BullMQ queue
  queue.add("file-ready", {
    filename: req.file.originalname,
    source: req.file.destination,
    path: req.file.path,
  });

  res.send("File uploaded successfully!");
});

// Chat route with retriever
app.get("/chat", async (req, res) => {
  const userQuery = "What is the content of the PDF?";

  // 🔹 Embeddings with LangChain (still old SDK internally)
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004", // latest embedding model
    apiKey: GEMINI_API_KEY,
  });

  // 🔹 Connect to Qdrant
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: "http://localhost:6333",
    collectionName: "testing",
  });

  const retriever = vectorStore.asRetriever({ k: 2 });
  const results = await retriever.invoke(userQuery);

  // 🔹 Prepare system prompt with retrieved docs
  const SYSTEM_PROMPT = `You are a helpful assistant who answers based on the retrieved PDF context: 
  ${JSON.stringify(results, null, 2)}`;

//   const model = new ChatGoogle({
//     apiKey: GEMINI_API_KEY,
//   model: "gemma-3-27b-it",
// }); 

// const res = await model.invoke([
//   {
//     role: "user",
//     content:
//       "What would be a good company name for a company that makes colorful socks?",
//   },
// ]);

  // 🔹 Call Gemini with new SDK
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // fast model
    contents:[
      createUserContent(userQuery),
      // createSystemContent(SYSTEM_PROMPT)
    ]
  });
 

  return res.json({
    message: response.text,
    context: results,
  });
});

// Start server
app.listen(port, () =>
  console.log(`🚀 Server running at http://localhost:${port}`)
);

import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import fetch from "node-fetch"; // needed to check Qdrant collections
import "dotenv/config"; // load .env file

const QUEUE_NAME = "pdf-upload-queue";
const COLLECTION_NAME = "testing";
const QDRANT_URL = "http://localhost:6333";

// ---------- Worker ----------
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`📄 Processing job:`, job.data);

    const data = typeof job.data === "string" ? JSON.parse(job.data) : job.data;

    // 1. Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    console.log(`✅ Loaded ${docs.length} docs from PDF`);

    // 2. Split into smaller chunks
    const textSplitter = new CharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`✅ Split into ${splitDocs.length} chunks`);

    if (splitDocs.length === 0) {
      console.error("❌ No chunks created. Check PDF path or content.");
      return;
    }

    // 3. Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
      apiKey: process.env.GOOGLE_API_KEY, // from .env
    });

    // 4. Check if Qdrant collection exists
    let vectorStore;
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);

    if (res.ok) {
      // ✅ Collection exists → add documents
      vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: QDRANT_URL,
          collectionName: COLLECTION_NAME,
        }
      );
      await vectorStore.addDocuments(splitDocs);
      console.log("✅ Docs added to existing collection in Qdrant");
    } else {
      // ❌ Collection missing → create new one
      vectorStore = await QdrantVectorStore.fromDocuments(
        splitDocs,
        embeddings,
        {
          url: QDRANT_URL,
          collectionName: COLLECTION_NAME,
        }
      );
      console.log("✅ New collection created and docs added to Qdrant");
    }
  },
  {
    concurrency: 5, 
    connection: {
      host: "localhost",
      port: 6379, 
    },
  }
);

// ---------- Worker Events ----------
worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

import { Queue } from "bullmq";

const queue = new Queue("pdf-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});

await queue.add("pdf-job", { path: "./example.pdf" });
console.log("📌 Job added to queue");
process.exit(0);

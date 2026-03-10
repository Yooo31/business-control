import { drainQueuedScanJobs } from "@/features/scanner/worker";

const result = await drainQueuedScanJobs();

console.info(`Processed ${String(result.processedJobs)} queued scan jobs.`);

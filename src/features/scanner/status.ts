import { ScanBatchStatus, type ScanJobStatus } from "@/generated/prisma/client";

export function summarizeScanBatchStatus(statuses: ScanJobStatus[]) {
  if (statuses.some((status) => status === "RUNNING")) {
    return ScanBatchStatus.RUNNING;
  }

  if (statuses.some((status) => status === "QUEUED")) {
    return ScanBatchStatus.QUEUED;
  }

  if (statuses.some((status) => status === "FAILED")) {
    return ScanBatchStatus.FAILED;
  }

  return ScanBatchStatus.COMPLETED;
}

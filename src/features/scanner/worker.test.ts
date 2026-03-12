import { beforeEach, describe, expect, it, vi } from "vitest";

const { discoverMock, prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    platformListing: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    scanBatch: {
      update: vi.fn(),
    },
    scanJob: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  discoverMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/scanner/platform-scanners", () => ({
  getPlatformScanner: vi.fn(() => ({
    discover: discoverMock,
    fetch: vi.fn(),
    normalize: vi.fn(),
  })),
}));

import {
  drainQueuedScanJobs,
  processQueuedScanJobs,
} from "@/features/scanner/worker";

type FindManyArgs = {
  where: Record<string, unknown>;
};

function createQueuedJob(id: string, scanBatchId: string) {
  return {
    id,
    scanBatchId,
    businessId: `business-${id}`,
    platform: "GOOGLE",
    status: "QUEUED",
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2026-03-10T10:00:00.000Z"),
    updatedAt: new Date("2026-03-10T10:00:00.000Z"),
    discoveryCandidates: null,
    platformListingId: null,
    business: {
      id: `business-${id}`,
      userId: "user-1",
      name: `Company ${id}`,
      legalName: null,
      siren: null,
      siret: null,
      addressLine: "10 Rue de Paris",
      postalCode: "75001",
      city: "Paris",
      phone: "06 12 34 56 78",
      email: "contact@example.com",
      website: "https://example.com",
      activity: null,
      createdAt: new Date("2026-03-10T10:00:00.000Z"),
      updatedAt: new Date("2026-03-10T10:00:00.000Z"),
    },
  };
}

describe("scanner worker", () => {
  beforeEach(() => {
    discoverMock.mockReset();
    prismaMock.$transaction.mockReset();
    prismaMock.platformListing.create.mockReset();
    prismaMock.platformListing.findUnique.mockReset();
    prismaMock.platformListing.update.mockReset();
    prismaMock.platformListing.upsert.mockReset();
    prismaMock.scanBatch.update.mockReset();
    prismaMock.scanJob.findMany.mockReset();
    prismaMock.scanJob.update.mockReset();
    prismaMock.scanJob.updateMany.mockReset();
  });

  it("counts failed claimed jobs as processed", async () => {
    discoverMock.mockRejectedValue(new Error("scanner failed"));
    prismaMock.scanJob.findMany.mockImplementation((args: FindManyArgs) => {
      if ("status" in args.where) {
        return Promise.resolve([createQueuedJob("job-1", "batch-1")]);
      }

      return Promise.resolve([{ status: "FAILED" }]);
    });
    prismaMock.scanJob.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.scanJob.update.mockResolvedValue({});
    prismaMock.scanBatch.update.mockResolvedValue({});
    prismaMock.platformListing.findUnique.mockResolvedValue(null);
    prismaMock.platformListing.upsert.mockResolvedValue({});

    const result = await processQueuedScanJobs({
      logger: { error: vi.fn(), info: vi.fn() },
    });
    const updateCalls = prismaMock.scanJob.update.mock.calls as Array<
      [{ data: { errorMessage?: string; status?: string } }]
    >;
    const failedUpdate = updateCalls.at(-1);

    expect(result).toEqual({ processedJobs: 1 });
    expect(failedUpdate?.[0].data.errorMessage).toBe("scanner failed");
    expect(failedUpdate?.[0].data.status).toBe("FAILED");
  });

  it("keeps draining after a failed batch until no queued jobs remain", async () => {
    const queuedFinds = [
      [
        createQueuedJob("job-1", "batch-1"),
        createQueuedJob("job-2", "batch-1"),
      ],
      [createQueuedJob("job-3", "batch-2")],
      [],
    ];

    discoverMock.mockRejectedValue(new Error("scanner failed"));
    prismaMock.scanJob.findMany.mockImplementation((args: FindManyArgs) => {
      if ("status" in args.where) {
        return Promise.resolve(queuedFinds.shift() ?? []);
      }

      return Promise.resolve([{ status: "FAILED" }]);
    });
    prismaMock.scanJob.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.scanJob.update.mockResolvedValue({});
    prismaMock.scanBatch.update.mockResolvedValue({});
    prismaMock.platformListing.findUnique.mockResolvedValue(null);
    prismaMock.platformListing.upsert.mockResolvedValue({});

    const result = await drainQueuedScanJobs({
      limit: 2,
      logger: { error: vi.fn(), info: vi.fn() },
    });

    expect(result).toEqual({ processedJobs: 3 });
    expect(prismaMock.scanJob.updateMany).toHaveBeenCalledTimes(3);
  });
});

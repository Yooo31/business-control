import { after, type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createScanForAllBusinesses,
  createScanForBusinesses,
  listSupportedPlatforms,
  serializeScanJobPlatform,
} from "@/features/scanner/orchestration";
import { triggerQueuedScanJobs } from "@/features/scanner/worker";
import { auth } from "@/lib/auth";

const scanRequestSchema = z
  .object({
    businessId: z.string().trim().min(1).optional(),
    businessIds: z.array(z.string().trim().min(1)).optional(),
    allBusinesses: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const hasSingleBusinessId = typeof value.businessId === "string";
    const hasBusinessIds =
      Array.isArray(value.businessIds) && value.businessIds.length > 0;
    const hasAllBusinesses = value.allBusinesses === true;

    if (!hasSingleBusinessId && !hasBusinessIds && !hasAllBusinesses) {
      ctx.addIssue({
        code: "custom",
        message: "Provide businessId, businessIds, or allBusinesses=true.",
      });
    }
  });

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsedBody = scanRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: "Invalid scan payload.",
        issues: z.treeifyError(parsedBody.error),
      },
      { status: 422 },
    );
  }

  try {
    const result = parsedBody.data.allBusinesses
      ? await createScanForAllBusinesses(session.user.id)
      : await createScanForBusinesses({
          organizationId: session.user.id,
          businessIds: [
            ...(parsedBody.data.businessId ? [parsedBody.data.businessId] : []),
            ...(parsedBody.data.businessIds ?? []),
          ],
        });

    after(() => triggerQueuedScanJobs());

    return NextResponse.json({
      scanBatchId: result.scanBatchId,
      businessIds: result.businessIds,
      supportedPlatforms: listSupportedPlatforms(),
      jobs: result.jobs.map((job) => ({
        id: job.id,
        businessId: job.businessId,
        platform: serializeScanJobPlatform(job.platform),
        status: job.status.toLowerCase(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create scan batch.",
      },
      { status: 400 },
    );
  }
}

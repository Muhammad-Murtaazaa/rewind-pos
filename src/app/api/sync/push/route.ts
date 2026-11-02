import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const record = await request.json();

    // Idempotent processing based on client UUID
    // When connected to PostgreSQL via Prisma, we upsert based on record.id
    console.log(`[Sync Engine] Received offline event: ${record.event_type} (${record.id})`);

    return NextResponse.json({
      success: true,
      id: record.id,
      synced_at: new Date().toISOString(),
      status: "ACKNOWLEDGED",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process outbox sync" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Orders API active",
  });
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    return NextResponse.json({
      success: true,
      order: orderData,
      status: "CONFIRMED",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

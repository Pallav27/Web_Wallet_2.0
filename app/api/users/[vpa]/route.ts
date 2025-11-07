import { NextResponse } from "next/server";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/user";

export async function GET(_: Request, context: any) {
  try {
    const params = context?.params;
    const resolvedParams = typeof params?.then === "function" ? await params : params;
    const { vpa } = resolvedParams || {};
    if (!vpa) return NextResponse.json({ error: "Missing vpa" }, { status: 400 });

    await mongooseConnect();

    const user = await User.findOne({ vpa }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { mongooseConnect } from "@/lib/mongoose";
import RequestModel from "@/models/request";
import User from "@/models/user";

export async function POST(req: Request) {
  try {
    const auth = getAuth(req as any);
    if (!auth.userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { toVpa, amount, message } = body;
    if (!toVpa || !amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid payload (toVpa, amount required)" }, { status: 400 });
    }

    await mongooseConnect();
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(auth.userId);
    const email = (clerkUser?.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Email not found on Clerk user" }, { status: 400 });

    const requester = await User.findOne({ email: email.toLowerCase() });
    if (!requester) return NextResponse.json({ error: "Requester account not found" }, { status: 404 });

    const recipient = await User.findOne({ vpa: toVpa });
    if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

    const reqDoc = await RequestModel.create({
      fromVpa: requester.vpa,
      toVpa: recipient.vpa,
      amount,
      message: message ?? "",
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json({ request: reqDoc }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const auth = getAuth(req as any);
    if (!auth.userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await mongooseConnect();
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(auth.userId);
    const email = (clerkUser?.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Email not found on Clerk user" }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // return pending requests for this user (incoming)
    const incoming = await RequestModel.find({ toVpa: user.vpa, status: "pending" }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ requests: incoming }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

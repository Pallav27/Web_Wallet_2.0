import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/user";
import Transaction from "@/models/transaction";

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

    // fetch transactions where this user is sender or recipient
    const txs = await Transaction.find({ $or: [{ fromVpa: user.vpa }, { toVpa: user.vpa }] }).sort({ createdAt: -1 }).lean();

    // annotate direction relative to user
    const annotated = txs.map((t) => ({
      ...t,
      direction: t.fromVpa === user.vpa ? "debit" : "credit",
    }));

    return NextResponse.json({ transactions: annotated }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

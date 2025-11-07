import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/user";
import Transaction from "@/models/transaction";

function makeTxId() {
  return Math.random().toString(36).slice(2, 12);
}

export async function POST(req: Request) {
  try {
    const auth = getAuth(req as any);
    if (!auth.userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { toVpa, amount } = body;
    if (!toVpa || !amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid payload (toVpa, amount required)" }, { status: 400 });
    }

    await mongooseConnect();

  // get caller's email from Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(auth.userId);
    const email = (clerkUser?.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Email not found on Clerk user" }, { status: 400 });

    // find sender and recipient
    const sender = await User.findOne({ email: email.toLowerCase() });
    if (!sender) return NextResponse.json({ error: "Sender account not found" }, { status: 404 });

    const recipient = await User.findOne({ vpa: toVpa });
    if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

    // Start mongoose transaction
    const session = await User.db.startSession();
    session.startTransaction();
    try {
      // reload with session and optimistic checks
      const s = await User.findById(sender._id).session(session).exec();
      const r = await User.findById(recipient._id).session(session).exec();

      if (!s || !r) throw new Error("Accounts disappeared");

      if (s.balance < amount) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
      }

      s.balance = +(s.balance - amount).toFixed(2);
      r.balance = +(r.balance + amount).toFixed(2);

      await s.save({ session });
      await r.save({ session });

      const tx = await Transaction.create([
        {
          txId: makeTxId(),
          fromVpa: s.vpa,
          toVpa: r.vpa,
          amount,
          status: "completed",
          createdAt: new Date(),
          balanceAfterFrom: s.balance,
          balanceAfterTo: r.balance,
        },
      ], { session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({ success: true, transaction: tx[0] }, { status: 200 });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

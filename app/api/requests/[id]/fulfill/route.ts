import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { mongooseConnect } from "@/lib/mongoose";
import RequestModel from "@/models/request";
import User from "@/models/user";
import Transaction from "@/models/transaction";

function makeTxId() {
  return Math.random().toString(36).slice(2, 12);
}

export async function POST(req: Request, context: any) {
  try {
    const auth = getAuth(req as any);
    if (!auth.userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const params = context?.params;
    const resolvedParams = typeof params?.then === "function" ? await params : params;
    const { id } = resolvedParams || {};
    if (!id) return NextResponse.json({ error: "Missing request id" }, { status: 400 });

    await mongooseConnect();
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(auth.userId);
    const email = (clerkUser?.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Email not found on Clerk user" }, { status: 400 });

    const fulfiller = await User.findOne({ email: email.toLowerCase() });
    if (!fulfiller) return NextResponse.json({ error: "Fulfiller account not found" }, { status: 404 });

    const reqDoc = await RequestModel.findById(id);
    if (!reqDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (reqDoc.toVpa !== fulfiller.vpa) return NextResponse.json({ error: "Not authorized to fulfill this request" }, { status: 403 });
    if (reqDoc.status !== "pending") return NextResponse.json({ error: "Request already processed" }, { status: 400 });

    const requester = await User.findOne({ vpa: reqDoc.fromVpa });
    if (!requester) return NextResponse.json({ error: "Requester not found" }, { status: 404 });

    // Start transaction: deduct from fulfiller, credit requester, record transaction, update request
    const session = await User.db.startSession();
    session.startTransaction();
    try {
      const f = await User.findById(fulfiller._id).session(session).exec();
      const r = await User.findById(requester._id).session(session).exec();
      if (!f || !r) throw new Error("Accounts disappeared during fulfill");

      if (f.balance < reqDoc.amount) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({ error: "Insufficient funds to fulfill request" }, { status: 400 });
      }

      f.balance = +(f.balance - reqDoc.amount).toFixed(2);
      r.balance = +(r.balance + reqDoc.amount).toFixed(2);

      await f.save({ session });
      await r.save({ session });

      const tx = await Transaction.create([
        {
          txId: makeTxId(),
          fromVpa: f.vpa,
          toVpa: r.vpa,
          amount: reqDoc.amount,
          status: "completed",
          createdAt: new Date(),
          balanceAfterFrom: f.balance,
          balanceAfterTo: r.balance,
        },
      ], { session });

      reqDoc.status = "fulfilled";
      reqDoc.fulfilledAt = new Date();
      reqDoc.fulfilledTxId = tx[0].txId;
      await reqDoc.save({ session });

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json({ success: true, transaction: tx[0], request: reqDoc }, { status: 200 });
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

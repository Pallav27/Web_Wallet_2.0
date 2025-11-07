import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mongooseConnect } from "@/lib/mongoose";
import User, { IUser } from "@/models/user";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

interface CreateUserBody {
  name?: string;
  branch?: string;
  email?: string; // gmail provided by Clerk on the client side
  clerkId?: string;
}

function randomAccountNumber() {
  return Array.from({ length: 12 })
    .map(() => Math.floor(Math.random() * 10))
    .join("");
}

function randomBalance() {
  return +(Math.random() * 10000).toFixed(2);
}

function randomVpa() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s}@webwallet`;
}

export async function POST(req: NextRequest) {
  try {
    // require Clerk auth
    const auth = getAuth(req as any);
    if (!auth.userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(auth.userId);
    const email = (clerkUser?.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) || clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return NextResponse.json({ error: "Clerk user has no email" }, { status: 400 });

    const body: CreateUserBody = await req.json().catch(() => ({} as CreateUserBody));

    await mongooseConnect();

    // If user already exists with this email, return it
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json({ user: existing }, { status: 200 });
    }

    // create unique accountNumber and vpa
    let accountNumber = randomAccountNumber();
    let tries = 0;
    while (await User.findOne({ accountNumber }) && tries < 6) {
      accountNumber = randomAccountNumber();
      tries++;
    }

    let vpa = randomVpa();
    tries = 0;
    while (await User.findOne({ vpa }) && tries < 6) {
      vpa = randomVpa();
      tries++;
    }

    const newUserData: Partial<IUser> = {
      name: body.name ?? clerkUser.firstName ?? clerkUser.fullName ?? "",
      email: email.toLowerCase(),
      clerkId: auth.userId,
      branch: body.branch ?? "Main Branch",
      accountNumber,
      balance: randomBalance(),
      vpa,
      createdAt: new Date(),
    };

    const created = await User.create(newUserData);

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

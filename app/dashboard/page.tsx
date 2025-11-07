"use client"

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import SwitchButton from "@/components/kokonutui/switch-button";
import AppleActivityCard from "@/components/kokonutui/apple-activity-card";
import ParticleButton from "@/components/kokonutui/particle-button";
import { UserButton } from "@clerk/nextjs";

type UserDoc = {
  _id?: string;
  name: string;
  email: string;
  branch: string;
  accountNumber: string;
  balance: number;
  vpa: string;
};

type Tx = {
  _id?: string;
  txId: string;
  fromVpa: string;
  toVpa: string;
  amount: number;
  createdAt: string;
  balanceAfterFrom?: number;
  balanceAfterTo?: number;
};

type Req = {
  _id?: string;
  fromVpa: string;
  toVpa: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [isDark, setIsDark] = useState<boolean>(true);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      } else {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    } catch (e) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch (e) {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch (e) {}
    }
  };

  useEffect(() => {
    // ensure server has a user record for this Clerk user
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // create or fetch user record (server reads Clerk auth)
        const res = await fetch("/api/users", { method: "POST" });
        const data = await res.json();
        if (data?.user) setUserDoc(data.user);

        // fetch transactions and requests
        const tRes = await fetch("/api/transactions");
        const tjson = await tRes.json();
        setTransactions(tjson?.transactions ?? []);

        const rRes = await fetch("/api/requests");
        const rjson = await rRes.json();
        setRequests(rjson?.requests ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const refreshData = async () => {
    try {
      const [uRes, tRes, rRes] = await Promise.all([
        fetch("/api/users", { method: "POST" }),
        fetch("/api/transactions"),
        fetch("/api/requests"),
      ]);
      const ud = await uRes.json();
      const td = await tRes.json();
      const rd = await rRes.json();
      if (ud?.user) setUserDoc(ud.user);
      setTransactions(td?.transactions ?? []);
      setRequests(rd?.requests ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  // computed activity data
  const debitSum = transactions.filter((t) => t.fromVpa === userDoc?.vpa).reduce((s, t) => s + t.amount, 0);
  const creditSum = transactions.filter((t) => t.toVpa === userDoc?.vpa).reduce((s, t) => s + t.amount, 0);
  const total = debitSum + creditSum;

  // send money
  const [sendVpa, setSendVpa] = useState("");
  const [sendAmount, setSendAmount] = useState<number | "">("");
  const [reqVpa, setReqVpa] = useState("");
  const [reqAmount, setReqAmount] = useState<number | "">("");
  const [reqMessage, setReqMessage] = useState("");

  const doSend = async () => {
    if (!sendVpa || !sendAmount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transfer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toVpa: sendVpa, amount: Number(sendAmount) }) });
      const j = await res.json();
      if (j?.success) {
        await refreshData();
        setSendVpa("");
        setSendAmount("");
      } else {
        alert(j?.error || "Transfer failed");
      }
    } catch (e) {
      console.error(e);
      alert("Transfer error");
    } finally { setLoading(false); }
  };

  const doRequest = async () => {
    if (!reqVpa || !reqAmount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toVpa: reqVpa, amount: Number(reqAmount), message: reqMessage }) });
      const j = await res.json();
      if (j?.request) {
        await refreshData();
        setReqVpa("");
        setReqAmount("");
        setReqMessage("");
      } else {
        alert(j?.error || "Request failed");
      }
    } catch (e) {
      console.error(e);
      alert("Request error");
    } finally { setLoading(false); }
  };

  const fulfillRequest = async (id: string) => {
    if (!confirm("Fulfill this request?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}/fulfill`, { method: "POST" });
      const j = await res.json();
      if (j?.success) {
        await refreshData();
      } else {
        alert(j?.error || "Fulfill failed");
      }
    } catch (e) { console.error(e); alert("Fulfill error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen p-6 flex flex-col text-base">
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-white/5 backdrop-blur-sm dark:bg-black/20">
          <SwitchButton onClick={toggleTheme} aria-label="Toggle theme" />
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-white/5 backdrop-blur-sm dark:bg-black/20">
          <UserButton />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

  <div className="grid grid-cols-3 gap-6 auto-rows-fr flex-1">
        {/* Left: user details + activity */}
        <div className="flex flex-col h-full gap-4">
          <div className="p-6 rounded-lg bg-white/5 border border-white/5 flex-3 text-center">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            {userDoc ? (
              <div className="space-y-3 flex flex-col items-center">
                <div className="text-2xl md:text-3xl font-extrabold">{userDoc.name}</div>
                <div className="text-sm text-zinc-400">{userDoc.branch}</div>
                <div className="text-lg md:text-xl mt-2 text-emerald-400 font-semibold">₹{userDoc.balance.toFixed(2)}</div>
                <div className="text-sm text-zinc-400 break-all">VPA: <span className="font-mono text-xs">{userDoc.vpa}</span></div>
              </div>
            ) : (
              <div>Loading user...</div>
            )}
          </div>

          <div className="flex-1">
            <AppleActivityCard title="Activity Rings" activities={[
              { label: "DEBITS", value: debitSum ? Math.min(100, (debitSum/Math.max(1,total))*100) : 0, color: "#FF2D55", size: 200, current: Math.round(debitSum), target: Math.round(total || 1), unit: "₹" },
              { label: "CREDITS", value: creditSum ? Math.min(100, (creditSum/Math.max(1,total))*100) : 0, color: "#A3F900", size: 160, current: Math.round(creditSum), target: Math.round(total || 1), unit: "₹" },
              { label: "TOTAL", value: 100, color: "#CCCCCC", size: 120, current: Math.round(total), target: Math.round(total || 1), unit: "₹" },
            ]} />
          </div>
        </div>

        {/* Middle: transactions table and requests table */}
        <div className="col-span-1 flex flex-col h-full gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex-1 overflow-auto">
            <h2 className="text-lg font-medium mb-4 text-center">Transactions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => {
                  const direction = t.fromVpa === userDoc?.vpa ? "debit" : "credit";
                  const balance = direction === "debit" ? t.balanceAfterFrom : t.balanceAfterTo;
                  return (
                    <tr key={t.txId} className={`border-t ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/3 dark:bg-black/10'}`}>
                      <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="py-2">{direction}</td>
                      <td className={`py-2 ${direction==="debit"?"text-red-500":"text-emerald-400"}`}>₹{t.amount.toFixed(2)}</td>
                      <td className="py-2">{balance !== undefined ? `₹${balance.toFixed(2)}` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex-1 overflow-auto">
            <h2 className="text-lg font-medium mb-4 text-center">Requests (Incoming)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500"><th>From VPA</th><th>Amount</th><th>Message</th><th className="text-center">Action</th></tr>
              </thead>
              <tbody>
                {requests.map((r, idx) => (
                  <tr key={r._id} className={`border-t ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/3 dark:bg-black/10'}`}>
                    <td className="py-2">{r.fromVpa}</td>
                    <td className="py-2">₹{r.amount.toFixed(2)}</td>
                    <td className="py-2">{r.message}</td>
                    <td className="py-2 text-center"><button className="inline-block px-3 py-1 rounded bg-green-600 text-white" onClick={() => fulfillRequest(r._id!)}>Fulfill</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: send and request boxes */}
        <div className="flex flex-col h-full gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex-1">
            <h2 className="text-lg font-semibold mb-4 text-center">Send Money</h2>
            <div className="space-y-3 max-w-md mx-auto">
              <input className="w-full p-2 rounded bg-transparent border" placeholder="Recipient VPA" value={sendVpa} onChange={(e) => setSendVpa(e.target.value)} />
              <input className="w-full p-2 rounded bg-transparent border" placeholder="Amount" type="number" value={sendAmount as any} onChange={(e) => setSendAmount(e.target.value === "" ? "" : Number(e.target.value))} />
              <div className="flex justify-center">
                <ParticleButton onClick={doSend} className="px-6 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white w-32">Send</ParticleButton>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex-1">
            <h2 className="text-lg font-semibold mb-4 text-center">Request Money</h2>
            <div className="space-y-3 max-w-md mx-auto">
              <input className="w-full p-2 rounded bg-transparent border" placeholder="Recipient VPA" value={reqVpa} onChange={(e) => setReqVpa(e.target.value)} />
              <input className="w-full p-2 rounded bg-transparent border" placeholder="Amount" type="number" value={reqAmount as any} onChange={(e) => setReqAmount(e.target.value === "" ? "" : Number(e.target.value))} />
              <input className="w-full p-2 rounded bg-transparent border" placeholder="Message (optional)" value={reqMessage} onChange={(e) => setReqMessage(e.target.value)} />
              <div className="flex justify-center">
                <ParticleButton onClick={doRequest} className="px-6 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white w-32">Request</ParticleButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
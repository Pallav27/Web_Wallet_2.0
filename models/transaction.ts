import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  txId: string;
  fromVpa: string;
  toVpa: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  // optional snapshots of balances after the transaction
  balanceAfterFrom?: number;
  balanceAfterTo?: number;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    txId: { type: String, required: true, unique: true },
    fromVpa: { type: String, required: true, index: true },
    toVpa: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, enum: ["pending", "completed", "failed"], default: "pending" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { collection: "transactions" }
);

const Transaction: Model<ITransaction> = (mongoose.models.Transaction as Model<ITransaction>) || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;

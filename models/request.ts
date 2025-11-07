import mongoose, { Schema, Document, Model } from "mongoose";

export type RequestStatus = "pending" | "fulfilled" | "rejected";

export interface IRequest extends Document {
  fromVpa: string; // requester
  toVpa: string; // recipient
  amount: number;
  message?: string;
  status: RequestStatus;
  createdAt: Date;
  fulfilledAt?: Date;
  fulfilledTxId?: string;
}

const RequestSchema = new Schema<IRequest>(
  {
    fromVpa: { type: String, required: true, index: true },
    toVpa: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    message: { type: String },
    status: { type: String, required: true, enum: ["pending", "fulfilled", "rejected"], default: "pending" },
    createdAt: { type: Date, default: () => new Date() },
    fulfilledAt: { type: Date },
    fulfilledTxId: { type: String },
  },
  { collection: "requests" }
);

const RequestModel: Model<IRequest> = (mongoose.models.Request as Model<IRequest>) || mongoose.model<IRequest>("Request", RequestSchema);

export default RequestModel;

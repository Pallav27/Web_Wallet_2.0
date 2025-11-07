import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string; // gmail associated from Clerk sign-in
  clerkId?: string;
  branch: string;
  accountNumber: string;
  balance: number;
  vpa: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // for now enforce gmail addresses per your requirement; remove if you want any email
      validate: {
        validator: (v: string) => /@gmail\.com$/i.test(v),
        message: (props: any) => `${props.value} is not a Gmail address`,
      },
      unique: true,
    },
    clerkId: { type: String, required: false, index: true },
    branch: { type: String, required: true, default: "Main Branch" },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, default: 0 },
    vpa: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: false,
    collection: "users",
  }
);

// Ensure indexes are created
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ vpa: 1 }, { unique: true });
UserSchema.index({ accountNumber: 1 }, { unique: true });

// Avoid model overwrite issues in dev/hot reload
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;

import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    public_id: { type: String },
  },
  { timestamps: true }
);

export default model("Categories", categorySchema);

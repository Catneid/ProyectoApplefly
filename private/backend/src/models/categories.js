import { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

export default model("Categories", categorySchema);

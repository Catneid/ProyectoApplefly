import mongoose, { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Categories" },
    image: { type: String },
    public_id: { type: String },
    condition: { type: String, enum: ["Nuevo", "Reacondicionado"], default: "Nuevo" },
    storage: { type: String },
    ram: { type: String },
    color: { type: String },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true, strict: false }
);

export default model("Products", productSchema);

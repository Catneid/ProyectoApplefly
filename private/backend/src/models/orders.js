import mongoose, { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customers" },
    customerName: { type: String },
    customerEmail: { type: String },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number },
        subtotal: { type: Number },
      },
    ],
    subtotal: { type: Number },
    shipping: { type: Number },
    tax: { type: Number },
    total: { type: Number },
    status: {
      type: String,
      enum: ["pendiente", "procesando", "enviado", "entregado", "cancelado"],
      default: "pendiente",
    },
    address: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

export default model("Orders", orderSchema);

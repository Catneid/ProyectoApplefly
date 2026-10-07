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

    // Pago hecho con Wompi (lo escribe public/backend al cobrar). Sin esto
    // en el schema, el panel no lo recibiría.
    payment: {
      method: { type: String },
      transactionId: { type: String },
      status: { type: String },
      cardLast4: { type: String },
    },
  },
  { timestamps: true }
);

export default model("Orders", orderSchema);

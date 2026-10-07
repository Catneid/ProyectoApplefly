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
      // "pago-pendiente-revision": Wompi no contestó con claridad durante el cobro, no se sabe si cobró; alguien lo concilia a mano
      enum: ["pendiente", "pago-pendiente-revision", "procesando", "enviado", "entregado", "cancelado"],
      default: "pendiente",
    },
    address: { type: String },
    phone: { type: String },

    // true cuando el pedido se canceló y su stock ya volvió al inventario. Lo
    // pone el panel junto con el cambio de estado, para devolverlo UNA sola vez.
    stockDevuelto: { type: Boolean, default: false },

    // Datos del pago hecho con Wompi
    payment: {
      method: { type: String, enum: ["wompi", "contraentrega"], default: "wompi" },
      transactionId: { type: String },
      status: { type: String },
      cardLast4: { type: String },
    },
  },
  { timestamps: true }
);

export default model("Orders", orderSchema);

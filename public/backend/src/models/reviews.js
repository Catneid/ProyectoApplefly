import mongoose, { Schema, model } from "mongoose";

const reviewSchema = new Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customers", required: true },
    customerName: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// Un cliente solo puede dejar una reseña por producto.
// Si quiere cambiar de opinión, edita la que ya tiene.
reviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });

export default model("Reviews", reviewSchema);

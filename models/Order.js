import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
    },
    paymentImage: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);
// ✅ Use forward slashes in file paths
orderSchema.pre("save", function (next) {
  if (this.paymentImage) this.paymentImage = this.paymentImage.replace(/\\/g, "/");
  next();
});
const Order = mongoose.model("Order", orderSchema);
export default Order;

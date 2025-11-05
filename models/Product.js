import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nameAr: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionAr: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    mainImage: { url: String, public_id: String },
    subImages: [{ url: String, public_id: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({
  name: "text",
  description: "text",
});
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1 });
const Product = mongoose.model("Product", productSchema);
export default Product;

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
      default: []
    },
    colors: { 
      type: [String], 
      default: [] 
    },
    mainImage: { type: String, required: true },
    subImages: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Use forward slashes in file paths
productSchema.pre("save", function (next) {
  if (this.mainImage) this.mainImage = this.mainImage.replace(/\\/g, "/");
  if (this.subImages && this.subImages.length > 0) {
    this.subImages = this.subImages.map((img) => img.replace(/\\/g, "/"));
  }
  next();
});

// In Product.js, change the middleware to:
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Normalize mainImage path if it exists in the update
  if (update.$set?.mainImage) {
    update.$set.mainImage = update.$set.mainImage.replace(/\\/g, "/");
  }

  // Normalize subImages paths if they exist in the update
  if (update.$set?.subImages) {
    if (Array.isArray(update.$set.subImages)) {
      update.$set.subImages = update.$set.subImages.map((img) =>
        typeof img === "string" ? img.replace(/\\/g, "/") : img
      );
    }
  }

  next();
});
// ✅ Indexes for search optimization
productSchema.index({
  name: "text",
  description: "text",
});
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1 });
const Product = mongoose.model("Product", productSchema);
export default Product;


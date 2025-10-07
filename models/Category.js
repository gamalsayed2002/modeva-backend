// models/Category.js
import mongoose from "mongoose";

// Main category schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nameAr: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
// ✅ Use forward slashes in file paths
categorySchema.pre("save", function (next) {
  if (this.image) this.image = this.image.replace(/\\/g, "/");
  next();
});
const Category = mongoose.model("Category", categorySchema);
export default Category;

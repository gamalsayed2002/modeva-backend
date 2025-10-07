import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  searchProducts,
  updateProduct,
  deleteProductSubImage,
  getProductById,
} from "../controllers/productController.js";
import { uploadByFolder } from "../middleware/photoUpload.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📁 تحديد فولدر التخزين
const upload = uploadByFolder("products");
router
  .route("/")
  .get(getProducts)
  .post(
    protectRoute,
    adminRoute,
    upload.fields([
      { name: "mainImage", maxCount: 1 }, // Single main image
      { name: "subImages", maxCount: 10 }, // Up to 10 sub images
    ]),
    createProduct
  );

// GET /api/products/search?query=your_search_term - Search products
router.get("/search", searchProducts);

// Product by ID routes
router
  .route("/:id")
  .get(getProductById)
  .put(
    protectRoute,
    adminRoute,
    upload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: 10 },
    ]),
    updateProduct
  )
  .delete(deleteProduct);
router.delete(
  "/:productId/subimages/:imageIndex",
  protectRoute,
  adminRoute,
  deleteProductSubImage
);

export default router;

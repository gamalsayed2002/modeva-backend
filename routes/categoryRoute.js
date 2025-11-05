import express from "express";
import {
  createCategory,
  searchCategories,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";
import createUploader from "../middleware/photoUpload.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📁 إعداد رفع الصور
const upload = createUploader();

// Public routes
router.get("/", getAllCategories);
router.get("/search", searchCategories);
router.get("/:categoryId", getCategoryById);

// Category routes
router.post(
  "/",
  protectRoute,
  adminRoute,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createCategory
);

router.put(
  "/:categoryId",
  protectRoute,
  adminRoute,
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateCategory
);

router.delete("/:categoryId", protectRoute, adminRoute, deleteCategory);

export default router;
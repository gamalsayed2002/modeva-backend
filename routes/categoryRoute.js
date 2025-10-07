import express from "express";
import {
  createCategory,
  searchCategories,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";
import { uploadByFolder } from "../middleware/photoUpload.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// 📁 تحديد فولدر الصور
const upload = uploadByFolder("categories");

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

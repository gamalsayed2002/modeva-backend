import express from "express";
import {
  createCategory,
  searchCategories,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory
} from "../controllers/categoryController.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/search", searchCategories);
router.get("/:categoryId", getCategoryById);

// Category routes
router.post("/", createCategory);
router.put("/:categoryId", updateCategory);
router.delete("/:categoryId", deleteCategory);

export default router;

import Category from "../models/Category.js";
import asyncHandler from "express-async-handler";
import { ObjectId } from "mongodb";

export const createCategory = asyncHandler(async (req, res) => {
  const { name, nameAr } = req.body;

  if (!name || !nameAr) {
    return res.status(400).json({
      success: false,
      message: "Both English and Arabic names are required",
    });
  }

  // Check for existing category
  const existingCategory = await Category.findOne({
    $or: [{ name }, { nameAr }],
  });

  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: "Category with the same name already exists",
    });
  }

  // Create new category
  const newCategory = await Category.create({ name, nameAr });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: newCategory,
  });
});

// Search categories by name
export const searchCategories = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  try {
    const categories = await Category.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { nameAr: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing search",
      error: error.message,
    });
  }
});

// Delete category
export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Get category by ID
export const getCategoryById = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  if (!ObjectId.isValid(categoryId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid category ID" });
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// Get all categories
export const getAllCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Category.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      totalPages,
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Update category
export const updateCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, nameAr, description, isActive } = req.body;

    // Validate categoryId
    if (!ObjectId.isValid(categoryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Check for existing category with same name (excluding current category)
    if (name || nameAr) {
      const existingCategory = await Category.findOne({
        _id: { $ne: categoryId },
        $or: [{ name: name }, { nameAr: nameAr }],
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        });
      }

      if (name) category.name = name;
      if (nameAr) category.nameAr = nameAr;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    const updatedCategory = await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (err) {
    console.error("Error in updateCategory:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete file if it exists
const deleteFileIfExists = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (existsSync(fullPath)) {
      await fs.unlink(fullPath);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by isActive
  if (req.query.isActive) {
    query.isActive = req.query.isActive === "true";
  }

  // Execute query with pagination
  const products = await Product.find(query)
    .sort({ createdAt: -1 }) // Newest first
    .skip(skip)
    .limit(limit)
    .populate("category", "name"); 

  // Get total count for pagination
  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: products,
  });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Please provide a search query",
    });
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Search query with case-insensitive regex
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: "i" } },
      { nameAr: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { descriptionAr: { $regex: query, $options: "i" } },
    ],
  };

  try {
    const products = await Product.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name");

    const total = await Product.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching products",
      error: error.message,
    });
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Store image paths before deletion
    const { mainImage, subImages } = product;

    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);

    // Delete main image if exists
    if (mainImage) {
      await deleteFileIfExists(mainImage);
    }

    // Delete all sub images if they exist
    if (subImages?.length) {
      await Promise.all(subImages.map((img) => deleteFileIfExists(img)));
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const deleteProductSubImage = asyncHandler(async (req, res) => {
  try {
    const { productId, imageIndex } = req.params;
    const index = parseInt(imageIndex, 10);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.subImages || index >= product.subImages.length) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Get the image path before removing it
    const imageToDelete = product.subImages[index];

    // Remove the image from the array
    product.subImages.splice(index, 1);

    // Save the updated product
    await product.save();

    // Delete the image file
    try {
      await deleteFileIfExists(imageToDelete);
    } catch (fileError) {
      console.error("Error deleting image file:", fileError);
      // Continue even if file deletion fails
    }

    res.status(200).json({
      success: true,
      message: "Subimage deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error deleting subimage:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting subimage",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export const createProduct = asyncHandler(async (req, res) => {
  // Handle main image
  if (!req.files?.mainImage) {
    return res.status(400).json({
      success: false,
      message: "Main image is required",
    });
  }
  const mainImg = req.files.mainImage[0];
  const mainImage = path
    .join("uploads/products", mainImg.filename)
    .replace(/\\/g, "/");

  // Handle sub images
  let subImages = [];
  if (req.files.subImages) {
    subImages = req.files.subImages.map((img) =>
      path.join("uploads/products", img.filename).replace(/\\/g, "/")
    );
  }

  // Create product
  const product = await Product.create({
    name: req.body.name,
    nameAr: req.body.nameAr,
    description: req.body.description,
    descriptionAr: req.body.descriptionAr,
    category: req.body.category,
    price: req.body.price ? Number(req.body.price) : undefined,
    sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
    colors: req.body.colors ? JSON.parse(req.body.colors) : [],
    isActive: req.body.isActive === "true",
    mainImage,
    subImages,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const updateFields = {};

  // Handle name fields
  if (req.body.name) {
    updateFields.name = req.body.name;
  }
  
  if (req.body.nameAr) {
    updateFields.nameAr = req.body.nameAr;
  }

  // Handle description fields
  if (req.body.description) {
    updateFields.description = req.body.description;
  }
  
  if (req.body.descriptionAr) {
    updateFields.descriptionAr = req.body.descriptionAr;
  }

  // Handle category update
  if (req.body.category) {
    updateFields.category = req.body.category;
  }

  // Handle boolean fields
  if (req.body.isActive !== undefined) {
    updateFields.isActive = req.body.isActive === "true";
  }

  // Handle price field
  if (req.body.price !== undefined) {
    updateFields.price = req.body.price ? Number(req.body.price) : null;
  }

  // Handle array fields
  if (req.body.sizes) {
    try {
      updateFields.sizes = JSON.parse(req.body.sizes);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for sizes",
      });
    }
  }

  if (req.body.colors) {
    try {
      updateFields.colors = JSON.parse(req.body.colors);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for colors",
      });
    }
  }

  // Handle file updates
  const currentProduct = await Product.findById(productId).select(
    "mainImage subImages"
  );

  // Handle main image update
  if (req.files?.mainImage) {
    const mainImg = req.files.mainImage[0];
    const newMainImagePath = path.join("uploads/products", mainImg.filename);

    // Delete old main image if it exists
    if (currentProduct?.mainImage) {
      await deleteFileIfExists(currentProduct.mainImage);
    }

    updateFields.mainImage = newMainImagePath;
  }

  // Handle sub images update
  if (req.files?.subImages) {
    const newSubImages = req.files.subImages.map((img) =>
      path.join("uploads/products", img.filename)
    );

    if (req.body.subImages) {
      // Replace all sub images
      if (currentProduct?.subImages?.length) {
        await Promise.all(
          currentProduct.subImages.map((img) => deleteFileIfExists(img))
        );
      }
      updateFields.subImages = newSubImages;
    } else {
      // Add to existing sub images
      updateFields.subImages = [
        ...(currentProduct?.subImages || []),
        ...newSubImages,
      ];
    }
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
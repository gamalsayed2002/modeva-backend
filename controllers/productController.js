import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { cloudinaryRemoveImage, cloudinaryUploadImage } from "../lib/cloudinary.js";

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

    // Delete main image from Cloudinary
    if (product.mainImage && product.mainImage.public_id) {
      await cloudinaryRemoveImage(product.mainImage.public_id);
    }

    // Delete all sub images from Cloudinary
    if (product.subImages && product.subImages.length > 0) {
      const deletePromises = product.subImages
        .map((img) => {
          if (img && img.public_id) {
            return cloudinaryRemoveImage(img.public_id);
          }
        })
        .filter(Boolean); // Filter out undefined promises

      await Promise.all(deletePromises);
    }

    // Delete the product from database
    await Product.findByIdAndDelete(req.params.id);

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
    const { publicId, productId } = req.body;

    // التحقق من إن الـ public_id مبعوت
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ندور الصورة في مصفوفة الصور الفرعية باستخدام الـ public_id
    const imageIndex = product.subImages.findIndex(
      (img) => img && img.public_id === publicId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // نمسح الصورة من Cloudinary
    await cloudinaryRemoveImage(publicId);

    // نمسح الصورة من مصفوفة الصور في قاعدة البيانات
    product.subImages.splice(imageIndex, 1);

    // نسيف التعديلات
    await product.save();

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

  // Upload main image directly to Cloudinary
  const mainImg = req.files.mainImage[0];
  const mainImageResult = await cloudinaryUploadImage(
    mainImg.buffer,
    "products"
  );
  if (!mainImageResult || mainImageResult.message) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload main image to Cloudinary",
    });
  }
  const mainImage = {
    url: mainImageResult.secure_url,
    public_id: mainImageResult.public_id,
  };

  // Handle sub images
  let subImages = [];
  if (req.files.subImages) {
    // Upload all sub images to Cloudinary
    const uploadPromises = req.files.subImages.map((img) =>
      cloudinaryUploadImage(img.buffer, "products")
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Check for upload errors
    const hasErrors = uploadResults.some((result) => !result || result.message);
    if (hasErrors) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload one or more sub images to Cloudinary",
      });
    }

    subImages = uploadResults.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));
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
  // Handle main image update
  if (req.files?.mainImage) {
    const mainImg = req.files.mainImage[0];
    const mainImageResult = await cloudinaryUploadImage(
      mainImg.buffer,
      "products"
    );
    if (!mainImageResult || mainImageResult.message) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload main image to Cloudinary",
      });
    }
    updateFields.mainImage = {
      url: mainImageResult.secure_url,
      public_id: mainImageResult.public_id,
    };
  }

  // Handle sub images update
  if (req.files?.subImages) {
    // Upload all sub images to Cloudinary
    const uploadPromises = req.files.subImages.map((img) =>
      cloudinaryUploadImage(img.buffer, "products")
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Check for upload errors
    const hasErrors = uploadResults.some((result) => !result || result.message);
    if (hasErrors) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload one or more sub images to Cloudinary",
      });
    }

    const newSubImages = uploadResults.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    if (req.body.subImages) {
      // Replace all sub images
      updateFields.subImages = newSubImages;
    } else {
      // Add to existing sub images
      const currentProduct = await Product.findById(productId).select(
        "subImages"
      );
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

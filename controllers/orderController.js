import Order from "../models/Order.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
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

export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "user",
      select: "-password -refreshToken -createdAt -updatedAt -__v",
    })
    .populate("products.product", "name price mainImage");

  const total = await Order.countDocuments();

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: orders,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate({
      path: "user",
      select: "-password -refreshToken -createdAt -updatedAt -__v",
    })
    .populate("products.product", "name price mainImage");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // لو فيه يوزر متسجل (جا من middleware auth)
  if (req.user) {
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: order,
  });
});

// @desc    Search orders with filters
// @route   GET /api/orders/search
// @access  Private/Admin

export const searchOrders = asyncHandler(async (req, res) => {
  const { query, status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  let filter = {};

  // لو فيه فلترة بالـ status
  if (status) {
    if (!["pending", "shipped", "delivered"].includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }
    filter.status = status;
  }

  // لو فيه كلمة بحث
  if (query) {
    // الأول ندور على الـ users اللي الـ name أو email أو phone بتاعهم فيه الكلمة
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("_id"); // بس ids

    const userIds = users.map((u) => u._id);

    // نضيفهم للفيلتر
    filter.user = { $in: userIds };
  }

  // نجيب الأوردرات
  const result = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "user",
      select: "-password -createdAt -updatedAt -__v",
    })
    .populate("products.product", "name price mainImage");

  const total = await Order.countDocuments(filter);

  return res.status(200).json({
    success: true,
    count: result.length,
    total,
    data: result,
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  try {
    // ✅ التحقق من رفع صورة الدفع
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Payment image is required",
      });
    }

    // ✅ تحديد مسار الصورة بعد الرفع
    const paymentImage = path
      .join("uploads/payments", req.file.filename)
      .replace(/\\/g, "/");

    const { products, totalAmount } = req.body;
    const user = req.user._id; // ✅ خده من الـ middleware

    // ✅ التحقق من وجود البيانات الأساسية
    if (!user || !products || !totalAmount) {
      await deleteFileIfExists(paymentImage);
      return res.status(400).json({
        success: false,
        message: "User, products and totalAmount are required",
      });
    }

    // ✅ معالجة المنتجات (لو جاية من form-data فهي نص)
    let parsedProducts;
    try {
      parsedProducts =
        typeof products === "string" ? JSON.parse(products) : products;
    } catch (err) {
      await deleteFileIfExists(paymentImage);
      return res.status(400).json({
        success: false,
        message: "Invalid products format. Must be a valid JSON array.",
      });
    }

    if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      await deleteFileIfExists(paymentImage);
      return res.status(400).json({
        success: false,
        message: "Products must be a non-empty array",
      });
    }

    // ✅ إنشاء الأوردر في قاعدة البيانات
    const order = await Order.create({
      user,
      products: parsedProducts,
      totalAmount,
      status: status || "pending",
      paymentImage,
    });

    // ✅ استرجاع الأوردر بعد الـ populate
    const newOrder = await Order.findById(order._id)
      .populate({
        path: "user",
        select: "name email phone",
      })
      .populate("products.product", "name price mainImage");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Store payment image path before deletion
    const { paymentImage } = order;

    // Delete the order from database
    await Order.findByIdAndDelete(req.params.id);

    // Delete payment image if exists
    if (paymentImage) {
      await deleteFileIfExists(paymentImage);
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

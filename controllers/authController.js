import User from "../models/User.js";
import Token from "../models/Token.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import bcrypt from "bcryptjs";

// Function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

// Function to store refresh token in DB
const storeRefreshToken = asyncHandler(async (userId, refreshToken) => {
  await Token.deleteMany({ user: userId }); // Remove old tokens
  await Token.create({ user: userId, token: refreshToken }); // Store new one
});

// Function to set cookies (DEV vs PROD)
const setCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2h
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
};

// =====================================================================
// Signup
export const signup = asyncHandler(async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "user already exists" });
    }

    const user = await User.create({ email, password, name, phone, address });
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: "User created",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    // Handle mongoose validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors[0] });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Login
export const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        _id: user._id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Logout
export const logout = asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await Token.deleteOne({ token: refreshToken });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({ success: true, message: "User logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Refresh
export const refresh = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const tokenDoc = await Token.findOne({
      user: decoded.userId,
      token: refreshToken,
    });

    if (!tokenDoc) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "2h",
      }
    );

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired please login",
      });
    }
    console.error("Refresh error:", err);
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
});

// Get Profile
export const getProfile = asyncHandler(async (req, res) => {
  try {
    // الحصول على معلومات المستخدم مع استبعاد كلمة المرور
    const user = await User.findById(req.user.id).select("-password");

    // الحصول على طلبات المستخدم
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("products.product", "name price mainImage");

    res.status(200).json({ success: true, user, orders });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update Profile

export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, address, currentPassword, newPassword } =
      req.body;

    // ✅ الـ user جاي من protectRoute
    const userId = req.user._id;
    console.log(userId);
    console.log(req.user);
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ تحقق من الإيميل (لو بيتغير)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    // ✅ تحديث باقي البيانات
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    // ✅ تغيير الباسورد لو متبعت
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // ✅ نحذف الباسورد قبل ما نرجع اليوزر
    const { password, ...userResponse } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update user error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
/////////////////////////// admin //////////////////////////////////
// Get all users (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = page * limit;

    const total = await User.countDocuments({});
    const totalPages = Math.ceil(total / limit);

    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    res
      .status(200)
      .json({ success: true, users, total, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ success: false, message: "Error getting users" });
  }
});

// Get user with orders (Admin)
export const getUserWithOrders = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select(
      "-password -refreshToken -createdAt -updatedAt -__v"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("products.product", "name price mainImage");

    res.status(200).json({
      success: true,
      data: {
        user,
        orders: { count: orders.length, data: orders },
      },
    });
  } catch (error) {
    console.error("Error getting user with orders:", error);
    res
      .status(500)
      .json({ success: false, message: "Error retrieving user with orders" });
  }
});

// Search users by name, email, or phone (Admin)
export const searchUsers = asyncHandler(async (req, res) => {
  try {
    const { query } = req.query; // ?query=somevalue
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }

    // عمل regex للبحث الجزئي
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
      ],
    }).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: false, message: "Error searching users" });
  }
});

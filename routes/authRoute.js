import express from "express";
import {
  getProfile,
  login,
  logout,
  refresh,
  signup,
  updateProfile,
  getAllUsers,
  getUserWithOrders,
  searchUsers,
} from "../controllers/authController.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";
const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);
authRouter.get("/profile", protectRoute, getProfile);
authRouter.put("/profile", protectRoute, updateProfile);

// Admin routes
authRouter.get("/users/search", protectRoute, adminRoute, searchUsers);
authRouter.get("/users", getAllUsers);
authRouter.get("/users/:id/orders", protectRoute, getUserWithOrders);
export default authRouter;

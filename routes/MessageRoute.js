import express from "express";
import {
  createMessage,
  deleteMessage,
  getMessages,
  markAsRead,
  searchMessages,
} from "../controllers/messagesController.js";
import { adminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.post("/", createMessage);

// Protected routes (admin only)
router.get("/", protectRoute, adminRoute, getMessages);
router.get("/search", protectRoute, adminRoute, searchMessages);
router.delete("/:id", protectRoute, adminRoute, deleteMessage);
router.patch("/:id/read", protectRoute, adminRoute, markAsRead);

export default router;

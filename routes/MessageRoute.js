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
router.get("/", getMessages);
router.get("/search", searchMessages);
router.delete("/:id", deleteMessage);
router.patch("/:id/read", markAsRead);

export default router;

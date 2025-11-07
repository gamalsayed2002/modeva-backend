import express from "express";
import {
  getOrders,
  getOrderById,
  searchOrders,
  createOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import createUploader from "../middleware/photoUpload.js";
import { adminRoute, protectRoute } from "./../middleware/authMiddleware.js";

const router = express.Router();

// 📸 إعداد رفع الصور
const upload = createUploader();

router
  .route("/")
  .get(protectRoute, adminRoute, getOrders)
  .post(protectRoute, upload.single("paymentImage"), createOrder);

router.route("/search").get(protectRoute, adminRoute, searchOrders);

router
  .route("/:id")
  .get(protectRoute, adminRoute, getOrderById)
  .delete(protectRoute, adminRoute, deleteOrder);

export default router;

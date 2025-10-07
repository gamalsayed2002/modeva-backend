import express from "express";
import {
  getOrders,
  getOrderById,
  searchOrders,
  createOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { uploadByFolder } from "../middleware/photoUpload.js";

const router = express.Router();

// 📸 نستخدم uploadByFolder لتحديد فولدر الحفظ (مثلاً "payments")
const upload = uploadByFolder("payments");

router
  .route("/")
  .get(getOrders)
  .post(upload.single("paymentImage"), createOrder);

router.route("/search").get(searchOrders);

router.route("/:id").get(getOrderById).delete(deleteOrder);

export default router;

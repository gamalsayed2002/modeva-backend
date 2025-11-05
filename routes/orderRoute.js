import express from "express";
import {
  getOrders,
  getOrderById,
  searchOrders,
  createOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import createUploader from "../middleware/photoUpload.js";

const router = express.Router();

// 📸 إعداد رفع الصور
const upload = createUploader();

router
  .route("/")
  .get(getOrders)
  .post(upload.single("paymentImage"), createOrder);

router.route("/search").get(searchOrders);

router.route("/:id").get(getOrderById).delete(deleteOrder);

export default router;
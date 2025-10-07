import express from "express";
import {
  getOrders,
  getOrderById,
  searchOrders,
  createOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { paymentPhotoUpload } from "../middleware/photoUpload.js";
const router = express.Router();

// Public routes
router
  .route("/")
  .get(getOrders)
  .post(paymentPhotoUpload.single("paymentImage"), createOrder);

router.route("/search").get(searchOrders);

router.route("/:id").get(getOrderById).delete(deleteOrder);

export default router;

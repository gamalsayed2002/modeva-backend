import express from "express";
import {
  getOrders,
  getOrderById,
  searchOrders,
  createOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Public routes
router.route("/").get(getOrders);

router.route("/search").get(searchOrders);

router.route("/:id").get(getOrderById);

router.route("/").post(createOrder);

export default router;

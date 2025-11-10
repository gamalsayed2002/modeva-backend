// import express from "express";
// import dotenv from "dotenv";
// import { connectDB } from "./lib/db.js";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import authRouter from "./routes/authRoute.js";
// import messageRouter from "./routes/MessageRoute.js";
// import categoryRouter from "./routes/categoryRoute.js";
// import productRouter from "./routes/productRoute.js";
// import orderRoutes from "./routes/orderRoute.js";
// import analyticsRouter from "./routes/analytics.js";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();
// const app = express();

// // =========================
// // Middleware
// // =========================
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173", // Vite
//       "http://localhost:3000", // Next.js
//       "http://localhost:5174",
//     ],
//     credentials: true, // علشان الكوكيز تتبعت
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // =========================
// // Static files
// // =========================
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // =========================
// // Routes
// // =========================
// app.use("/api/auth", authRouter);
// app.use("/api/messages", messageRouter);
// app.use("/api/categories", categoryRouter);
// app.use("/api/products", productRouter);
// app.use("/api/orders", orderRoutes);
// app.use("/api/analytics", analyticsRouter);

// // =========================
// // Start server after DB
// // =========================
// const PORT = process.env.PORT || 5000;

// connectDB()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`✅ Server is running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ DB connection failed:", err.message);
//     process.exit(1);
//   });
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import messageRouter from "./routes/MessageRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import productRouter from "./routes/productRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import analyticsRouter from "./routes/analytics.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// =========================
// Connect to DB
// =========================
connectDB();

// =========================
// Middleware
// =========================
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite
      "http://localhost:3000", // Next.js
      "http://localhost:5174",
    ],
    credentials: true, // علشان الكوكيز تتبعت
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =========================
// Routes
// =========================
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRouter);

// =========================
// Test route
// =========================
app.get("/", (req, res) => {
  res.send("Hello from Express on Vercel!");
});

// =========================
// Export app for Vercel
// =========================
export default app;

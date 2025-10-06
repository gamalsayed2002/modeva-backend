import express from "express";
import {
  createProduct,
  deleteProduct,
  getProducts,
  searchProducts,
  updateProduct,
  deleteProductSubImage,
  getProductById,
} from "../controllers/productController.js";
import photoUpload from "../middleware/photoUpload.js";

const router = express.Router();

// GET /api/products - Get all products
// POST /api/products - Create new product
router
  .route("/")
  .get(getProducts)
  .post(
    photoUpload.fields([
      { name: "mainImage", maxCount: 1 }, // Single main image
      { name: "subImages", maxCount: 10 }, // Up to 10 sub images
    ]),
    createProduct
  );

// GET /api/products/search?query=your_search_term - Search products
router.get("/search", searchProducts);

// Product by ID routes
router
  .route("/:id")
  // GET /api/products/:id - Get single product
  .get(getProductById)
  // PUT /api/products/:id - Update product
  .put(
    photoUpload.fields([
      { name: "mainImage", maxCount: 1 },
      { name: "subImages", maxCount: 10 },
    ]),
    updateProduct
  )
  // DELETE /api/products/:id - Delete product
  .delete(deleteProduct);

// DELETE /api/products/:productId/subimages/:imageIndex - Delete a subimage
router.delete("/:productId/subimages/:imageIndex", deleteProductSubImage);


export default router;

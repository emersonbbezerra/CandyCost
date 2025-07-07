import { Router } from "express";
import * as productController from "../controllers/productController";

const router = Router();

router.get("/api/products", productController.getProducts);
router.get("/api/products/:id", productController.getProductById);
router.post("/api/products", productController.createProduct);
router.put("/api/products/:id", productController.updateProduct);
router.delete("/api/products/:id", productController.deleteProduct);

export default router;

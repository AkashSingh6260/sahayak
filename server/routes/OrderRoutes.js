import express from "express";
import protect from "../middlewares/protect.js";
import { createOrder, verifyPayment } from "../controllers/orderController.js";

const OrderRouter = express.Router();

OrderRouter.post("/create-order", protect, createOrder);
OrderRouter.post("/verify-payment", protect, verifyPayment);

export default OrderRouter;

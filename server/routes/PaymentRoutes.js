import express from "express";
import protect from "../middlewares/protect.js";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";

const PaymentRouter = express.Router();

PaymentRouter.post("/create-order", protect, createOrder);
PaymentRouter.post("/verify-payment", protect, verifyPayment);

export default PaymentRouter;

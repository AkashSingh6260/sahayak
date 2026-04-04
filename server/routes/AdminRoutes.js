import express from "express";
import protect from "../middlewares/protect.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  getAllApplications,
  getSingleApplication,
  verifyApplication,
  adminDashboardStats,
 
} from "../controllers/adminController.js";

const AdminRouter = express.Router();



AdminRouter.get("/applications", protect, isAdmin, getAllApplications);


AdminRouter.get("/applications/:id", protect, isAdmin, getSingleApplication);


AdminRouter.patch("/applications/:id", protect, isAdmin, verifyApplication);


AdminRouter.get("/dashboard-stats", protect, isAdmin, adminDashboardStats);





export default AdminRouter;

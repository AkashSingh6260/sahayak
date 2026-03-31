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

/* =================================================
   ADMIN – PARTNER APPLICATION ROUTES
   Base URL: /api/admin
================================================= */

/**
 * @route   GET /api/admin/applications
 * @desc    Get all partner applications
 * @access  Admin
 */
AdminRouter.get("/applications", protect, isAdmin, getAllApplications);

/**
 * @route   GET /api/admin/applications/:id
 * @desc    Get single application details
 * @access  Admin
 */
AdminRouter.get("/applications/:id", protect, isAdmin, getSingleApplication);

/**
 * @route   PATCH /api/admin/applications/:id
 * @desc    Approve or reject application
 * @access  Admin
 */
AdminRouter.patch("/applications/:id", protect, isAdmin, verifyApplication);

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Admin dashboard statistics
 * @access  Admin
 */
AdminRouter.get("/dashboard-stats", protect, isAdmin, adminDashboardStats);





export default AdminRouter;

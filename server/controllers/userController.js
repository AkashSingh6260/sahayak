import User from "../modal/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/* ===============================
   ADMIN EMAIL
================================ */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/* ===============================
   Generate JWT Token
================================ */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ===============================
   REGISTER USER
   POST /api/auth/register
================================ */
export const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database unavailable. Check MONGODB_URI and server logs.",
      });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration (JWT_SECRET)." });
    }

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 ASSIGN ROLE
    const role = email === ADMIN_EMAIL ? "admin" : "user";

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Generate token
    const token = generateToken(user._id);

    // Hide password
    user.password = undefined;

    res.status(201).json({
      message: "Registered successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LOGIN USER
   POST /api/auth/login
================================ */
export const loginUser = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database unavailable. Check MONGODB_URI and server logs.",
      });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration (JWT_SECRET)." });
    }

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🔥 ENSURE ADMIN ROLE (SAFETY)
    if (user.email === ADMIN_EMAIL && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    // Hide password
    user.password = undefined;

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LOGOUT USER
================================ */
export const logoutUser = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

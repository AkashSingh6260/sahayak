import User from "../modal/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const ADMIN_EMAIL = process.env.ADMIN_EMAIL;


const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


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

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }


    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

   
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const role = email === ADMIN_EMAIL ? "admin" : "user";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    
    const token = generateToken(user._id);

   
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

  
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.email === ADMIN_EMAIL && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

  
    const token = generateToken(user._id);

   
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


export const logoutUser = async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

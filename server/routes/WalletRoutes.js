 import express from "express";
import protect from "../middlewares/protect.js";
import Wallet from "../modal/Wallet.js";
import User from "../modal/User.js";

const WalletRouter = express.Router();

/* =======================
   GET MY WALLET (vendor)
======================= */
WalletRouter.get("/my", protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ owner: req.userId });
    if (!wallet) {
      // Return empty wallet if not created yet
      return res.json({ balance: 0, transactions: [] });
    }
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.slice(-20).reverse(), // latest 20
    });
  } catch (err) {
    console.error("WALLET GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET ADMIN PLATFORM WALLET
======================= */
WalletRouter.get("/admin", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    let wallet = await Wallet.findOne({ owner: req.userId, role: "admin" });
    if (!wallet) {
      return res.json({ balance: 0, transactions: [] });
    }
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.slice(-20).reverse(),
    });
  } catch (err) {
    console.error("ADMIN WALLET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default WalletRouter;

import jwt from "jsonwebtoken";
import User from "../modal/User.js";
import Partner from "../modal/Partner.js";

const protect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ ALWAYS ObjectId
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;           // Object with _id
      req.userId = user._id;     // 🔥 CHANGE: ObjectId (not string)

      const partner = await Partner.findOne({ user: user._id });
      if (partner) {
        req.partnerId = partner._id;
      }

      next();
    } catch (error) {
      console.error("AUTH ERROR:", error.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export default protect;

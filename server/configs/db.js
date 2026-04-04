import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const mongoDbURI = process.env.MONGODB_URI;

    if (!mongoDbURI) {
      throw new Error("MongoDB URI not found in environment variables");
    }

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
      console.log("CONNECTED DB NAME:", mongoose.connection.name);
    });

    await mongoose.connect(mongoDbURI);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

export default connectDb;

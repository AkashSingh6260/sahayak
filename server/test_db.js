import mongoose from "mongoose";

const checkDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/sahayak");
    console.log("Connected to DB");

    const reqs = await mongoose.connection.collection("servicerequests").find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("Latest Service Requests:");
    console.log(JSON.stringify(reqs, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();

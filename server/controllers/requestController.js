import ServiceRequest from "../modal/Service.js";
import Requests from "../modal/Requests.js";


export const getMyRequests = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "User ID missing" });
    }

    const requests = await ServiceRequest.find({
      customerId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error("❌ getMyRequests error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ServiceRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only allow owner to delete
    if (request.customerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this request" });
    }

    // ✅ Modern deletion
    await ServiceRequest.findByIdAndDelete(id);

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Delete Request Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
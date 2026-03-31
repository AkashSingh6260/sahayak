import axios from "axios";
import Partner from "../modal/Partner.js";

// Free geocoding using OpenStreetMap Nominatim
const geocodeLocation = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  const res = await axios.get(url, {
    headers: { "User-Agent": "YourAppNameHere" } // Required by OSM
  });

  if (res.data && res.data.length > 0) {
    const loc = res.data[0];
    return { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) };
  } else {
    throw new Error("Unable to fetch location coordinates");
  }
};


export const applyPartner = async (req, res) => {
  try {
    // Check if user already applied
    const existingPartner = await Partner.findOne({ user: req.userId || req.user?._id });
    if (existingPartner) {
      return res.status(400).json({ message: "You have already submitted an application." });
    }

    let location;

    // ✅ CASE 1: Frontend sent real lat/lng (Use Current Location or Suggestion)
    if (req.body.lat && req.body.lng) {
      location = {
        lat: Number(req.body.lat),
        lng: Number(req.body.lng),
      };
    }
    // ✅ CASE 2: User typed address manually
    else if (req.body.location) {
      try {
        location = await geocodeLocation(req.body.location);
      } catch (err) {
        return res.status(400).json({ message: "Invalid address. Please enter a precise area or select from suggestions." });
      }
    } 
    // ❌ No location at all
    else {
      return res.status(400).json({ message: "Location is required" });
    }

    const partner = await Partner.create({
      user: req.user?._id || req.userId,
      fullName: req.body.fullName,
      phone: req.body.phone,
      profession: req.body.profession,
      workType: req.body.workType,
      experience: req.body.experience,
      location,
      idProof: req.files.idProof[0].path,
      skillProof: req.files.skillProof[0].path,
      status: "pending",
      isAvailable: true,
    });

    res.status(201).json({
      message: "Partner application submitted",
      partner,
    });
  } catch (error) {
    console.error("APPLY PROVIDER ERROR:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }
    res.json({ partner });
  } catch (error) {
    console.error("GET MY PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    // Find partner regardless of status — allow all verified/pending partners to update
    const partner = await Partner.findOneAndUpdate(
      { user: req.userId },
      { location: { lat: Number(lat), lng: Number(lng) } },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    res.json({ message: "Location updated successfully", location: partner.location });
  } catch (error) {
    console.error("UPDATE LOCATION ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

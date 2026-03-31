import express from "express";
import { applyPartner, updateLocation, getMyProfile } from "../controllers/PartnerController.js";
import { getProviderStats } from "../controllers/serviceController.js";
import { upload } from "../middlewares/upload.js";
import protect from "../middlewares/protect.js";

const PartnerRouter = express.Router();

PartnerRouter.post(
  "/apply",protect,
  upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "skillProof", maxCount: 1 },
  ]),
  applyPartner  
);

PartnerRouter.put("/location", protect, updateLocation);
PartnerRouter.get("/me", protect, getMyProfile);
PartnerRouter.get("/stats", protect, getProviderStats);

export default PartnerRouter;

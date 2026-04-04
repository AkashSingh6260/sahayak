export const servicePricing = {
  electrician: { type: "hourly", rate: 300 },
  plumber: { type: "hourly", rate: 250 },
  carpenter: { type: "hourly", rate: 350 },
  ac_technician: { type: "fixed", price: 500 },
  painter: { type: "hourly", rate: 300 },
};

export const distanceCharges = [
  { label: "≤ 2 km", charge: 50 },
  { label: "≤ 5 km", charge: 100 },
  { label: "≤ 10 km", charge: 150 },
  { label: "> 10 km", charge: 200 },
];

export const getDistanceCharge = (distance) => {
  if (distance <= 2) return 50;
  if (distance <= 5) return 100;
  if (distance <= 10) return 150;
  return 200;
};

export const getServicePricingDisplay = (serviceId) => {
  if (!serviceId) return "";
  const normalizedId = serviceId.replace("-", "_").toLowerCase();
  const service = servicePricing[normalizedId];
  if (!service) return "₹300 / hr (Base)";
  if (service.type === "fixed") return `₹${service.price} Fixed Charge`;
  return `₹${service.rate} / hr`;
};

export const getServiceRate = (serviceId) => {
  if (!serviceId) return { type: "hourly", rate: 300 };
  const normalizedId = serviceId.replace(/[-\s]/g, "_").toLowerCase();
  return servicePricing[normalizedId] || { type: "hourly", rate: 300 };
};


export const getEstimatedRange = (serviceId) => {
  const service = getServiceRate(serviceId);
  const serviceCharge = service.type === "fixed" ? service.price : service.rate * 1;
  const minTotal = serviceCharge + 50; // closest distance
  const maxTotal = serviceCharge + 200; // farthest distance
  const minFee = Math.round(minTotal * 0.20);
  const maxFee = Math.round(maxTotal * 0.20);
  return {
    serviceCharge,
    minTotal,
    maxTotal,
    minPlatformFee: minFee,
    maxPlatformFee: maxFee,
  };
};


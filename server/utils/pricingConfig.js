export const servicePricing = {
  electrician: {
    type: "hourly",
    rate: 300
  },
  plumber: {
    type: "hourly",
    rate: 250
  },
  carpenter: {
    type: "hourly",
    rate: 350
  },
  ac_technician: {
    type: "fixed",
    price: 500
  },
  painter: {
    type: "hourly",
    rate: 300
  }
};

export function getDistanceCharge(distance) {
  if (distance <= 2) return 50;
  if (distance <= 5) return 100;
  if (distance <= 10) return 150;
  return 200;
}

export function getServiceCharge(serviceId, hours) {
  // Use a fallback in case serviceId doesn't precisely match keys (e.g. ac-technician)
  const normalizedId = serviceId.replace("-", "_").toLowerCase();
  const service = servicePricing[normalizedId] || { type: "hourly", rate: 300 }; // default fallback

  if (service.type === "fixed") {
    return service.price;
  }

  // Ensure minimum 1 hour
  const billedHours = Math.max(1, hours);
  return service.rate * billedHours;
}

export function calculateTotal(serviceId, hours, distance) {
  const serviceCharge = getServiceCharge(serviceId, hours);
  const distanceCharge = getDistanceCharge(distance);

  return {
    serviceCharge,
    distanceCharge,
    totalAmount: serviceCharge + distanceCharge
  };
}

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import api from "../config/api";
import BillingModal from "../components/BillingModal";

export default function UserLayout() {
  const [forceBillingRequest, setForceBillingRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 🔥 GLOBAL BILLING CHECK */
  const checkBilling = async () => {
    try {
      const { data } = await api.get("/services/my");

      const pending = data.requests.find(
        (r) =>
          r.status === "completed" &&
          r.billing?.paymentStatus !== "paid"
      );

      if (pending) {
        setForceBillingRequest(pending);
      } else {
        setForceBillingRequest(null);
      }
    } catch (err) {
      console.error("Billing check failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBilling();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* 🔒 LOCK ENTIRE APP */}
      <div
        className={
          forceBillingRequest
            ? "pointer-events-none opacity-50"
            : ""
        }
      >
        <Outlet />
      </div>

      {/* 🔒 FORCED BILLING MODAL */}
      {forceBillingRequest && (
        <div className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center">
          <BillingModal
            request={forceBillingRequest}
            onPaid={checkBilling}
          />
        </div>
      )}
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const SuccessModal = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="w-[90%] max-w-md rounded-2xl bg-white p-8 text-center shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 size={42} className="text-green-600" />
            </motion.div>

            <h2 className="text-xl font-semibold text-slate-900">
              Application Submitted 🎉
            </h2>

            <p className="mt-2 text-slate-600 text-sm">
              Your partner application has been successfully submitted.
              Our team will verify your details and notify you soon.
            </p>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 transition"
            >
              Go to Home
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../config/api.js";
import { professions } from "../components/Professions";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

/* ===========================
   Dynamic Work Types
=========================== */
const workTypesByProfession = {
  electrician: [
    "Wiring",
    "Switch & Socket Installation",
    "Appliance Installation",
    "Fault Repair",
    "Emergency Electrical Services",
  ],
  plumber: [
    "Leak Repair",
    "Pipe Installation",
    "Bathroom Fittings",
    "Drain Cleaning",
    "Emergency Plumbing",
  ],
  carpenter: [
    "Furniture Making",
    "Door & Window Installation",
    "Wood Repair",
    "Modular Furniture",
  ],
  "ac-technician": [
    "AC Installation",
    "AC Servicing",
    "Gas Refilling",
    "AC Repair",
    "AMC / Maintenance",
  ],
  painter: [
    "Interior Painting",
    "Exterior Painting",
    "Wall Texture",
    "Waterproofing",
    "Repainting / Touch-up",
  ],
};

const PartnerApplication = () => {
  const navigate = useNavigate();
  const { professionId } = useParams();

  const profession = professions.find((p) => p.id === professionId);
  const workTypes = workTypesByProfession[professionId] || [];

  const { lang } = useLang();
  const t = translations[lang].partnerApp;
  const tProf = translations[lang].professions;

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    experience: "",
    location: "",
    lat: null,
    lng: null,
    workType: "",
  });

  const GWALIOR_LOCATIONS = [
    { name: "Pinto Park, Gwalior", lat: 26.2465, lng: 78.2255 },
    { name: "Gole Ka Mandir, Gwalior", lat: 26.2429, lng: 78.2123 },
    { name: "Indramani Nagar, Gole Ka Mandir, Gwalior", lat: 26.2227, lng: 78.2035 },
    { name: "Govindpuri, Gwalior", lat: 26.2062, lng: 78.2036 },
    { name: "Hazira, Gwalior", lat: 26.2308, lng: 78.1828 },
    { name: "Shinde Ki Chawani, Gwalior", lat: 26.2067, lng: 78.1618 },
    { name: "Deendayal Nagar (DD Nagar), Gwalior", lat: 26.2575, lng: 78.2258 },
  ];

  const [idProof, setIdProof] = useState(null);
  const [skillProof, setSkillProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredLocations = GWALIOR_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes((formData.location || "").toLowerCase())
  );

  /* ===========================
     Use Current Location
  =========================== */
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return toast.error(t.geoNotSupported);
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          lat,
          lng,
          location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        }));
        toast.success(t.locationDetected);
        setLocating(false);
      },
      () => {
        toast.error(t.geoError);
        setLocating(false);
      }
    );
  };

  const handleLocationChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      location: e.target.value,
      lat: null,
      lng: null,
    }));
    setShowSuggestions(true);
  };

  const selectLocation = (loc) => {
    setFormData((prev) => ({
      ...prev,
      location: loc.name,
      lat: loc.lat,
      lng: loc.lng,
    }));
    setShowSuggestions(false);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ===========================
     Submit Form
  =========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!idProof || !skillProof) {
      return toast.error(t.uploadRequired);
    }

    try {
      setLoading(true);
      const data = new FormData();

      data.append("profession", professionId);
      data.append("fullName", formData.fullName);
      data.append("phone", formData.phone);
      data.append("experience", formData.experience);
      data.append("workType", formData.workType);
      data.append("idProof", idProof);
      data.append("skillProof", skillProof);

      if (formData.lat && formData.lng) {
        data.append("lat", formData.lat);
        data.append("lng", formData.lng);
      } else {
        data.append("location", formData.location);
      }

      await api.post("/partners/apply", data);
      setShowSuccess(true);
    } catch (err) {
      toast.error(t.submitFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= Page Wrapper ================= */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-[0_25px_60px_rgba(79,70,229,0.15)]"
        >
          {/* Header */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-xl bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200 transition"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <span className="text-xs font-medium text-indigo-600">
                {t.step2}
              </span>
              <h1 className="text-2xl font-semibold text-slate-900">
                {t.heading}
              </h1>
              <p className="text-slate-600">
                {t.applyingAs}{" "}
                <span className="font-medium text-indigo-600">
                  {tProf[professionId]?.label || profession?.label}
                </span>
              </p>
            </div>
          </div>

          {/* ================= Form ================= */}
          <form
            onSubmit={handleSubmit}
            className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            <Input label={t.fullName} name="fullName" onChange={handleChange} />
            <Input label={t.phone} name="phone" onChange={handleChange} />
            <Input
              label={t.yearsExp}
              name="experience"
              type="number"
              onChange={handleChange}
            />

            {/* Location */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                {t.serviceLocation}
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 relative">
                <MapPin className="text-indigo-500" />

                <div className="relative flex-1">
                  <input
                    type="text"
                    name="location"
                    placeholder={t.searchArea}
                    value={formData.location}
                    onChange={handleLocationChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full bg-transparent text-sm outline-none"
                    autoComplete="off"
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && (formData.location || "").length > 0 && filteredLocations.length > 0 && (
                    <ul className="absolute top-full left-0 mt-2 w-full rounded-xl border border-indigo-100 bg-white shadow-xl z-50 max-h-48 overflow-y-auto">
                      {filteredLocations.map((loc, idx) => (
                        <li
                          key={idx}
                          onMouseDown={(e) => { e.preventDefault(); selectLocation(loc); }}
                          className="cursor-pointer px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-indigo-50 last:border-none"
                        >
                          <div className="font-medium">{loc.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {loc.lat}, {loc.lng}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="h-6 w-px bg-indigo-200 mx-2" />

                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900 transition whitespace-nowrap"
                >
                  {locating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.locating}
                    </>
                  ) : (
                    t.useCurrent
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500 flex items-center h-4">
                {t.typeArea}
                {formData.lat && formData.lng && (
                  <span className="text-green-600 font-medium ml-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t.coordsMapped}
                  </span>
                )}
              </p>
            </div>

            <FileInput
              label={t.idProof}
              helper={t.idHelper}
              t={t}
              onChange={(e) => setIdProof(e.target.files[0])}
            />

            <FileInput
              label={t.skillProof}
              helper={t.skillHelper}
              t={t}
              onChange={(e) => setSkillProof(e.target.files[0])}
            />

            {/* Work Type */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">
                {t.typeOfWork}
              </label>
              <select
                name="workType"
                required
                value={formData.workType}
                onChange={handleChange}
                className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">{t.selectWorkType}</option>
                {workTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 transition"
              >
                {loading ? t.submitting : t.submitApp}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* ================= Success Modal ================= */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="w-[90%] max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>

              <h2 className="text-xl font-semibold">
                {t.appSubmitted}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                {t.teamReview}
              </p>

              <button
                onClick={() => {
                  setShowSuccess(false);
                  navigate("/");
                }}
                className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-white hover:bg-indigo-700 transition"
              >
                {t.goHome}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ================= Reusable Inputs ================= */
const Input = ({ label, ...props }) => (
  <div>
    <label className="mb-2 block text-sm font-medium">{label}</label>
    <input
      {...props}
      required
      className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
    />
  </div>
);

const FileInput = ({ label, helper, t, ...props }) => {
  const [fileName, setFileName] = React.useState("");
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <label className="flex items-center gap-3 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 cursor-pointer hover:border-indigo-400 transition">
        <span className="text-sm font-medium text-indigo-600 whitespace-nowrap">{t.chooseFile}</span>
        <span className="text-sm text-slate-500 truncate">{fileName || t.noFileChosen}</span>
          <input
          type="file"
          required
          style={{ display: "none" }}
          className="hidden"
          onChange={(e) => {
            setFileName(e.target.files[0]?.name || "");
            props.onChange && props.onChange(e);
          }}
        />
      </label>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
};

export default PartnerApplication;

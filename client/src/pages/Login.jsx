import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../config/api";
import { loginSuccess } from "../app/features/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();  const location = useLocation();
  const [state, setState] = useState(location.pathname === '/register' ? 'register' : 'login'); // login | register
  const [loading, setLoading] = useState(false);

  // Sync state if URL changes (e.g. user clicks Navbar link while already on the page)
  useEffect(() => {
    setState(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        state === "login" ? "/auth/login" : "/auth/register";

      const res = await api.post(endpoint, formData);

      // ✅ Save user + token (localStorage persistence handled inside loginSuccess)
      dispatch(
        loginSuccess({
          user: res.data.user,
          token: res.data.token,
        })
      );

      toast.success(
        state === "login" ? "Logged in successfully" : "Account created"
      );

      // 🔑 ROLE BASED REDIRECT
      const role = res.data.user?.role;

      if (role === "service_provider") {
        navigate("/provider/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl px-8 py-10 border border-gray-100 transition-all duration-300 hover:shadow-2xl"
      >
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {state === "login" ? "Welcome Back 👋" : "Create Account"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {state === "login"
              ? "Login to continue"
              : "Sign up to get started"}
          </p>
        </div>

        {/* NAME */}
        {state === "register" && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full mt-6 h-12 px-4 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            required
          />
        )}

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          className="w-full mt-4 h-12 px-4 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          required
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mt-4 h-12 px-4 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          required
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold tracking-wide hover:opacity-95 active:scale-[0.98] transition"
        >
          {loading
            ? "Please wait..."
            : state === "login"
            ? "Login"
            : "Create Account"}
        </button>

        {/* TOGGLE */}
        <p
          onClick={() => {
            const nextState = state === "login" ? "register" : "login";
            setState(nextState);
            navigate(`/${nextState}`);
          }}
          className="text-center text-sm text-gray-500 mt-6 cursor-pointer"
        >
          {state === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <span className="text-indigo-600 font-medium hover:underline">
            Click here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;

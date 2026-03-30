// src/pages/VisitorRegistration.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../service/api";
import { 
  FaUser, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope,
  FaArrowRight,
  FaIdCard,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaHistory
} from "react-icons/fa";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { GiPassport } from "react-icons/gi";
import toast from "react-hot-toast";

const VisitorRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    institution: "",
    contactType: "Phone",
    contactValue: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [visitInfo, setVisitInfo] = useState(null);

  useEffect(() => {
    localStorage.removeItem("currentVisitor");
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }
    
    if (!formData.institution.trim()) {
      newErrors.institution = "Institution is required";
    }
    
    if (!formData.contactValue.trim()) {
      newErrors.contactValue = `${formData.contactType} number is required`;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    setLoading(true);
    setVisitInfo(null);

    try {
      const visitorData = {
        fullName: formData.fullName.trim(),
        institution: formData.institution.trim(),
        contactType: formData.contactType,
        contactValue: formData.contactValue.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      const res = await API.createVisitor(visitorData);
      
      localStorage.setItem("currentVisitor", JSON.stringify(res.data.visitor));
      
      setVisitInfo({
        isReturning: res.data.isReturning,
        visitNumber: res.data.visitNumber
      });
      
      toast.success(res.data.msg, { duration: 5000 });
      
      setTimeout(() => {
        navigate("/service-request", { state: { visitor: res.data.visitor } });
      }, 2000);
      
    } catch (err) {
      console.error("Registration error:", err);
      const errorMsg = err.response?.data?.msg || err.message || "Something went wrong. Please try again.";
      toast.error(errorMsg);
      
      if (errorMsg.includes("email")) {
        setErrors({ ...errors, email: errorMsg });
      } else if (errorMsg.includes("contact")) {
        setErrors({ ...errors, contactValue: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-3 sm:mb-4">
            <FaIdCard className="text-white text-2xl sm:text-3xl" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Visitor Registration</h2>
          <p className="text-sm sm:text-base text-gray-500 px-2">Please fill in your details to register at the reception</p>
        </div>

        {/* Visit Info Banner */}
        {visitInfo && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center space-x-2 sm:space-x-3 ${
            visitInfo.isReturning ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            {visitInfo.isReturning ? (
              <FaStar className="text-purple-500 text-lg sm:text-xl flex-shrink-0" />
            ) : (
              <FaHistory className="text-blue-500 text-lg sm:text-xl flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-sm sm:text-base truncate ${visitInfo.isReturning ? 'text-purple-700' : 'text-blue-700'}`}>
                {visitInfo.isReturning 
                  ? `Welcome back! This is your ${visitInfo.visitNumber}th visit.` 
                  : "Welcome! This is your first visit."}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {visitInfo.isReturning 
                  ? "Thank you for choosing us again!" 
                  : "We're excited to have you here!"}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Full Name *
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-500 flex items-center space-x-1">
                <FaExclamationTriangle className="text-xs" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Institution *
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
              <input
                type="text"
                name="institution"
                placeholder="Organization/Company name"
                value={formData.institution}
                onChange={handleChange}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.institution ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.institution && (
              <p className="mt-1 text-xs text-red-500">{errors.institution}</p>
            )}
          </div>

          {/* Contact Type and Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Contact Type *
              </label>
              <select
                name="contactType"
                value={formData.contactType}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              >
                <option value="Phone">Phone Number</option>
                <option value="Passport">Passport Number</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                {formData.contactType} Number *
              </label>
              <div className="relative">
                {formData.contactType === "Phone" ? (
                  <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                ) : (
                  <GiPassport className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                )}
                <input
                  type="text"
                  name="contactValue"
                  placeholder={`Enter your ${formData.contactType.toLowerCase()} number`}
                  value={formData.contactValue}
                  onChange={handleChange}
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.contactValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.contactValue && (
                <p className="mt-1 text-xs text-red-500">{errors.contactValue}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Email Address *
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email (for notifications)"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center space-x-1">
                <FaExclamationTriangle className="text-xs" />
                <span>{errors.email}</span>
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">We'll send request updates to this email</p>
          </div>

          {/* Info Boxes */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 flex items-center space-x-2">
            <FaCheckCircle className="text-blue-500 text-base sm:text-xl flex-shrink-0" />
            <span className="text-blue-700 text-xs sm:text-sm">
              You can register multiple times - each visit creates a new record
            </span>
          </div>

          <div className="bg-green-50 rounded-lg p-3 sm:p-4 flex items-center space-x-2">
            <MdLocationOn className="text-green-500 text-base sm:text-xl flex-shrink-0" />
            <span className="text-green-700 text-xs sm:text-sm">Location: Kigali, Rwanda</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 sm:py-3 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Register & Continue"}
            <FaArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorRegistration;
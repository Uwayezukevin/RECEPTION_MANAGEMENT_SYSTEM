// src/pages/VisitorServiceRequest.jsx - White Theme
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../service/api";
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope,
  FaArrowRight,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaUserCheck,
  FaClipboardList
} from "react-icons/fa";
import { MdEmail, MdEvent } from "react-icons/md";
import { GiPassport } from "react-icons/gi";
import toast from "react-hot-toast";
import logo from "../assets/image.png";

const VisitorServiceRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  
  const [formData, setFormData] = useState({
    nationality: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    passportNumber: "",
    service: "",
    eventDate: "",
    message: ""
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await API.getServices();
      if (res.data.Services?.length > 0) {
        setServices(res.data.Services);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Could not fetch services");
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.nationality) newErrors.nationality = "Please select your nationality";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.fullName?.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (formData.nationality === 'rwandan') {
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = "Phone number is required for Rwandan citizens";
    } else {
      if (!formData.phoneNumber?.trim() && !formData.passportNumber?.trim()) {
        newErrors.contact = "Either Phone Number or Passport Number is required";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.service) newErrors.service = "Please select a service";
    if (!formData.eventDate) newErrors.eventDate = "Please select an event date";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleNationalitySelect = (nationality) => {
    setFormData({ ...formData, nationality });
    setErrors({ ...errors, nationality: "" });
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    setLoading(true);

    try {
      const requestData = {
        fullName: formData.fullName.trim(),
        nationality: formData.nationality,
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber?.trim() || "",
        passportNumber: formData.passportNumber?.trim() || "",
        service: formData.service,
        eventDate: formData.eventDate,
        message: formData.message || ""
      };

      const response = await API.createVisitorWithRequest(requestData);
      toast.success(response.data.msg || "Registration and request submitted successfully!");
      localStorage.removeItem("currentVisitor");
      navigate(`/request-status?id=${response.data.request._id}`);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(err.response?.data?.msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          <div className={`flex-1 text-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>1</div>
            <span className="text-sm">Nationality</span>
          </div>
          <div className={`flex-1 text-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>2</div>
            <span className="text-sm">Your Details</span>
          </div>
          <div className={`flex-1 text-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>3</div>
            <span className="text-sm">Service Request</span>
          </div>
        </div>

        {/* Step 1: Nationality Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Select Your Nationality</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleNationalitySelect("rwandan")} className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center">
                <div className="text-5xl mb-3">🇷🇼</div>
                <h3 className="text-xl font-semibold mb-2">Rwandan</h3>
                <p className="text-gray-500 text-sm">I am a Rwandan citizen</p>
              </button>
              <button onClick={() => handleNationalitySelect("foreigner")} className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all text-center">
                <div className="text-5xl mb-3">🌍</div>
                <h3 className="text-xl font-semibold mb-2">Foreigner</h3>
                <p className="text-gray-500 text-sm">I am a foreign visitor</p>
              </button>
            </div>
            {errors.nationality && <p className="mt-4 text-center text-red-500 text-sm">{errors.nationality}</p>}
          </div>
        )}

        {/* Step 2: Personal Details */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {formData.nationality === "rwandan" ? "Rwandan Citizen Details" : "Foreign Visitor Details"}
            </h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative"><FaUser className="absolute left-3 top-3 text-gray-400" />
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} />
                </div>{errors.fullName && <p className="mt-1 text-red-500 text-sm">{errors.fullName}</p>}
              </div>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <div className="relative"><MdEmail className="absolute left-3 top-3 text-gray-400" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                </div>{errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
              </div>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number {formData.nationality === "rwandan" && "*"}</label>
                <div className="relative"><FaPhone className="absolute left-3 top-3 text-gray-400" />
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Enter your phone number" className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`} />
                </div>{errors.phoneNumber && <p className="mt-1 text-red-500 text-sm">{errors.phoneNumber}</p>}
              </div>
              
              {formData.nationality === "foreigner" && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <div className="relative"><GiPassport className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleChange} placeholder="Enter your passport number" className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Either phone number or passport number is required</p>
                </div>
              )}
              {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
            </div>
            <div className="flex justify-between mt-6">
              <button type="button" onClick={handleBack} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"><FaArrowLeft /> Back</button>
              <button type="button" onClick={handleNext} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">Next <FaArrowRight /></button>
            </div>
          </div>
        )}

        {/* Step 3: Service Request */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Service Request</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Select Service *</label>
                <div className="relative"><FaClipboardList className="absolute left-3 top-3 text-gray-400" />
                  <select name="service" value={formData.service} onChange={handleChange} className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.service ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Choose a service</option>
                    {services.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                  </select>
                </div>{errors.service && <p className="mt-1 text-red-500 text-sm">{errors.service}</p>}
              </div>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                <div className="relative"><MdEvent className="absolute left-3 top-3 text-gray-400" />
                  <input type="date" name="eventDate" min={minDate} value={formData.eventDate} onChange={handleChange} className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.eventDate ? 'border-red-500' : 'border-gray-300'}`} />
                </div>{errors.eventDate && <p className="mt-1 text-red-500 text-sm">{errors.eventDate}</p>}
              </div>
              
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea name="message" rows="3" value={formData.message} onChange={handleChange} placeholder="Any additional information..." className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button type="button" onClick={handleBack} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center gap-2"><FaArrowLeft /> Back</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                {loading ? <FaSpinner className="animate-spin" /> : "Submit Request"} <FaArrowRight />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VisitorServiceRequest;
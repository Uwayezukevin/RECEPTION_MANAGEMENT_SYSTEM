// src/pages/ServiceRequestForm.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../service/api";
import { 
  FaPaperPlane, 
  FaTimes,
  FaClipboardList,
  FaSpinner,
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaEye
} from "react-icons/fa";
import { MdEvent, MdMessage } from "react-icons/md";
import toast from "react-hot-toast";

const ServiceRequestForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [visitor, setVisitor] = useState(null);

  const [formData, setFormData] = useState({
    service: "",
    eventDate: "",
    message: ""
  });

  useEffect(() => {
    let currentVisitor = null;

    if (location.state?.visitor) {
      currentVisitor = location.state.visitor;
    } else {
      const storedVisitor = localStorage.getItem("currentVisitor");
      if (storedVisitor) {
        currentVisitor = JSON.parse(storedVisitor);
      }
    }

    if (currentVisitor) {
      setVisitor(currentVisitor);
    } else {
      toast.error("Please complete visitor registration first");
      navigate("/visitor-registration");
      return;
    }

    fetchServices();
  }, [location.state, navigate]);

  const fetchServices = async () => {
    try {
      const res = await API.getServices();
      if (res.data.Services?.length > 0) {
        setServices(res.data.Services);
      } else {
        setServices(defaultServices);
      }
    } catch (error) {
      toast.error("Could not fetch services. Using default list.");
      setServices(defaultServices);
    }
  };

  const defaultServices = [
    { _id: "1", name: "Rwanda Law Reform Commission" },
    { _id: "2", name: "Prime Minister Head Office" },
    { _id: "3", name: "MININFRA" },
    { _id: "4", name: "MINIJUST" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!visitor) {
      toast.error("Please complete visitor registration first");
      navigate("/visitor-registration");
      return;
    }

    if (!formData.service) return toast.error("Please select a service");
    if (!formData.eventDate) return toast.error("Please select a date");

    setLoading(true);

    try {
      const res = await API.createRequest(visitor._id, {
        ...formData,
        priority: "medium"
      });

      toast.success(res.data.msg || "Request submitted!");

      localStorage.removeItem("currentVisitor");

      const requestId = res.data.request._id;
      navigate(`/request-status?id=${requestId}`);

    } catch (err) {
      toast.error(err.response?.data?.msg || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  if (!visitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <FaSpinner className="animate-spin text-4xl text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-5 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-3">
            <FaClipboardList className="text-white text-2xl sm:text-3xl" />
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-800">
            Service Request
          </h2>
          <p className="text-gray-500 text-sm sm:text-base">
            Fill in the details below
          </p>
        </div>

        {/* Visitor Info */}
        <div className="bg-blue-50 p-4 rounded-xl mb-6 border">
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
            
            <div className="flex items-center gap-2">
              <FaUser className="text-primary-500" />
              <span className="text-sm font-medium">{visitor.fullName}</span>
            </div>

            <div className="flex items-center gap-2">
              <FaBuilding className="text-primary-500" />
              <span className="text-sm">{visitor.institution}</span>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <FaEnvelope className="text-primary-500" />
              <span className="text-sm break-all">{visitor.email}</span>
            </div>

          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Service */}
          <div>
            <label className="text-sm font-medium">Service *</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select service</option>
              {services.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium">Event Date *</label>
            <div className="relative">
              <MdEvent className="absolute left-3 top-3 text-gray-400" />
              <input
                type="date"
                name="eventDate"
                min={minDate}
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full pl-10 p-2 border rounded-lg"
                required
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium">Message</label>
            <div className="relative">
              <MdMessage className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                className="w-full pl-10 p-2 border rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
            <FaEye />
            <span>You can track your request after submission.</span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full sm:w-1/2 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 flex justify-center items-center gap-2"
            >
              <FaTimes /> Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:scale-105 transition"
            >
              {loading ? <FaSpinner className="animate-spin" /> : "Submit"}
              <FaPaperPlane />
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
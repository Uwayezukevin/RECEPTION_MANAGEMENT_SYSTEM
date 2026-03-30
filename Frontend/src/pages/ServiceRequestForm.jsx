// src/pages/ServiceRequestForm.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../service/api";
import { 
  FaCalendarAlt, 
  FaPaperPlane, 
  FaTimes,
  FaClipboardList,
  FaCommentDots,
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaEye
} from "react-icons/fa";
import { MdEvent, MdMessage } from "react-icons/md";
import { GiNotebook } from "react-icons/gi";
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
    // Get visitor from location state or localStorage
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
      console.log("Visitor loaded:", currentVisitor);
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
      if (res.data.Services && res.data.Services.length > 0) {
        setServices(res.data.Services);
      } else {
        // Fallback services
        setServices([
          { _id: "1", name: "Rwanda Law Reform Commission", department: "Legal" },
          { _id: "2", name: "Prime Minister Head Office", department: "Government" },
          { _id: "3", name: "MININFRA", department: "Infrastructure" },
          { _id: "4", name: "MINIJUST", department: "Justice" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Could not fetch services. Using default list.");
      setServices([
        { _id: "1", name: "Rwanda Law Reform Commission", department: "Legal" },
        { _id: "2", name: "Prime Minister Head Office", department: "Government" },
        { _id: "3", name: "MININFRA", department: "Infrastructure" },
        { _id: "4", name: "MINIJUST", department: "Justice" }
      ]);
    }
  };

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

    if (!formData.service) {
      toast.error("Please select a service");
      return;
    }

    if (!formData.eventDate) {
      toast.error("Please select an event date");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        service: formData.service,
        eventDate: formData.eventDate,
        message: formData.message,
        priority: "medium"
      };
      
      console.log("Submitting request for visitor:", visitor._id);
      console.log("Request data:", requestData);
      
      const res = await API.createRequest(visitor._id, requestData);
      
      console.log("Response:", res.data);
      
      toast.success(res.data.msg || "Service request submitted successfully!");
      
      // Clear the stored visitor after successful submission
      localStorage.removeItem("currentVisitor");
      
      // Get the request ID from the response
      const requestId = res.data.request._id;
      
      // Redirect to request status page with the request ID
      navigate(`/request-status?id=${requestId}`);
      
    } catch (err) {
      console.error("ERROR:", err);
      console.error("Response:", err.response?.data);
      
      const errorMsg = err.response?.data?.msg || "Error submitting request. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!visitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <div className="text-center text-white">
          <FaSpinner className="animate-spin text-5xl mx-auto mb-4" />
          <p>Loading visitor information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4">
            <FaClipboardList className="text-white text-3xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Service Request Form</h2>
          <p className="text-gray-500">Fill in the details for your service request</p>
        </div>

        {/* Visitor Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <FaUser className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Visitor</p>
              <p className="font-semibold text-gray-800">{visitor.fullName}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Institution</p>
              <p className="font-semibold text-gray-800 flex items-center space-x-1">
                <FaBuilding className="text-gray-400 text-xs" />
                <span>{visitor.institution}</span>
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-semibold text-gray-800 flex items-center space-x-1">
                <FaEnvelope className="text-gray-400 text-xs" />
                <span>{visitor.email}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service *
            </label>
            <div className="relative">
              <FaClipboardList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                required
              >
                <option value="">Choose a service</option>
                {services.map(service => (
                  <option key={service._id} value={service._id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Date *
            </label>
            <div className="relative">
              <MdEvent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                name="eventDate"
                min={minDate}
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message / Additional Details
            </label>
            <div className="relative">
              <MdMessage className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="message"
                rows="5"
                placeholder="Enter any additional information about your request..."
                value={formData.message}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 flex items-center space-x-2">
            <FaEye className="text-blue-500 text-xl" />
            <span className="text-blue-700 text-sm">
              After submission, you'll be redirected to a page where you can track your request status.
            </span>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FaTimes />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <FaSpinner className="animate-spin" /> : "Submit Request"}
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceRequestForm;
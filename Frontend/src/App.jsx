// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import RegisterReceptionist from "./pages/RegisterReceptionist";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import VisitorServiceRequest from "./pages/VisitorServiceRequest";
import VisitorsList from "./pages/VisitorsList";
import Home from "./pages/Home";
import RequestStatus from "./pages/RequestStatus";
import "./index.css";

const App = () => {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 4000,
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/visitor-service" element = {<VisitorServiceRequest />} />
          <Route path="/request-status" element={<RequestStatus />} />
          
          {/* Receptionist Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-receptionist" element={<RegisterReceptionist />} />
          <Route
            path="/receptionist-dashboard"
            element={
              <ProtectedRoute allowedRoles={["receptionist"]}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitors-list"
            element={
              <ProtectedRoute allowedRoles={["receptionist"]}>
                <VisitorsList />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
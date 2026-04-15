// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import VisitorServiceRequest from "./pages/VisitorServiceRequest";
import VisitorsList from "./pages/VisitorsList";
import RequestStatus from "./pages/RequestStatus";
import VisitorQrcode from "./pages/VisitorQrcode";

// Meeting Module Imports
import MeetingSignInPage from "./pages/MeetingSignInPage";

// Admin Module Imports
import AdminDashboard from "./pages/admin/AdminDashboard";

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
          <Route path="/" element={<Login />} />
          <Route path="/visitor-service" element={<VisitorServiceRequest />} />
          <Route path="/request-status" element={<RequestStatus />} />
          <Route path="/visitor-qrcode" element={<VisitorQrcode />} />
          <Route path= "/meeting/signin/:meetingId" element = {<MeetingSignInPage />}/>
          {/* Auth Routes */}
          
          <Route path="/register" element={<Register />} />
          
          {/* Receptionist Routes (also accessible by Admin) */}
          <Route
            path="/receptionist-dashboard"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visitors-list"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
                <VisitorsList />
              </ProtectedRoute>
            }
          />
          
          
          {/* Admin Only Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
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
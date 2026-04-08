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

// Meeting Module Imports
import Meetings from "./pages/admin/Meetings";
import CreateMeeting from "./pages/admin/CreateMeeting";

// Admin Module Imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersList from "./pages/admin/UsersList";

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
          <Route path="/visitor-service" element={<VisitorServiceRequest />} />
          <Route path="/request-status" element={<RequestStatus />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register-receptionist" element={<RegisterReceptionist />} />
          
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
          
          {/* Meeting Routes (accessible by both Receptionist and Admin) */}
          <Route
            path="/meetings"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
                <Meetings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/create"
            element={
              <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
                <CreateMeeting />
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
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UsersList />
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
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Auth Pages
import Login from './components/Auth/Login.jsx';
import Signup from './components/Auth/Signup.jsx';
import ForgotPassword from './components/Auth/ForgotPassword.jsx';
import ResetPassword from './components/Auth/ResetPassword.jsx';

// User Dashboard
import Dashboard from './components/Auth/dashboard.jsx';
import CreateAgent from './components/Auth/CreateAgent.jsx';
import UpdateAgent from './components/Auth/UpdateAgent.jsx';
import AccountSettings from './components/Auth/AccountSettings.jsx';
import AboutUs from './components/Auth/AboutUs.jsx';
import ChatbotTestPage from './components/Auth/ChatbotTestPage.jsx';
import VerifyEmail from './components/Auth/VerifyEmail'; // adjust path
import PluginPage from './components/Auth/Pluginpage.jsx';
import TestEmbed from './components/Auth/testets.jsx';

// Admin Panel
import AdminDashboard from './components/Auth/AdminDashboard.jsx';
import ViewUser from './components/Auth/ViewUser.jsx';
import EditUser from './components/Auth/EditUser.jsx';


// Layout & Hero
import MainLayout from './components/Auth/MainLayout.jsx';
import Hero from './components/Auth/Hero.jsx';

// Add the new route for the embedded chatbot
import EmbeddedChat from './components/Auth/EmbeddedChat.jsx';

import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';


export default function App() {
  return (
    
    <Router>
      <Routes>
        {/* Public Landing & Auth */}
        <Route path="/verify/:token" element={<VerifyEmail />} />
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />


        {/* OPTIONAL fallback for admin login URL */}
        {/* Redirects admins to same login page if they manually visit /admin/login */}
        <Route path="/admin/login" element={<Login />} />

        {/* User Area under /app - Protected */}
        <Route path="/app" element={<ProtectedRoute />} >
          <Route element={<MainLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="about" element={<AboutUs />} />
            <Route path="create-agent" element={<CreateAgent />} />
            <Route path="chatbot/test/:id" element={<ChatbotTestPage />} />
            <Route path="update/:type/:id" element={<UpdateAgent />} />
            <Route path="update-searchbot/:id" element={<UpdateAgent type="searchbot" />} />
            <Route path="chatbots/:chatbotId/plugin" element={<PluginPage />} />
            <Route path="test-plugin" element={<TestEmbed />} />
          </Route>
        </Route>

        {/* Admin Panel - Needs AdminProtectedRoute (Not implemented yet) */}
        {/* For now, these are still accessible after user logout */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users/:userId" element={<ViewUser />} />
        <Route path="/admin/users/:userId/edit" element={<EditUser />} />

        // Add the new route for the embedded chatbot
        <Route path="/chatbot/embed/:chatbotId" element={<EmbeddedChat defaultOpen={false} />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />

    </Router>
  );
}
  
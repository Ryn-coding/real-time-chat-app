import { useState } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import ProfilePage from './pages/ProfilePage'; // Import the new pages
import SettingsPage from './pages/SettingsPage'; // Import the new components
import GroupChat from "./pages/GroupChat";

import './App.css';

import { useAuth } from "./AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or show a loading spinner

  return user ? children : <Navigate to="/login" />;
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={
        <ProtectedRoute>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/group-chat" element={
        <ProtectedRoute>
          <GroupChat />
        </ProtectedRoute>
      } />

      {/* <Route path="*" element={<Navigate to="/login" />} /> */}
    </Routes>
  );
}

export default App;


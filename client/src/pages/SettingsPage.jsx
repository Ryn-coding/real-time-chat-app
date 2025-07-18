import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext'; // Assuming AuthContext provides user and token

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for dark mode (independent from Navbar for demonstration, but can be synced)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // State for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundNotifications: true,
  });

  // Effect to apply/remove dark mode class to the document body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load user-specific settings from backend on mount (conceptual)
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !token) return;
      setLoading(true);
      setError('');
      try {
        // Replace with your actual API endpoint for fetching user settings
        const res = await axios.get('http://localhost:5000/api/users/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Assuming backend returns an object like { emailNotifications: true, ... }
        setNotificationSettings(res.data.settings || notificationSettings);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user, token]);

  const handleNotificationToggle = (settingName) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [settingName]: !prev[settingName],
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // API call to update settings
      await axios.put(
        'http://localhost:5000/api/users/settings', // Your backend endpoint for settings updates
        notificationSettings, // Send all notification settings
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4 font-inter dark:bg-gray-900 dark:from-gray-800 dark:to-gray-900">
      {/* Inline CSS for the toggle switch animation */}
      <style>
        {`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .dot {
          transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
        }

        input:checked + div {
          background-color: #2563eb; /* Blue for checked state */
        }

        input:checked + div + .dot {
          transform: translateX(1.5rem); /* Move 1.5rem (24px) for 14-width toggle (w-14 h-8) */
        }

        /* Dark mode specific styles for the toggle */
        .dark input:checked + div {
            background-color: #3b82f6; /* Lighter blue in dark mode when checked */
        }
        .dark input + div {
            background-color: #4b5563; /* Darker gray in dark mode when unchecked */
        }
        .dark input + div .dot {
            background-color: #e5e7eb; /* Lighter dot in dark mode */
        }
        `}
      </style>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-[1.01]">
        <h2 className="text-4xl font-extrabold text-center text-gray-800 dark:text-white mb-8 tracking-tight">
          App Settings
        </h2>

        {error && (
          <div className="p-3 mb-4 rounded-lg text-sm bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" role="alert">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 mb-4 rounded-lg text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" role="alert">
            {successMessage}
          </div>
        )}

        <div className="space-y-8">
          {/* General Settings */}
          <section>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2 border-gray-200 dark:border-gray-600">
              General
            </h3>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-800 dark:text-gray-300 font-medium">Dark Mode</span>
              <label htmlFor="darkModeToggle" className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="darkModeToggle"
                    className="sr-only"
                    checked={isDarkMode}
                    onChange={() => setIsDarkMode(!isDarkMode)}
                    disabled={loading}
                  />
                  <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full transition-colors duration-300"></div>
                  <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full"></div>
                </div>
              </label>
            </div>
          </section>

          {/* Notification Settings */}
          <section>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2 border-gray-200 dark:border-gray-600">
              Notifications
            </h3>
            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-gray-800 dark:text-gray-300 font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()} {/* Converts camelCase to "Camel Case" */}
                  </span>
                  <label htmlFor={key} className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id={key}
                        className="sr-only"
                        checked={value}
                        onChange={() => handleNotificationToggle(key)}
                        disabled={loading}
                      />
                      <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full transition-colors duration-300"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full"></div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Account Management */}
          <section>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2 border-gray-200 dark:border-gray-600">
              Account
            </h3>
            <button
              onClick={() => alert('Navigate to Change Password page or open modal')} // Replace with actual navigation
              className="w-full py-3 px-4 rounded-lg text-blue-600 dark:text-blue-300 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 font-semibold transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Change Password
            </button>
          </section>

          <button
            onClick={handleSaveSettings}
            className="w-full py-3 px-4 rounded-lg text-white font-semibold text-lg shadow-md transition duration-300 ease-in-out bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

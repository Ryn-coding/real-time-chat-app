import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!username.trim()) {
      setError('Username cannot be empty.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', username);
      if (file) {
        formData.append('profilePicture', file);
      }

      const res = await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateUser(res.data.user);
      setProfilePicture(res.data.user.profilePicture || '');
      setSuccessMessage('Profile updated successfully!');
      e.target.reset();

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4 font-inter">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700">
        <h2 className="text-4xl font-extrabold text-center text-gray-800 dark:text-white mb-8">Your Profile</h2>

        {error && (
          <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-3 mb-4 text-sm bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          {profilePicture && (
            <div className="text-center">
              <img
                src={profilePicture}
                alt="Profile"
                className="mx-auto w-24 h-24 rounded-full object-cover border dark:border-gray-700"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Change Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 dark:text-gray-300
            file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 dark:file:border-gray-600
            file:rounded-md file:bg-white dark:file:bg-gray-800
            file:text-gray-700 dark:file:text-gray-300 file:cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 cursor-not-allowed dark:border-gray-600 dark:text-gray-300"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed from here.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>

  );
}

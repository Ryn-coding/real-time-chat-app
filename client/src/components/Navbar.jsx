import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Assuming AuthContext provides user info and logout
import logo from '../assets/real-chat-logo-2.png';

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Initialize dark mode from localStorage or default to false
        return localStorage.getItem('theme') === 'dark';
    });
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    // Toggle profile dropdown menu
    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(prev => !prev);
    };

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex items-center justify-between transition-colors duration-300 ease-in-out">
            {/* Logo/App Name */}
            <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200">
                    <img src={logo} alt="logo" width="50" />
                </Link>
            </div>

            {/* Navigation Links (Hidden on small screens, shown on medium and up) */}
            <div className="hidden md:flex items-center space-x-6">
                <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                    Home
                </Link>
                {user && (
                    <Link to="/chat" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                        Chat
                    </Link>
                )}
            </div>


            {/* Right Section: Dark Mode Toggle, Profile */}
            <div className="flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? (
                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M13 3a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0V3ZM6.343 4.929A1 1 0 0 0 4.93 6.343l1.414 1.414a1 1 0 0 0 1.414-1.414L6.343 4.929Zm12.728 1.414a1 1 0 0 0-1.414-1.414l-1.414 1.414a1 1 0 0 0 1.414 1.414l1.414-1.414ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-9 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H3Zm16 0a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2h-2ZM7.757 17.657a1 1 0 1 0-1.414-1.414l-1.414 1.414a1 1 0 1 0 1.414 1.414l1.414-1.414Zm9.9-1.414a1 1 0 0 0-1.414 1.414l1.414 1.414a1 1 0 0 0 1.414-1.414l-1.414-1.414ZM13 19a1 1 0 1 0-2 0v2a1 1 0 1 0 2 0v-2Z" clipRule="evenodd" />
                        </svg>

                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {/* Profile Dropdown */}
                {user ? (
                    <div className="relative profile-menu-container">
                        <button
                            onClick={toggleProfileMenu}
                            className="flex items-center space-x-2 p-2 rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <img
                                src={user.profilePicture || `https://placehold.co/40x40/aabbcc/ffffff?text=${user.username.charAt(0).toUpperCase()}`}
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full border-2 border-blue-400 dark:border-blue-300"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/cccccc/333333?text=U"; }}
                            />
                            <span className="font-medium hidden sm:block">{user.username}</span>
                            <svg
                                className={`w-4 h-4 ml-1 transform transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>

                        {isProfileMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-20 transition-all duration-200 ease-out transform origin-top-right scale-100 opacity-100">
                                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150">Profile</Link>
                                <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150">Settings</Link>
                                <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                                <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-800 transition-colors duration-150">Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                            Login
                        </Link>
                        <Link to="/register" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                            Register
                        </Link>
                    </div>
                )}

            </div>
        </nav>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        {user ? (
          <img
            src={user.profilePicture || `https://placehold.co/40x40/aabbcc/ffffff?text=${user.username.charAt(0).toUpperCase()}`}
            alt="User Avatar"
            className="w-50 rounded-full border-2 border-blue-400 dark:border-blue-300 mb-4"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/40x40/cccccc/333333?text=U";
            }}
          />
        ) : (
          <p>Not Logged in</p>
        )}

        <h1 className="text-5xl font-extrabold mb-4">
          Welcome <span className="text-blue-600 dark:text-blue-400">{user ? ` ${user.username},` : ''}</span> to RealChat
        </h1>

        <p className="text-lg mb-8">
          {user
            ? 'Start chatting with your friends in real-time.'
            : 'Login or register to start chatting instantly and securely.'}
        </p>

        <div className="space-x-4">
          {user ? (
            <>
              <Link
                to="/chat"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition"
              >
                Go to Chat
              </Link>
              <Link
                to="/profile"
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-800 transition"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-800 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {['Create Account', 'Add Friends', 'Start Chatting', 'Get Notifications'].map((step, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:scale-105 transition transform"
            >
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { title: '💬 Real-time Messaging', desc: 'Chat live with friends using Socket.IO.' },
            { title: '🔔 Smart Notifications', desc: 'Get alerted for new messages instantly.' },
            { title: '🌙 Dark Mode', desc: 'Switch themes seamlessly for better viewing.' },
            { title: '🧑 Profile Customization', desc: 'Edit your avatar, status, and info.' },
            { title: '🔒 Secure & Private', desc: 'Your data stays yours. Fully encrypted.' },
            { title: '⚡ Fast & Lightweight', desc: 'Built with React, Node.js, and MongoDB.' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-700 dark:text-gray-300">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section className="px-6 py-16 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Preview the Chat Interface</h2>
        <img
          src="https://placehold.co/800x400?text=Chat+UI+Preview"
          alt="Chat UI Preview"
          className="rounded-lg shadow-lg mx-auto"
        />
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-indigo-100 to-blue-50 dark:from-gray-800 dark:to-gray-700 py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              quote: 'Super fast and clean. Exactly what I wanted from a chat app.',
              name: 'Sarah K.',
            },
            {
              quote: 'No bloat, no ads. Just pure real-time chatting!',
              name: 'Jay D.',
            },
          ].map((testimonial, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <p className="italic mb-4">“{testimonial.quote}”</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">– {testimonial.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 text-center py-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} RealChat. Built with ❤️ by Aryan.
        </p>
      </footer>
    </div>

  );
}

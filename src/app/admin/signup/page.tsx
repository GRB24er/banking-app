// src/app/admin/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSignupPage() {
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'andyjonhson50@gmail.com',
    password: 'Valmont15#',
    secretKey: 'ADMIN_SECRET_123' // Add a secret key for admin registration
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Auto login after successful signup
        setTimeout(() => {
          router.push('/admin');
        }, 3000);
      } else {
        setError(data.message || 'Admin signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-4">Admin Account Created!</h1>
          <p className="mb-6">You will be redirected to the admin dashboard shortly.</p>
          <button 
            onClick={() => router.push('/admin')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Go to Admin Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-white">Admin Portal Setup</h1>
          <p className="text-gray-400 mt-2">Create your admin account</p>
        </div>
        
        {error && <div className="bg-red-500 text-white p-3 rounded-md mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Admin Secret Key</label>
            <input
              type="password"
              value={formData.secretKey}
              onChange={(e) => setFormData({...formData, secretKey: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter secret key"
            />
            <p className="text-xs text-gray-500 mt-1">Contact system administrator for the secret key</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-gray-400">
          <p className="text-sm">This page is for initial admin setup only. It will be removed after setup.</p>
        </div>
      </div>
    </div>
  );
}
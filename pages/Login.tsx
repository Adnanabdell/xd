import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string) => {
    setLoading(true);
    try {
      await login(email);
    } catch (e) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-blue-600">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">ScholarFlow Manager</h2>
          <p className="text-blue-100 mt-2">Secure Attendance System</p>
        </div>
        
        <div className="p-8">
          <p className="text-gray-600 text-center mb-8">
            Select a role to simulate login (Authentication Bypass for Demo)
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleLogin('admin@school.com')}
              disabled={loading}
              className="w-full flex items-center p-4 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:bg-blue-100 group-hover:text-blue-600">
                <Lock size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Admin Login</p>
                <p className="text-sm text-gray-500">Access full system & logs</p>
              </div>
            </button>

            <button
              onClick={() => handleLogin('teacher@school.com')}
              disabled={loading}
              className="w-full flex items-center p-4 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4 group-hover:bg-blue-100 group-hover:text-blue-600">
                <User size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Teacher Login</p>
                <p className="text-sm text-gray-500">Access assigned classes</p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Mock Backend Environment v1.0.4</p>
            <p>Secure Hash Algorithm SHA-256 (Simulated)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import RadarChart from './components/RadarChart';
import MotivationPage from './components/MotivationPage';
import Leaderboard from './components/Leaderboard';
import BadgeCollection from './components/BadgeCollection';
import Layout from './components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const authValue = {
    user,
    token,
    login,
    logout,
    refreshUser: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route 
              path="/auth" 
              element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} 
            />
            {user && (
              <Route path="/" element={<Layout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<TaskManager />} />
                <Route path="progress" element={<RadarChart />} />
                <Route path="motivation" element={<MotivationPage />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="badges" element={<BadgeCollection />} />
              </Route>
            )}
          </Routes>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export { AuthContext };
export default App;
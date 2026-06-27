import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Signup from './pages/Signup.jsx';
import Landing from './pages/Landing.jsx';
import EventList from './pages/EventList.jsx';
import Recommendations from './pages/Recommendations.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <Router>
            <div className="app">
                {user && <Header user={user} onLogout={handleLogout} />}
                <Routes>
                    {!user ? (
                        <>
                            <Route path="/" element={<Landing />} />
                            <Route path="/login" element={<Login onLogin={handleLogin} />} />
                            <Route path="/admin-login" element={<AdminLogin onLogin={handleLogin} />} />
                            <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </>
                    ) : (
                        <>
                            <Route path="/" element={<EventList user={user} />} />
                            <Route path="/recommendations" element={<Recommendations user={user} />} />
                            <Route path="/dashboard" element={<StudentDashboard user={user} />} />
                            {user.role === 'admin' && (
                                <Route path="/admin" element={<AdminDashboard user={user} />} />
                            )}
                            <Route path="*" element={<Navigate to="/" />} />
                        </>
                    )}
                </Routes>
            </div>
        </Router>
    );
};

export default App;
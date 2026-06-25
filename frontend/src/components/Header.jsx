import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-logo">
                    <Link to="/">
                        <h1>College Events</h1>
                    </Link>
                </div>
                <nav className="header-nav">
                    <ul>
                        <li>
                            <Link to="/">Browse Events</Link>
                        </li>
                        <li>
                            <Link to="/recommendations">Recommended</Link>
                        </li>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                        {user.role === 'admin' && (
                            <li>
                                <Link to="/admin">Admin</Link>
                            </li>
                        )}
                        <li>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout ({user.name})
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
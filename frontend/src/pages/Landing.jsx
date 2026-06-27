import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/AuthPages.css';
import '../styles/Landing.css';

const Landing = () => {
    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Welcome to College Event Management</h2>
                <p className="auth-note">
                    Choose your path below to continue as a student or administrator.
                </p>
                <div className="landing-actions">
                    <Link to="/login" className="button button-primary landing-button">
                        Student Login
                    </Link>
                    <Link to="/admin-login" className="button button-secondary landing-button">
                        Admin Login
                    </Link>
                </div>
                <div className="landing-footer">
                    <p>
                        New student? <Link to="/signup">Sign up here</Link> and add your interests.
                    </p>
                    <p>
                        Admin note: this app currently recognizes <strong>kushv0703@gmail.com</strong> as an administrator email on registration.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Landing;

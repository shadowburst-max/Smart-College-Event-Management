import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const useAuth = () => {
    const [authData, setAuthData] = useState(() => {
        const storedData = localStorage.getItem('authData');
        return storedData ? JSON.parse(storedData) : null;
    });
    const history = useHistory();

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            setAuthData(response.data);
            localStorage.setItem('authData', JSON.stringify(response.data));
            history.push('/'); // Redirect to home after login
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logout = () => {
        setAuthData(null);
        localStorage.removeItem('authData');
        history.push('/login'); // Redirect to login after logout
    };

    const isAuthenticated = () => {
        return authData !== null;
    };

    useEffect(() => {
        const checkAuth = async () => {
            if (authData) {
                try {
                    await axios.get('/api/auth/verify'); // Verify token
                } catch (error) {
                    logout(); // Logout if token is invalid
                }
            }
        };
        checkAuth();
    }, [authData]);

    return { authData, login, logout, isAuthenticated };
};

export default useAuth;
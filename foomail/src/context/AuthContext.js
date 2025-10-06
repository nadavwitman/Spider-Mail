import { createContext, useContext, useState, useEffect } from 'react';
import { extractUserIdFromToken } from '../utils/jwtUtils';
import { getUserById } from '../services/userService';

// Create a React context for authentication
const AuthContext = createContext();

// AuthProvider component wraps the app and provides auth state
export function AuthProvider({ children }) {
  // Helper to get stored token from session or local storage
  const getStoredToken = () =>
    sessionStorage.getItem('token') || localStorage.getItem('token');

  // Helper to get stored user object from session or local storage
  const getStoredUser = () => {
    const stored =
      sessionStorage.getItem('user') || localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  };

  // State for token and user
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);

  // On mount or token change, initialize user if token exists but user is missing
  useEffect(() => {
    const initUser = async () => {
      if (token && !user) {
        const userId = extractUserIdFromToken(token);
        if (userId) {
          try {
            const userData = await getUserById(userId, token);
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (err) {
            console.error('Failed to fetch user on load:', err);
            logout(); // clear auth state if fetch fails
          }
        }
      }
    };
    initUser();
  }, [token, user]);

  // Login function sets token and fetches user
  const login = async (newToken) => {
    sessionStorage.setItem('token', newToken);
    localStorage.setItem('token', newToken);
    setToken(newToken);

    const userId = extractUserIdFromToken(newToken);
    if (userId) {
      try {
        const userData = await getUserById(userId, newToken);
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to fetch user during login:', err);
        logout(); // clear auth state if fetch fails
      }
    } else {
      logout(); // invalid token, clear state
    }
  };

  // Logout function clears token and user from state and storage
  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Provide auth state and functions to children components
  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context easily
export const useAuth = () => useContext(AuthContext);

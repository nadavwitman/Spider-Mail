import React, { createContext, useContext, useState, useEffect } from "react";

// Create a context to manage theme (dark/light mode)
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Initialize darkMode state from sessionStorage (persist across reloads)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = sessionStorage.getItem("darkMode");
    return savedTheme === "true";
  });

  // Side effect to apply dark mode class to body and persist in sessionStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    sessionStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Toggle between dark and light mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Provide darkMode state and toggle function to child components
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to easily access theme context
export function useTheme() {
  return useContext(ThemeContext);
}

import React, { createContext, useState, useContext } from 'react';

// Create a context for managing sidebar state
const SidebarContext = createContext();

// Provider component to wrap the app and provide sidebar state/functions
export function SidebarProvider({ children }) {
  // State to track whether the sidebar is open or closed
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Function to toggle sidebar open/closed
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Function to explicitly open the sidebar
  const openSidebar = () => setSidebarOpen(true);

  // Function to explicitly close the sidebar
  const closeSidebar = () => setSidebarOpen(false);

  // Provide state and functions to children components
  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Custom hook to access the SidebarContext easily
export function useSidebar() {
  return useContext(SidebarContext);
}

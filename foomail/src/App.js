import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import SignUp from './pages/signup';
import Login from './pages/login';
import Inbox from './pages/inbox';
import ViewMail from './pages/view_single_mail';
import { SidebarProvider } from './context/SidebarContext'; 
import { useAuth } from './context/AuthContext';

function App() {
  const { token } = useAuth(); 

  return (
    <SidebarProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/inbox" element={token ? <Inbox /> : <Navigate to="/login" />} />
          <Route path="/mail/:id" element={token ? <ViewMail /> : <Navigate to="/login" />} />
          <Route path="/label/:labelId" element={token ? <Inbox /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}

export default App;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WhiteBox from '../components/whiteBox/whiteBox';
import Logo from '../components/logo/logo';
import NavButton from '../components/navButton/navButton';
import InputField from '../components/inputField/inputField';
import { loginRequest } from '../services/authService'; 
import { useAuth } from '../context/AuthContext';      

function Login() {
  // Form state for username and password
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
  });
  const [error, setError] = useState(''); // Error message for login failures
  const navigate = useNavigate(); // Navigation hook

  const { login } = useAuth(); // Auth context login function

  // Update form state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Reset error

    try {
      // Call login API
      const data = await loginRequest(formData.userName, formData.password); 
      login(data.token); // Update auth context
      navigate('/inbox'); // Redirect to inbox
    } catch (err) {
      setError(err.message); // Display error message
    }
  };

  return (
    <WhiteBox>
      <Logo addMargin /> {/* Display logo */}
      <form onSubmit={handleLogin}>
        <InputField
          label="Enter your userName"
          name="userName"
          type="text"
          value={formData.userName}
          onChange={handleChange}
          required
        />

        <InputField
          label="Enter your password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Show error message if login fails */}
        {error && <p className="errorMessage">{error}</p>}

        <div className="homeButtons">
          <NavButton type="submit" text="Login" /> {/* Submit button */}
        </div>
      </form>
    </WhiteBox>
  );
}

export default Login;

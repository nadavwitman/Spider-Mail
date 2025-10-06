import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WhiteBox from '../components/whiteBox/whiteBox.js';
import Logo from '../components/logo/logo.js';
import NavButton from '../components/navButton/navButton.js';
import InputField from '../components/inputField/inputField.js';
import { signupUser } from '../services/signupService.js';
import { formatDate } from '../utils/dateUtils';
import { toBase64 } from '../utils/fileUtils';

function Signup() {
  // Form state for all signup inputs
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    password: '',
    confirmPassword: '',
    gender: '',
    birthdate: '',
    picture: null
  });

  const [error, setError] = useState(''); // Error message for signup
  const navigate = useNavigate(); // Navigation hook

  // Update form state when inputs change
  const handleChange = async (e) => {
    const { name, value, files } = e.target;

    if (name === 'picture') {
      // Convert uploaded picture to base64
      const file = files[0];
      const base64 = await toBase64(file); 
      setForm({ ...form, picture: base64 });    
    } else {
      setForm({ ...form, [name]: value }); // Update regular input
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error

    // Validate password match
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      // Call signup API with formatted data
      await signupUser({
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        password: form.password,
        gender: form.gender,
        birthday: formatDate(form.birthdate),
        picture: form.picture || null,
      });

      navigate('/login'); // Redirect to login after successful signup
    } catch (err) {
      setError(err.message); // Display error message if signup fails
    }
  };

  return (
    <WhiteBox>
      <Logo addMargin={false} /> {/* Display logo */}
      <h2 className="formTitle">Create your Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="formColumns">
          <div className="leftColumn">
            {/* Left column input fields */}
            <InputField 
              type="text" 
              name="firstName" 
              label="First Name" 
              onChange={handleChange} 
              required 
            />
            <InputField 
              type="text" 
              name="lastName" 
              label="Last Name" 
              onChange={handleChange} 
              required 
            />
            <InputField 
              type="text" 
              name="userName" 
              label="Username (Gmail only)" 
              onChange={handleChange} 
              required 
            />
            <InputField 
              type="password" 
              name="password" 
              label="Password" 
              onChange={handleChange} required 
            />
          </div>

          <div className="rightColumn">
            {/* Right column input fields */}
            <InputField 
              type="password" 
              name="confirmPassword" 
              label="Confirm Password"
              onChange={handleChange} 
              required 
            />
            <InputField 
              type="select" 
              name="gender" 
              label="Gender" 
              value={ form.gender }
              onChange={handleChange}
              required 
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
                { value: 'other', label: 'Other' }
              ]} 
            />
            <InputField 
              type="date" 
              name="birthdate" 
              label="Birthdate" 
              onChange={handleChange} 
              required 
            />
            <InputField 
              type="file" 
              name="picture" 
              label={form.picture ? form.picture.name : 'Picture (optional)'} 
              onChange={handleChange} 
            />
          </div>
        </div>

        {/* Show error message if signup fails */}
        {error && <p className="errorMessage">{error}</p>}

        <div className="homeButtons">
          <NavButton type="submit" text="Sign Up" /> {/* Submit button */}
        </div>
      </form>
    </WhiteBox>
  );
}

export default Signup;

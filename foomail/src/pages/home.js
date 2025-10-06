import { useNavigate } from 'react-router-dom';
import WhiteBox from '../components/whiteBox/whiteBox.js';
import Logo from '../components/logo/logo.js';
import NavButton from '../components/navButton/navButton.js';

function Home() {
  const navigate = useNavigate(); // React Router hook to programmatically navigate

  return (
    // Wrap content in a styled white box
    <WhiteBox>
      {/* Logo component, optional margin */}
      <Logo addMargin={false} /> 

      {/* Main welcome heading with colored spans */}
      <h1 className="h1style">
        Welcome to <span className="spiderBlue">SPIDER</span><span className="mailRed">MAIL</span>
      </h1>

      {/* Subtitle text */}
      <p className="pstyle">Please sign up or login to get started</p>

      {/* Navigation buttons for login and signup */}
      <div className="homeButtons">
        <NavButton text="Login" onClick={() => navigate('/login')} />
        <NavButton text="Sign Up" onClick={() => navigate('/signup')} />
      </div>
    </WhiteBox>  
  );
}

export default Home;

import { useNavigate } from 'react-router-dom';
import './navButton.css';

function NavButton({ text, type = 'button', onClick }) {
  // Render a button with customizable text, type, and click handler
  return (
    <button type={type} className="nav-button" onClick={onClick}>
      {text}
    </button>
  );
}

export default NavButton;

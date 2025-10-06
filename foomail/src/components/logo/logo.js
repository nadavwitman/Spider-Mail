// logo.js
import logoImg from '../../assets/logo.png';
import './logo.css';

function Logo({ addMargin }) {
  // Render logo image
  // If addMargin is true, apply additional CSS class for margin
  return (
    <img
      src={logoImg}
      alt="Logo"
      className={`logo ${addMargin ? 'with-margin' : ''}`}
    />
  );
}

export default Logo;

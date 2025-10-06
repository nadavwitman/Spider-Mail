// WhiteBox.js
import './whiteBox.css';

// Simple wrapper component that provides a consistent white box layout
// on top of a page background. Useful for modal dialogs, forms, etc.
function WhiteBox({ children }) {
  return (
    <div className="pageBackground"> {/* Page background overlay */}
      <div className="whiteBox"> {/* Main white container */}
        {children} {/* Render any nested content */}
      </div>
    </div>
  );
}

export default WhiteBox;

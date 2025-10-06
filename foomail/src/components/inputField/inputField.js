import React from 'react';
import './inputField.css';

function InputField({
  label,        // Label text for the field
  name,         // Input field name attribute
  type = 'text',// Type of input (text, select, file, etc.)
  value,        // Current value of the field
  onChange,     // Handler for value changes
  required = false, // Whether the field is required
  options = [], // Options for select dropdown
  accept,       // Accepted file types for file input
}) {
  return (
    <div className="formGroup">
      <div className="inputWrapper">
        {/* If field type is select, render a dropdown */}
        {type === 'select' ? (
          <>
            <select
              name={name}
              value={value}
              onChange={onChange}
              required={required}
            >
              {/* Placeholder option */}
              <option value="" disabled hidden>
                Select {label}
              </option>

              {/* Render options dynamically */}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </>
        ) : type === 'file' ? (
          /* If field type is file, render file input */
          <>
            <label>{label}</label>
            <input
              type="file"
              name={name}
              onChange={onChange}
              accept={accept}
            />
          </>
        ) : (
          /* Default input (text, email, password, etc.) */
          <>
            <input
              type={type}
              name={name}
              placeholder=" "
              value={value}
              onChange={onChange}
              required={required}
            />
            <label>{label}</label>
          </>
        )}
      </div>
    </div>
  );
}

export default InputField;

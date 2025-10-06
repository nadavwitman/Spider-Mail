// utils/fileUtils.js

// Converts a File object to a Base64 string
export const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader(); // Create a FileReader instance
    reader.readAsDataURL(file); // Read the file as Data URL (Base64)
    reader.onload = () => resolve(reader.result); // Resolve promise with Base64 string
    reader.onerror = (error) => reject(error); // Reject if an error occurs
  });

// Downloads a file from a Base64-encoded string
export function downloadBase64File(file) {
  const { name, type, data } = file; // Destructure file properties
  const byteString = atob(data.split(',')[1] || data); // Decode Base64 string
  const ab = new ArrayBuffer(byteString.length); // Create ArrayBuffer of correct length
  const ia = new Uint8Array(ab); // Create a typed array view

  // Fill typed array with decoded bytes
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([ab], { type }); // Create a Blob from the bytes
  const url = URL.createObjectURL(blob); // Create a temporary object URL

  const a = document.createElement('a'); // Create a temporary anchor element
  a.href = url; 
  a.download = name; // Set the download filename
  document.body.appendChild(a); 
  a.click(); // Trigger download
  a.remove(); // Remove anchor from DOM
  URL.revokeObjectURL(url); // Release the object URL
}

// utils/dateUtils.js

// Converts an ISO date string (YYYY-MM-DD) to DD/MM/YYYY format
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-'); // Split the ISO string into components
  return `${day}/${month}/${year}`; // Rearrange to DD/MM/YYYY
}

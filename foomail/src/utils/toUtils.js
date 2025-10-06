// Converts an array of "tags" into a comma-separated string
// Each item in the array can be either a string or an object with a userName property
// Ignores invalid items and trims strings
function toStringFromTags(to) {
  if (!Array.isArray(to)) return ''; // Return empty string if input is not an array

  return to
    .map(item => {
      if (typeof item === 'string') {
        return item.trim(); // Trim strings
      } else if (item && typeof item === 'object' && item.userName) {
        return item.userName; // Extract userName from objects
      }
      return ''; // Ignore invalid items
    })
    .filter(Boolean) // Remove empty strings
    .join(', '); // Join with comma and space
}

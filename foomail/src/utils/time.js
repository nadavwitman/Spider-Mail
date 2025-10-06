// Returns the current date-time in the format suitable for <input type="datetime-local">
// The format is "YYYY-MM-DDTHH:mm" which is required by the datetime-local input
export function getMinDatetimeLocalValue() {
  return new Date().toISOString().slice(0, 16); // Take first 16 chars of ISO string
}

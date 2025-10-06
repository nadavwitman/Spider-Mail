const net = require('net');

const HOST = 'server'; // Docker alias
const PORT = 4000;

// Core TCP send function
function sendToBlacklistServer(command, data, callback) {
  // create socket for client
  const client = new net.Socket();
  let response = '';

  // Connect to the blacklist server
  client.connect(PORT, HOST, () => {
    const payload = `${command} ${data}`;
    client.write(payload + '\n');

  });

  // When data is received from the server
  client.on('data', (chunk) => {
    response += chunk.toString();
    client.end();

  });

  // When connection is closed
  client.on('end', () => {
    callback(null, response);
  });

  // Handle connection errors
  client.on('error', (err) => {
    callback(err, null);
  });
}

// Convenience wrappers
function addToBlacklist(url, callback) {
  sendToBlacklistServer('POST', url, callback);
}

// Wrapper to remove an item from the blacklist using its ID
function removeFromBlacklist(id, callback) {
  sendToBlacklistServer('DELETE', id, callback);
}

module.exports = {
  addToBlacklist,
  removeFromBlacklist,
  sendToBlacklistServer // Required for async use in createMail
};

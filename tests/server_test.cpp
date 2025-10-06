#include <gtest/gtest.h>
#include <string>
#include <cstring>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

using namespace std;

// Creates a client socket and connects it to the given IP and port.
// Returns the socket file descriptor on success, or -1 on failure.
int createDemoClient(const string& ip, int port) {
    int sock = socket(AF_INET, SOCK_STREAM, 0); // Create a TCP socket
    if (sock < 0) return -1;

    sockaddr_in server_addr{};
    // IPv4
    server_addr.sin_family = AF_INET;             
    // Convert port to network byte order
    server_addr.sin_port = htons(port);           
    // Convert IP address to binary form
    inet_pton(AF_INET, ip.c_str(), &server_addr.sin_addr); 
    int conn = connect(sock, (struct sockaddr*)&server_addr, sizeof(server_addr));
    if (conn < 0) {
        // Close the socket on failure
        close(sock); 
        return -1;
    }
    // Return the connected socket
    return sock; 
}

// Sends a message to the server through the socket and receives the response.
// Returns the server's response as a string.
string sendAndReceive(int sock, const string& message) {
    // Send the message to the server
    send(sock, message.c_str(), message.length(), 0); 
    // Buffer to store the response
    char buffer[4096] = {0};                          
    // Receive data
    int received = recv(sock, buffer, sizeof(buffer) - 1, 0);
    // Return empty string if nothing received or error 
    if (received <= 0) return ""; 
    // Return the received response as a string
    return string(buffer, received); 
}

// Google Test unit test for server behavior with a blacklisted URL.
TEST(ServerTests, BlacklistedURLTest) {
    // Connect to local server
    int sock = createDemoClient("127.0.0.1", 8080); 
    ASSERT_GE(sock, 0) << "Socket creation or connection failed";

    // Check URL before adding it to the blacklist - should return false
    string check_before_add = sendAndReceive(sock, "GET www.example.com\n");
    EXPECT_TRUE(check_before_add == "200 Ok\n\nfalse\n");

    // Add the URL to the blacklist
    string add_URL = sendAndReceive(sock, "POST www.example.com\n");
    EXPECT_TRUE(add_URL == "201 Created\n");

    // Check again after adding - should return true true (blacklisted, definitely in Bloom Filter)
    string check_after_add = sendAndReceive(sock, "GET www.example.com\n");
    EXPECT_TRUE(check_after_add == "200 Ok\n\ntrue true\n");

    // Delete the URL from the blacklist
    string delete_URL = sendAndReceive(sock, "DELETE www.example.com\n");
    EXPECT_TRUE(delete_URL == "204 No Content\n");

    // Check after deletion - first true (Bloom filter says might exist), second false (not actually blacklisted)
    string check_after_delete = sendAndReceive(sock, "GET www.example.com\n");
    EXPECT_TRUE(check_after_delete == "200 Ok\n\ntrue false\n");

    // Try to delete the URL again - should return 404 Not Found
    string delete_URL_again = sendAndReceive(sock, "DELETE www.example.com\n");
    EXPECT_TRUE(delete_URL_again == "404 Not Found\n");

    // Send a malformed request - should return 400 Bad Request
    string bad_request = sendAndReceive(sock, "BANANA www.example.com\n");
    EXPECT_TRUE(bad_request == "400 Bad Request\n");

    // Close the socket at the end of the test
    close(sock); 
}

int main(int argc, char **argv) {
    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}

import socket
import sys  # Required to access command line arguments

class Client:
    def __init__(self, dest_ip: str, dest_port: int):
        # Store destination IP and port
        self.dest_ip = dest_ip
        self.dest_port = dest_port

    def run(self):
        # Create a TCP socket and connect to the server
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((self.dest_ip, self.dest_port))

            # Read input from the user
            msg = input()
            while True:
                # Send the message to the server with a newline (as required)
                s.send((msg + '\n').encode('utf-8'))

                # Receive and print the response from the server
                data = s.recv(4096)
                print(data.decode('utf-8'),end='')

                # Read the next message from the user
                msg = input()

# Entry point of the program
if __name__ == "__main__":
    # Expecting exactly two arguments: IP and port
    if len(sys.argv) <= 3:
        sys.exit(1)

    ip = sys.argv[1]
    port = int(sys.argv[2])

    # Create and run the client
    client = Client(ip, port)
    client.run()

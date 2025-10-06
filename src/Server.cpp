#include <vector>
#include <memory>
#include <string>
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"
#include "../src/IDataStorage.h"
#include "../src/FileStorage.h"
#include "../src/InputHandler.h"
#include <set>
#include "../src/bloom_filter.h"
#include "../src/bloom_filter_commands.h"
#include "./MongoStorage.h"
#include <iostream>
#include <sys/socket.h>
#include <stdio.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string.h>
#include <sstream>
#include <thread>
#include <mutex>
#include <map>

using namespace std;

std::mutex filter_mutex;
std::mutex data_mutex;

void handle_client(int client_sock, bloom_filter& filter, IDataStorage& storage, map<string, ICommand*>& commands) {
    char buffer[4096];
    int expected_req_length = sizeof(buffer);
    // infinite loop to serve the client
    while (true) {
        // clear buffer before recieving
        memset(buffer, 0, expected_req_length); 
        int read_bytes = recv(client_sock, buffer, expected_req_length, 0);
        // try to read request
        if (read_bytes <= 0){
            break;
        } 
        // the request message recieved from the client
        string received_req(buffer, read_bytes);
        vector<string> req = InputHandler::inputToStringVector(received_req);
        // the string that we will send to the client
        string response;

        // msg must be two strings
        if (req.size() != 2) {
            response = "400 Bad Request\n";
        } else {
            // mutexes in order to allow access to data to one client at a time, in order to prevent bugs
            lock_guard<mutex> lock1(filter_mutex);
            lock_guard<mutex> lock2(data_mutex);
            // handle response 
            response = bloom_filter_commands::command_handler(commands, req, filter, storage);
        }

        int sent_bytes = send(client_sock, response.c_str(), response.size(), 0);
        if (sent_bytes < 0) break;
    }

    close(client_sock);
}

int main(int argc, char* argv[]) {
    // check if arguments arrived (program, port, bit, hash...)
    if (argc < 4) 
        return 0;

    // collect data from args
    vector<int> input;
    for (int i = 1; i < argc; i++) {
        try {
            // try to insert integers from args
            int num = stoi(argv[i]); 
            // all args must be positive
            if (num < 0) return 0;

            input.push_back(num);
        } catch (const std::exception& e) {
            // finish program
            return 0;
        }
    }

    //port must be in range 0 - 65535
    if (input[0] > 65535) 
        return 0;
    
    // server port
    int server_port = input[0];

    //the storage path
    MongoStorage storage_concrete("mongodb://mongo:27017", "spider", "blacklist");
    IDataStorage& storage = storage_concrete;

    // bit array size
    size_t size = input[1];

    // for now only this hash will be in use
    shared_ptr<IHashFunction> hashFunc0 = make_shared<HashFunction0>(); 
    vector<shared_ptr<IHashFunction>> all_hashes = {hashFunc0};
    all_hashes.push_back(hashFunc0);

    // create bloom filter
    bloom_filter filter(size);

    // initialize hash functions, overlook index 0 (port) and 1 (bit size)
    for (int i = 2; i < input.size(); i++) {
        filter.initHashFunctions(0, i - 2, input[i], all_hashes);
    }

    // load data of black list
    filter.load(storage);

    // create socket 
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) 
        return 0;

    // initialize for bind
    struct sockaddr_in sin;
    memset(&sin, 0, sizeof(sin));
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = INADDR_ANY;
    sin.sin_port = htons(server_port);

    // bind to socket
    if (bind(sock, (struct sockaddr *) &sin, sizeof(sin)) < 0)
         return 0;
    // Allow maximux 5 clients in the waiting list
    if (listen(sock, 5) < 0) 
        return 0;

    map<string, ICommand*> commands = bloom_filter_commands::command_map(); 

    // infinite loop to serve the client
    while (true) {
        // clear buffer before receiving
        sockaddr_in client_sin;
        unsigned int addr_len = sizeof(client_sin);
        int client_sock = accept(sock, (struct sockaddr *) &client_sin, &addr_len);
        if (client_sock < 0) continue;

        thread client_thread(handle_client, client_sock, ref(filter), ref(storage), ref(commands));
        // allowes the thread to run without being dependent on the main.
        client_thread.detach(); 
    }

    return 0;
}

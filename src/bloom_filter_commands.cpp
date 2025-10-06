#include <vector>
#include <memory>
#include <string>
#include <iostream>
#include <unordered_map>
#include <functional> 
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"
#include <set>
#include <fstream>
#include "../src/bloom_filter.h"
#include "../src/bloom_filter_commands.h"
#include <regex>
#include "../src/IDataStorage.h"
#include "../src/FileStorage.h"
#include "../src/Post_url.h"
#include "../src/Get_url.h"
#include "../src/Delete_url.h"
#include "../src/ICommand.h"

using namespace std;

// private //

// public // 

// create map for commands
map<string, ICommand*> bloom_filter_commands::command_map() {
    map<string, ICommand*> commands;

    // add each command
    ICommand* post_command = new Post_url();
    commands["POST"] = post_command;

    ICommand* get_command = new Get_url();
    commands["GET"] = get_command;

    ICommand* delete_command = new Delete_url();
    commands["DELETE"] = delete_command;

    return commands;
    }

// check validity of url and operate command
string bloom_filter_commands::command_handler(map<string, ICommand*> commands, vector<string> msg,
     bloom_filter& filter, IDataStorage& storage) {
    // the output for client
    string result;

    // the command from user
    string command = msg[0];

    // the url from user
    string url = msg[1];

    // Validate URL with regex
    try {
        std::regex url_regex(R"(^((https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,})(\/\S*)?$)");
        if (!std::regex_match(url, url_regex)) {
            throw std::invalid_argument("Invalid URL");
        }
    } catch (...) {
        return result = "400 Bad Request\n";
    }

    // check which command to operate
    try {
            // check if the command exist in our program
            if (commands.count(command) == 0) {
                throw std::invalid_argument("Unknown command");
            }
            // activate command
            result = commands[command]->execute(url, filter, storage);
        }
        catch(...){
            // command is not exist in our program
            result = "400 Bad Request\n";
        }
    // return result of command
    return result;
}

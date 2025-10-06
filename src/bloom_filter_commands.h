#ifndef BLOOM_FILTER_COMMANDS_H
#define BLOOM_FILTER_COMMANDS_H
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
#include "../src/IDataStorage.h"
#include "../src/FileStorage.h"
#include "../src/ICommand.h"
#include <map>

using namespace std;

class bloom_filter_commands {

private:
    
public:
    // create map of commands POST DELETE GET
    static map<string, ICommand*> command_map(); 

    // check which command to activate and return the command result
    static string command_handler(map<string, ICommand*> commands,
         vector<string> msg, bloom_filter& filter, IDataStorage& storage);
};
#endif
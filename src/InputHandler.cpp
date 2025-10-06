#include <iostream>
#include <vector>
#include "../src/InputHandler.h"
#include <sstream>
using namespace std;

// private // 

// public //

// convert string to vector of string
vector<string> InputHandler::inputToStringVector(string input) {
    vector<string> result;
    // for seperate the string in while
    stringstream ss(input);
    string token;
    // index of vector
    int index = 0;
    while (ss >> token) {
        // insert string
        result.push_back(token);
    }
    // return the vector
    return result;
}

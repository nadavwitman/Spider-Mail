#ifndef INPUTHANDLER_H
#define INPUTHANDLER_H
#include <iostream>
#include <vector>
using namespace std;

// tried of handle input by yourself?
// this class convert input as you whish
class InputHandler {
    private:
    public:
        // order strings in vector of strings
        static vector<string> inputToStringVector(string input);
};

#endif


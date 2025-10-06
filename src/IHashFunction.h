#ifndef IHASHFUNCTION_H
#define IHASHFUNCTION_H
#include <iostream>
class IHashFunction {
    public:
        // how the hash will work
        virtual size_t operator()(const std::string& input) const = 0; 

        // getter for id
        virtual int get_id() const = 0; 
    };
#endif
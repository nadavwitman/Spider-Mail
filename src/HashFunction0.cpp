#include <iostream>
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"

// private // 

// public // 
    // the hashing
    size_t HashFunction0::operator()(const std::string& input) const {
        return std::hash<std::string>()(input);
    }

    // getter for id
    int HashFunction0::get_id() const {
        return id;
    }


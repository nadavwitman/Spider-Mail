#ifndef HASHFUNCTION0_H
#define HASHFUNCTION0_H
#include <iostream>
#include "../src/IHashFunction.h"
class HashFunction0 : public IHashFunction {
private:
    // id of the hash
    const int id = 0;

public:
    // the hashing
    size_t operator()(const std::string& input) const override;

    // getter for id
    int get_id() const override;
};
#endif
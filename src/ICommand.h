#ifndef ICOMMAND_H
#define ICOMMAND_H
#include <string>
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "./IDataStorage.h"

using namespace std;

// interface that will represent general command
class ICommand {
    public:
    // execute of the command
    virtual string execute(string url, bloom_filter& filter, IDataStorage& storage) = 0;
    };
#endif
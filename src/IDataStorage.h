#ifndef IDATASTORAGE_H
#define IDATASTORAGE_H
#include <iostream>
#include <vector>
#include <set>
using namespace std;


class IDataStorage {
    public:
        //IDataStorage() = default;
        virtual ~IDataStorage() = default;

        // save the set in storage
        virtual void save(set<string>& blacklisted_urls) = 0;

        // load storage to set
        virtual set<string> load(set<string>& blacklisted_urls) = 0;
    };
#endif
    
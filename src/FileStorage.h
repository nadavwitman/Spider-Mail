#ifndef FILESTORAGE_H
#define FILESTORAGE_H
#include <iostream>
#include <set>
#include <vector>
#include <memory>
#include <string>
#include <unordered_map>
#include <functional> 
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"
#include <fstream>
#include "../src/bloom_filter.h"
#include "../src/IDataStorage.h"


using namespace std;

class FileStorage : public IDataStorage {
private:
    // the path to storage
    string file_path; 

public:
    // constructor
    FileStorage();

    // setter to path
    void setFilePath(string& path);

    // save the set on data
    void save(set<string>&blacklisted_urls); 

    // load data to set
    set<string> load(set<string>&blacklisted_urls);
};
#endif
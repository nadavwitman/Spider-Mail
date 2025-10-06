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
#include "../src/FileStorage.h"


using namespace std;

// private //

// public //
    // constructor
    FileStorage::FileStorage() {  
        file_path ="../data/bloom_filter.dat";
    }

    // setter to path to data
    void FileStorage::setFilePath(string& path) {
        file_path = path;
    }

    // save set on data 
    void FileStorage::save(set<string>&blacklisted_urls) {

        // Open file in trunc mode to clear previous contents
       
        std::ofstream outfile(file_path, std::ios::trunc);
        // exception if it's not open
        if (!outfile.is_open()) {
            std::cerr << "Failed to open file for writing: " << file_path << std::endl;
            return;
        }

        // Write each URL in the set to a new line
        for (const auto& url : blacklisted_urls) {
            outfile << url << '\n';
        }

        outfile.close(); 
    }

    // load data to set
    set<string> FileStorage::load(set<string>&blacklisted_urls) {
        // read from data
        std::ifstream infile(file_path);

        // throw if failed to open
        if (!infile.is_open()) {
            std::cerr << "Failed to open file for reading: " << file_path << std::endl;
            return blacklisted_urls; 
        }

        // insert every line to data
        std::string url;
        while (std::getline(infile, url)) {
            if (!url.empty()) {
                blacklisted_urls.insert(url);
            }
        }
        infile.close(); // finish
        return blacklisted_urls; // return data
        
    }


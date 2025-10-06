#ifndef BLOOM_FILTER_H
#define BLOOM_FILTER_H
#include <iostream>
#include "../src/IHashFunction.h"
#include <set>
#include <vector>
#include <memory>       // for std::shared_ptr
#include "../src/IDataStorage.h"

using namespace std;
class bloom_filter {
private:
    // The size of the filter's bit array   
    size_t size;       

    // The bit array     
    vector<bool> bit_array;   

    // The vector that contains pairs of: Hash function, and the amount of times it needs to be activated.
    // This vector is initialised inside the constructor given the stage of the data file.
    vector<pair<shared_ptr<IHashFunction>, int>> hashFunctions;

    // The set that will contain the actual blacklisted URL's     
    set<string> blacklisted_urls; 

    // This function will hash the given URL thorught all of the given hash functions, 
    // concidering the times they need to be activated.
    int hashing(const string& url, const pair<shared_ptr<IHashFunction>, int>& hf);

    
public:
    // Empty Constructor
    bloom_filter(size_t size);

    // initial all hash functions
    void initHashFunctions(int id, int vecindex, int times, const vector<shared_ptr<IHashFunction>>& all_hashes);
             
    // This function will add a URL to the filter    
    void add(const string& url,IDataStorage& storage);

    // This function will return true ONLY IF the url is true-positive, by activating first_check, and only if it returns true,
    // the function will procceed to check via second_check.
    bool isBlackListed(const string& url);

    // This function will activate the private func "hashing" on the given URL, then will calcualte %size on the returned value.
    // Then, it will check if the calculated index is on in the bit array.
    bool first_check(const string& url) ;

    // This function will check if the URL which was declared true by the first check is indeed blacklisted, by going through 
    // the URL's list and directly checking if the URL is in the Blacklist.
    bool second_check(const string& url) ;

    // This function will load the bit array and actual URL's blacklist.
    void load(IDataStorage& storage);

    // setter url black list
    void setBlacklistedUrls(const set<string>& urls);

    // delete url from black list
    void deleteURL(const string& url,IDataStorage& storage);

};

#endif 
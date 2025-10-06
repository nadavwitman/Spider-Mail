#include <vector>
#include <memory>
#include <string>
#include <iostream>
#include <unordered_map>
#include <functional> 
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"
#include <set>
#include <fstream>
#include "../src/bloom_filter.h"

using namespace std;
// private functions //

    
    // This function will activate the hash method the required amount of times, based on the input given by the user.
    int bloom_filter::hashing(const std::string& url, const pair<shared_ptr<IHashFunction>, int>& hf) {
        // result of hashing
        size_t result = 0; 
        // first hash
        string input = url;
        // hashing according to the user will
        for (int i=0; i<hf.second; i++) {
            result = (*hf.first)(input);
            input = to_string(result);

        }
        // return result of the hashing
        return result;
    }

// public functions //
    // constructor
    bloom_filter::bloom_filter(size_t size) {
        bit_array = vector<bool>(size, false);
        this->size = size;
    }

    // add url to set and update bit array
    void bloom_filter::add(const string& url,IDataStorage& storage) {
        for (const auto& hf : hashFunctions) {
           
            // find index in bit array
            int turn_on_bit = hashing(url, hf) % size;
           
            // turn him on
            bit_array[turn_on_bit] = 1;
        }
        // add the url to black list
        blacklisted_urls.insert(url);
        // update set to data
        storage.save(blacklisted_urls);
    }

    // delete url from black list
    void bloom_filter::deleteURL(const string& url,IDataStorage& storage) {
        // add the url to black list
        blacklisted_urls.erase(url);
        // update set to data
        storage.save(blacklisted_urls);
    }

    // check on the bit array if it's black list
    bool bloom_filter::first_check(const string& url) {
        // check on each bit in bit array
        for (const auto& hf : hashFunctions) {
            // modulo for adjust to bit array size
            int turn_on_bit = hashing(url, hf) % size;
            // check on the specific bit
            if (!bit_array[turn_on_bit])
            {
                // not black listed
                return false;
            }
        }
        // black listed
        return true;
    }

    // check on the set if it's black list
    bool bloom_filter::second_check(const string& url){
        // If we did'nt find the URL, the iterator will be beyond the end.
        return blacklisted_urls.find(url) != blacklisted_urls.end();
    }

    // initialise all hash functions
    void bloom_filter::initHashFunctions(int id, int vecindex, int times, const vector<shared_ptr<IHashFunction>>& all_hashes) {
        // the selected hash
        std::shared_ptr<IHashFunction> selected_hash = nullptr;

        // check which hash selected
        for (const auto& hf : all_hashes) {
            if (hf->get_id() == id) {
                selected_hash = hf;
                break;
            }
        }

        // case when no hash was selected
        if (!selected_hash) {
            std::cerr << "Hash function with ID " << id << " not found." << std::endl;
            return;
        }

        // if the index in the vector that we want to insert the hash is bigger than the vector so make the vector bigger 
        if (vecindex >= hashFunctions.size()) {
            hashFunctions.resize(vecindex + 1);
        }

        // insert hash and how many times to use it
        this->hashFunctions[vecindex] = {selected_hash, times};
        
    }

    // load data to set
    void bloom_filter::load(IDataStorage& storage) {
        // create set
        set<string> temp_blacklist; 
        // load data to set
        storage.load(temp_blacklist); 
        // add each argument to black list
        for (const auto& url : temp_blacklist) {       
            add(url,storage);
        }
    }

    // check if it's black listed
    bool bloom_filter::isBlackListed(const string& url)   {
        // check on bit array
        bool firstResult = first_check(url);
        std::cout << std::boolalpha << firstResult << ' ';

        if (!firstResult) {
            std::cout << std::endl;
            return false;
        }
        // check on set
        bool secondResult = second_check(url);
        std::cout << std::boolalpha << secondResult << std::endl;
        return secondResult;
    }

    // setter for the url set
    void bloom_filter::setBlacklistedUrls(const set<string>& urls) {
        blacklisted_urls = urls;
    }
        
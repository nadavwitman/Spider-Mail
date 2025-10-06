#include <iostream>
#include "../src/bloom_filter.h"
#include <gtest/gtest.h>
#include "../src/IHashFunction.h"
#include "../src/HashFunction0.h"
#include "../src/IDataStorage.h"
#include "../src/FileStorage.h"

using namespace std;

// this test check if the data is indeed saved without using the set (that's why i empty the set in the test)
TEST(BloomFilterTest, PersistsToFile) {
    size_t size = 8;
    //string path = "../data/tests.dat"; 
    FileStorage storage;
    string path = "../data/tests.dat";
    storage.setFilePath(path);
    // For simplicity, in here we have only the default std hash, and it runs 1 time.
    std::shared_ptr<IHashFunction> hashFunc0 = std::make_shared<HashFunction0>(); 
    vector<shared_ptr<IHashFunction>> all_hashes;
    all_hashes.push_back(hashFunc0);
    bloom_filter filter(size);
    filter.initHashFunctions(0,0,1,all_hashes);
    // add utl to black list
    filter.add("http://save.com",storage);
    // create empty set to change the url set
    std::set<std::string> mySet;  
    // set it as the new set
    filter.setBlacklistedUrls(mySet);
    EXPECT_FALSE(filter.second_check("http://save.com"));
    // create new set from the data
    filter.load(storage);
    // check if it's saved
    EXPECT_TRUE(filter.second_check("http://save.com"));

}

// In this test, we will check whether the system correctly adds a new URL to the blacklist.
TEST(BloomFilterTest, AddAndCheckURL) {
    size_t size = 8;
    //string path = "../data/tests.dat";
    FileStorage storage;
    string path = "../data/tests.dat";
    storage.setFilePath(path);
    // For simplicity, in here we have only the default std hash, and it runs 1 time.
    std::shared_ptr<IHashFunction> hashFunc0 = std::make_shared<HashFunction0>(); 
    vector<shared_ptr<IHashFunction>> all_hashes;
    all_hashes.push_back(hashFunc0);
    bloom_filter filter(size);
    filter.load(storage);
    filter.initHashFunctions(0,0,1,all_hashes);
    string url1 = "www.exampleURL0.com";
    //Here we expect false answer, the bloom_filter is empty.
    EXPECT_FALSE(filter.isBlackListed(url1));
    filter.add(url1,storage);
    EXPECT_TRUE(filter.isBlackListed(url1));
}

// In this test, we deliberately hash 2 strings that will give the same result, in order to verify the correctness of 
// our checking proccess, specifcally to deal with false positive cases.
TEST(BloomFilterTest, FalsePositiveCheck) {
    size_t size = 8;
    //string path = "../data/tests.dat";
    FileStorage storage;
    string path = "../data/tests.dat";
    storage.setFilePath(path);

    {
        std::shared_ptr<IHashFunction> hashFunc0 = std::make_shared<HashFunction0>(); 
        vector<shared_ptr<IHashFunction>> all_hashes;
        all_hashes.push_back(hashFunc0);
        bloom_filter filter(size);
        filter.load(storage);
        filter.initHashFunctions(0,0,1,all_hashes);
        string Blacklisted = "www.example.com";        
        // We've deliberately chose a very similiar string
        string NotBlacklisted = "www.example0.com";
        filter.add(Blacklisted,storage);
        EXPECT_TRUE (filter.first_check(Blacklisted));
        EXPECT_TRUE (filter.second_check(Blacklisted));
        EXPECT_TRUE (filter.isBlackListed(Blacklisted));
        // Now we will check if the URL that will look like a blacklisted URL according to the hashing proccess, 
        // will be rightfully declared as not blacklisted by the second_check,
        // and therefore be declared false by the final answer given by isBlacklisted
        EXPECT_TRUE (filter.first_check(NotBlacklisted));
        EXPECT_FALSE (filter.second_check(NotBlacklisted)); 
        EXPECT_FALSE (filter.isBlackListed(NotBlacklisted));
    }
}

// this test check if the delete url function is working
TEST(BloomFilterTest, deleteURL) {
    size_t size = 8;
    //string path = "../data/tests.dat"; 
    FileStorage storage;
    string path = "../data/tests.dat";
    storage.setFilePath(path);
    // For simplicity, in here we have only the default std hash, and it runs 1 time.
    std::shared_ptr<IHashFunction> hashFunc0 = std::make_shared<HashFunction0>(); 
    vector<shared_ptr<IHashFunction>> all_hashes;
    all_hashes.push_back(hashFunc0);
    bloom_filter filter(size);
    filter.initHashFunctions(0,0,1,all_hashes);
    // add url to black list
    filter.add("http://save.com",storage);
    // check if added
    EXPECT_TRUE(filter.second_check("http://save.com"));
    // delete url
    filter.deleteURL("http://save.com",storage);
    // check if it's delete
    EXPECT_FALSE(filter.second_check("http://save.com"));

}


int main(int argc, char **argv) {
    testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
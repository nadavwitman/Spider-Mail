#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "../src/Post_url.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;

// private //

// public //

    // 201 create if it's legal url
    string Post_url::execute(string url, bloom_filter& filter, IDataStorage& storage) {
        // add url to black list
        filter.add(url, storage);
        string result = "201 Created\n";
        return result;
    }

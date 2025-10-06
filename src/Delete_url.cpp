#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "../src/Delete_url.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;

// private //

// public //

    // 204 no content if it's legal url
    // 404 not found if the url doesn't exist
    string Delete_url::execute(string url, bloom_filter& filter, IDataStorage& storage) {
        // first check and after this second check
        string result;
        if (filter.first_check(url) && filter.second_check(url)) {
            // delete url
            filter.deleteURL(url, storage);
            result = "204 No Content\n";
            return result;
        }

        // not in black list...
        result = "404 Not Found\n";
        return result;
    }

#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "../src/Get_url.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;

// private //

// public //

    // 200 ok /n /n (first and second check) if it's legal url
    string Get_url::execute(string url, bloom_filter& filter, IDataStorage& storage) {
        string result;

        // first check on bit array
        if (filter.first_check(url)) {

            // secondd check on the urls set
            if (filter.second_check(url)) {

                // both true
                result = "200 Ok\n\ntrue true\n";
                return result;
            }

            // false positive
            result = "200 Ok\n\ntrue false\n";
            return result;
        }

        // not in black list
        result = "200 Ok\n\nfalse\n";
        return result;
    }

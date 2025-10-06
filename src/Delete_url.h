#ifndef DELETE_URL_H
#define DELETE_URL_H
#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;
class Delete_url : public ICommand {
private:

public:
    // 204 no content if it's legal url
    // 404 not found if the url doesn't exist
    string execute(string url, bloom_filter& filter, IDataStorage& storage);
};
#endif
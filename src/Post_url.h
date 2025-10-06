#ifndef POST_URL_H
#define POST_URL_H
#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;
class Post_url : public ICommand {
private:

public:
    // 201 create if it's legal url
    string execute(string url, bloom_filter& filter, IDataStorage& storage);
};
#endif
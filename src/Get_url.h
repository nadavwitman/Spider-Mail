#ifndef GET_URL_H
#define GET_URL_H
#include "../src/ICommand.h"
#include "../src/bloom_filter.h"
#include "../src/FileStorage.h"
#include "./IDataStorage.h"
#include <iostream>
#include <string>

using namespace std;
class Get_url : public ICommand {
private:

public:
    // 200 ok /n /n (first and second check) if it's legal url
    string execute(string url, bloom_filter& filter, IDataStorage& storage);
};
#endif
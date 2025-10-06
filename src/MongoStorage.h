#ifndef MONGOSTORAGE_H
#define MONGOSTORAGE_H

#include "IDataStorage.h"
#include <set>
#include <string>
#include <memory>

// MongoDB C++ driver
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/database.hpp>
#include <mongocxx/collection.hpp>

/**
 * MongoStorage: IDataStorage backed by MongoDB.
 * save(): clear collection, then insert all URLs (rewrite semantics).
 * load(): read all URLs into the provided std::set<std::string>.
 */
class MongoStorage : public IDataStorage {
public:
    // If uri is empty, uses env CONNECTION_STRING or default "mongodb://mongo:27017/spider"
    MongoStorage(const std::string& uri = "",
                 const std::string& dbName = "spider",
                 const std::string& collectionName = "blacklist");

    ~MongoStorage() override = default;

    // Clear collection and insert all items from set
    void save(std::set<std::string>& blacklisted_urls) override;

    // Read all items into set and return it
    std::set<std::string> load(std::set<std::string>& blacklisted_urls) override;

private:
    // Driver lifetime object (must live before any client)
    std::unique_ptr<mongocxx::instance> _instance;
    mongocxx::client _client;
    mongocxx::database _db;
    mongocxx::collection _collection;
};

#endif // MONGOSTORAGE_H

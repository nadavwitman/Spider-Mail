#include "./MongoStorage.h"

#include <cstdlib>
#include <iostream>
#include <vector>

#include <mongocxx/uri.hpp>
#include <mongocxx/exception/exception.hpp>
#include <mongocxx/options/find.hpp>

#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/types.hpp>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::finalize;

// Helper: get environment variable or default
static std::string getenv_or(const char* key, const std::string& defval) {
    if (const char* v = std::getenv(key)) return std::string(v);
    return defval;
}

// ctor: init driver, connect client, bind DB/collection
MongoStorage::MongoStorage(const std::string& uri,
                           const std::string& dbName,
                           const std::string& collectionName)
    : _instance(std::make_unique<mongocxx::instance>()),
      _client(mongocxx::uri{
          uri.empty() ? getenv_or("CONNECTION_STRING", "mongodb://mongo:27017/spider") : uri
      }),
      _db(_client[dbName]),
      _collection(_db[collectionName]) {
    std::cout << "[MongoStorage] Connected to MongoDB\n";
}

// save: delete all, then insert all (rewrite semantics like FileStorage::save)
void MongoStorage::save(std::set<std::string>& blacklisted_urls) {
    try {
        // Remove all current documents (equivalent to file 'trunc')
        _collection.delete_many({});

        if (blacklisted_urls.empty()) return;

        // Build docs and insert many in one call (faster than insert_one in a loop)
        std::vector<bsoncxx::document::value> docs;
        docs.reserve(blacklisted_urls.size());
        for (const auto& url : blacklisted_urls) {
            document doc{};
            doc << "url" << url;
            docs.emplace_back(doc << finalize);
        }

        auto res = _collection.insert_many(docs);
        if (!res) {
            std::cerr << "[MongoStorage] insert_many returned no result\n";
        }
    } catch (const mongocxx::exception& e) {
        std::cerr << "[MongoStorage] save() mongo error: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "[MongoStorage] save() unexpected: " << e.what() << std::endl;
    }
}

// load: read all 'url' fields into the set
std::set<std::string> MongoStorage::load(std::set<std::string>& blacklisted_urls) {
    try {
        // Projection: only 'url'
        document proj;
        proj << "url" << 1 << "_id" << 0;

        mongocxx::options::find opts;
        opts.projection(proj.view());

        auto cursor = _collection.find({}, opts);
        for (auto&& doc : cursor) {
            auto el = doc["url"];
            if (el && el.type() == bsoncxx::type::k_utf8) {
                blacklisted_urls.insert(el.get_utf8().value.to_string());
            }
        }
    } catch (const mongocxx::exception& e) {
        std::cerr << "[MongoStorage] load() mongo error: " << e.what() << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "[MongoStorage] load() unexpected: " << e.what() << std::endl;
    }
    return blacklisted_urls;
}

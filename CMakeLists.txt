cmake_minimum_required(VERSION 3.16)
project(EX2 CXX)

# C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---- GoogleTest ----
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/release-1.11.0.zip
)
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# ---- MongoDB C++ driver (from source tarballs in /usr/local) ----
# We installed to /usr/local; Docker passes -DCMAKE_PREFIX_PATH=/usr/local already.
# Use CONFIG mode to load the imported targets provided by the install.
find_package(mongocxx CONFIG REQUIRED)
find_package(bsoncxx  CONFIG REQUIRED)

# Local headers (optional; the imported targets already add their includes)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)

# ---- Executables ----
add_executable(runTests
  src/bloom_filter.cpp
  tests/test.cpp
  src/HashFunction0.cpp
  src/FileStorage.cpp
  src/MongoStorage.cpp
  src/bloom_filter_commands.cpp
  src/InputHandler.cpp
  src/Delete_url.cpp
  src/Get_url.cpp
  src/Post_url.cpp
)

add_executable(serverTests
  src/bloom_filter.cpp
  tests/server_test.cpp
  src/HashFunction0.cpp
  src/FileStorage.cpp
  src/MongoStorage.cpp
  src/bloom_filter_commands.cpp
  src/InputHandler.cpp
  src/Delete_url.cpp
  src/Get_url.cpp
  src/Post_url.cpp
)

add_executable(server
  src/bloom_filter.cpp
  src/Server.cpp
  src/HashFunction0.cpp
  src/FileStorage.cpp
  src/MongoStorage.cpp
  src/bloom_filter_commands.cpp
  src/InputHandler.cpp
  src/Delete_url.cpp
  src/Get_url.cpp
  src/Post_url.cpp
)

# ---- Link libraries ----
# Use the imported targets from the source install:
#   mongo::mongocxx_shared / mongo::bsoncxx_shared
# If you built static libs, replace *_shared with *_static.
target_link_libraries(runTests
  PRIVATE mongo::mongocxx_shared mongo::bsoncxx_shared gtest_main
)
target_link_libraries(serverTests
  PRIVATE mongo::mongocxx_shared mongo::bsoncxx_shared gtest_main
)
target_link_libraries(server
  PRIVATE mongo::mongocxx_shared mongo::bsoncxx_shared
)

cmake_minimum_required(VERSION 3.16)
project(BroadbandOptimization CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Legg til kildekoden
add_executable(Broadband_opt
    Broadband_opt.cpp
    functions.cpp
)

# Homebrew include-path
include_directories(/opt/homebrew/include)

# Let etter FFTW og libsndfile biblioteker i Homebrew-path
find_library(FFTW_LIB fftw3 HINTS /opt/homebrew/lib /opt/homebrew/opt/fftw/lib REQUIRED)
find_library(SNDFILE_LIB sndfile HINTS /opt/homebrew/lib /opt/homebrew/opt/libsndfile/lib REQUIRED)

# Link bibliotekene
target_link_libraries(Broadband_opt ${FFTW_LIB} ${SNDFILE_LIB})

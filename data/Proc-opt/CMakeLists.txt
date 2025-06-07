
cmake_minimum_required(VERSION 3.16)
project(BroadbandOptimization CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(/opt/homebrew/include)

# Finn FFTW og FFTW Threads eksplisitt
find_library(FFTW_LIB fftw3 HINTS /opt/homebrew/lib /opt/homebrew/opt/fftw/lib REQUIRED)
find_library(FFTW_THREADS_LIB fftw3_threads HINTS /opt/homebrew/lib /opt/homebrew/opt/fftw/lib REQUIRED)
find_library(SNDFILE_LIB sndfile HINTS /opt/homebrew/lib /opt/homebrew/opt/libsndfile/lib REQUIRED)

add_executable(Broadband_opt
    Broadband_opt.cpp
    functions.cpp
)

target_link_libraries(Broadband_opt
    ${FFTW_LIB}
    ${FFTW_THREADS_LIB}
    ${SNDFILE_LIB}
)

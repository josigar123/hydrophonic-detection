
#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include <algorithm>
#include <tuple>
#include <future>
#include <thread>
#include <mutex>
#include <fstream>
#include <iomanip>
#include <string>
#include <filesystem>
#include <cstdlib>
#include <fftw3.h>
#include "functions.h"

std::mutex fftw_mutex; // Beskytter FFTW-planlegging

struct RGB {
    double r, g, b;
};

std::vector<RGB> generate_vivid_colors(int x) {
    std::vector<RGB> colors;
    for (int i = 0; i < x; i++) {
        double h = static_cast<double>(i) / x;
        double s = 1.0;
        double v = 1.0;
        double c = v * s;
        double h_prime = h * 6.0;
        double x_val = c * (1 - std::abs(std::fmod(h_prime, 2) - 1));
        double m = v - c;

        double r, g, b;
        if (h_prime < 1) { r = c; g = x_val; b = 0; }
        else if (h_prime < 2) { r = x_val; g = c; b = 0; }
        else if (h_prime < 3) { r = 0; g = c; b = x_val; }
        else if (h_prime < 4) { r = 0; g = x_val; b = c; }
        else if (h_prime < 5) { r = x_val; g = 0; b = c; }
        else { r = c; g = 0; b = x_val; }

        colors.push_back({r + m, g + m, b + m});
    }
    return colors;
}

struct BBResult {
    int j, i;
    double max_val;
    std::vector<double> BB_t;
    std::vector<double> BB;
    double computation_time;
};

BBResult compute_BB(int i, int j, const std::vector<double>& sx, int fs, int window_size, int hilbert_win) {
    int win_size = window_size * (i + 1);
    int hilb_win = hilbert_win * (j + 1);
    std::vector<double> sx_buff;

    auto BB_t0 = std::chrono::high_resolution_clock::now();

    // FFTW planlegging er ikke trådsikker – beskytt med mutex
    std::tuple<std::vector<double>, std::vector<double>, std::vector<double>> result;
    {
        std::lock_guard<std::mutex> lock(fftw_mutex);
        result = functions::BB_data(sx, fs, sx_buff, hilb_win, win_size);
    }

    auto [BB, BB_t, sx_buff_out] = result;

    double min_val = *std::min_element(BB.begin(), BB.end());
    for (auto& val : BB) val -= min_val;

    auto BB_t1 = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> time_span = BB_t1 - BB_t0;
    double time = time_span.count();
    double max_val = *std::max_element(BB.begin(), BB.end());

    return {j, i, max_val, BB_t, BB, time};
}

int main() {
    fftw_init_threads();
    fftw_plan_with_nthreads(std::thread::hardware_concurrency());

    std::string Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/001029.wav";  // <-- Husk å sette dette riktig!
    int fs = 10000, hilbert_win = 3, window_size = 2;
    int num_window_iterations = 20, num_hilbert_iterations = 15;
    double tot_time = 0.0;

    auto colors = generate_vivid_colors(num_window_iterations * num_hilbert_iterations);
    auto [sx, actual_fs] = functions::load_audiofile(Audio_path, fs, 5);
    std::vector<std::vector<double>> Max_SNR(num_hilbert_iterations, std::vector<double>(num_window_iterations, 0.0));
    std::vector<std::future<BBResult>> futures;

    for (int i = 0; i < num_window_iterations; i++) {
        for (int j = 0; j < num_hilbert_iterations; j++) {
            futures.push_back(std::async(std::launch::async, compute_BB, i, j, sx, fs, window_size, hilbert_win));
        }
    }

    std::vector<BBResult> results;
    for (auto& future : futures) {
        BBResult result = future.get();
        Max_SNR[result.j][result.i] = result.max_val;
        tot_time += result.computation_time;
        results.push_back(result);
    }

    int best_i = 0, best_j = 0;
    double best_snr = 0.0;
    for (int j = 0; j < num_hilbert_iterations; j++) {
        for (int i = 0; i < num_window_iterations; i++) {
            if (Max_SNR[j][i] > best_snr) {
                best_snr = Max_SNR[j][i];
                best_j = j;
                best_i = i;
            }
        }
    }

    auto Max_SNR_temp = Max_SNR;
    Max_SNR_temp[best_j][best_i] = -std::numeric_limits<double>::infinity();

    int second_i = 0, second_j = 0;
    double second_best_snr = -std::numeric_limits<double>::infinity();
    for (int j = 0; j < num_hilbert_iterations; j++) {
        for (int i = 0; i < num_window_iterations; i++) {
            if (Max_SNR_temp[j][i] > second_best_snr) {
                second_best_snr = Max_SNR_temp[j][i];
                second_j = j;
                second_i = i;
            }
        }
    }

    std::cout << "Best SNR: " << best_snr << " (window: " << (best_i+1)*window_size
              << ", hilbert: " << (best_j+1)*hilbert_win << ")" << std::endl;
    std::cout << "Second Best SNR: " << second_best_snr << " (window: " << (second_i+1)*window_size
              << ", hilbert: " << (second_j+1)*hilbert_win << ")" << std::endl;
    std::cout << "Total processing time: " << tot_time << " s" << std::endl;

    // Lagre Max_SNR til CSV
    std::ofstream csv_file("broadband_max_snr_matrix_cpp.csv");
    csv_file << "hilbert_win/window_size";
    for (int i = 0; i < num_window_iterations; i++) {
        csv_file << ",window_" << window_size * (i + 1);
    }
    csv_file << std::endl;

    for (int j = 0; j < num_hilbert_iterations; j++) {
        csv_file << "hilbert_" << hilbert_win * (j + 1);
        for (int i = 0; i < num_window_iterations; i++) {
            csv_file << "," << Max_SNR[j][i];
        }
        csv_file << std::endl;
    }
    csv_file.close();

    std::cout << "Max_SNR matrix lagret til broadband_max_snr_matrix_cpp.csv" << std::endl;


    fftw_cleanup_threads();
    return 0;
}

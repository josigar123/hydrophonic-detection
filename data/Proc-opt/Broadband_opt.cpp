#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include <algorithm>
#include <tuple>
#include <future>
#include <thread>
#include <fstream>
#include <iomanip>
#include <string>
#include <filesystem>
#include <cstdlib>

// You'll need to include libraries for audio processing and plotting
// These are placeholder includes - you'll need to replace with actual libraries
#include "functions.h" // This would be your custom C++ functions equivalent to the Python module

// Color generator function
struct RGB {
    double r, g, b;
};

std::vector<RGB> generate_vivid_colors(int x) {
    std::vector<RGB> colors;
    for (int i = 0; i < x; i++) {
        double h = static_cast<double>(i) / x;
        double s = 1.0;
        double v = 1.0;
        
        // HSV to RGB conversion
        double c = v * s;
        double h_prime = h * 6.0;
        double x_val = c * (1 - std::abs(std::fmod(h_prime, 2) - 1));
        double m = v - c;
        
        double r, g, b;
        if (h_prime < 1) {
            r = c; g = x_val; b = 0;
        } else if (h_prime < 2) {
            r = x_val; g = c; b = 0;
        } else if (h_prime < 3) {
            r = 0; g = c; b = x_val;
        } else if (h_prime < 4) {
            r = 0; g = x_val; b = c;
        } else if (h_prime < 5) {
            r = x_val; g = 0; b = c;
        } else {
            r = c; g = 0; b = x_val;
        }
        
        colors.push_back({r + m, g + m, b + m});
    }
    return colors;
}

// Compute broadband function (equivalent to compute_BB in Python)
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
    
    // This is a placeholder for the actual BB_data function
    // You'll need to implement this in your functions.h file
    auto [BB, BB_t, sx_buff_out] = functions::BB_data(sx, fs, sx_buff, hilb_win, win_size);
    
    // Find the minimum value in BB
    double min_val = *std::min_element(BB.begin(), BB.end());
    
    // Subtract minimum from all elements
    for (auto& val : BB) {
        val -= min_val;
    }
    
    auto BB_t1 = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> time_span = BB_t1 - BB_t0;
    double time = time_span.count();
    
    std::cout << "Calculation time with window_size = " << win_size 
              << " and Hilbert_win = " << hilb_win << " t = " 
              << std::fixed << std::setprecision(2) << time << "[s]" << std::endl;
    
    // Find the maximum value in BB
    double max_val = *std::max_element(BB.begin(), BB.end());
    
    return {j, i, max_val, BB_t, BB, time};
}

int main() {
    try {
        std::string Audio_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/Sound_data/001029.wav";
        
        int fs = 10000;
        int hilbert_win = 2;
        int window_size = 2;
        int num_window_iterations = 2;
        int num_hilbert_iterations = 2;
        double tot_time = 0.0;

        auto colors = generate_vivid_colors(num_window_iterations * num_hilbert_iterations);

        auto [sx, actual_fs] = functions::load_audiofile(Audio_path, fs, 5);
    
    // Create 2D array for Max_SNR
    std::vector<std::vector<double>> Max_SNR(num_hilbert_iterations, std::vector<double>(num_window_iterations, 0.0));
    
    std::vector<double> bar_window_ax(num_window_iterations);
    std::vector<double> bar_hilb_ax(num_hilbert_iterations);
    
    for (int i = 0; i < num_window_iterations; i++) {
        bar_window_ax[i] = window_size * (i + 1);
    }
    
    for (int i = 0; i < num_hilbert_iterations; i++) {
        bar_hilb_ax[i] = hilbert_win * (i + 1);
    }
    
    // In C++ we would typically use a plotting library like matplotlib-cpp or write data to file for external plotting
    // For this translation, I'm focusing on the computation part
    
    // Create a vector to store futures for parallel processing
    std::vector<std::future<BBResult>> futures;
    
    // Launch tasks in parallel
    for (int i = 0; i < num_window_iterations; i++) {
        for (int j = 0; j < num_hilbert_iterations; j++) {
            futures.push_back(std::async(std::launch::async, compute_BB, i, j, sx, fs, window_size, hilbert_win));
        }
    }
    
    // Process results as they become available
    std::vector<BBResult> results;
    for (auto& future : futures) {
        BBResult result = future.get();
        int j = result.j;
        int i = result.i;
        double snr_max = result.max_val;
        
        Max_SNR[j][i] = snr_max;
        tot_time += result.computation_time;
        
        // Store the result for later use
        results.push_back(result);
        
        // Note: In C++ we'd typically write plotting data to file or use a C++ plotting library
    }
    
    // Find the best SNR
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
    
    // Make a copy of Max_SNR to find the second best
    auto Max_SNR_temp = Max_SNR;
    Max_SNR_temp[best_j][best_i] = -std::numeric_limits<double>::infinity();
    
    // Find the second best SNR
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
    
    // Print results
    std::cout << "\n------------------------------" << std::endl;
    std::cout << "Best SNR     : " << std::fixed << std::setprecision(6) << best_snr << std::endl;
    std::cout << "window_size  : " << (best_i + 1) * window_size << std::endl;
    std::cout << "hilbert_win  : " << (best_j + 1) * hilbert_win << std::endl;
    std::cout << "------------------------------" << std::endl;
    std::cout << "Second Best SNR : " << std::fixed << std::setprecision(6) << second_best_snr << std::endl;
    std::cout << "window_size     : " << (second_i + 1) * window_size << std::endl;
    std::cout << "hilbert_win     : " << (second_j + 1) * hilbert_win << std::endl;
    std::cout << "------------------------------" << std::endl;
    std::cout << "Total processing time : " << std::fixed << std::setprecision(2) << tot_time << std::endl;
    std::cout << "------------------------------" << std::endl;
    
    // Save Max_SNR to a CSV file
    std::string csv_path = "/Users/christofferaaseth/Documents/GitHub/hydrophonic-detection/data/Proc-opt/broadband_max_snr_matrix_c.csv";
    std::ofstream csv_file(csv_path);
    
    // Write header
    csv_file << "index";
    for (int i = 0; i < num_window_iterations; i++) {
        csv_file << ",window_" << window_size * (i + 1);
    }
    csv_file << std::endl;
    
    // Write data
    for (int j = 0; j < num_hilbert_iterations; j++) {
        csv_file << "hilbert_" << hilbert_win * (j + 1);
        for (int i = 0; i < num_window_iterations; i++) {
            csv_file << "," << Max_SNR[j][i];
        }
        csv_file << std::endl;
    }
    
    csv_file.close();
    
    std::cout << "------------------------------" << std::endl;
    std::cout << "Processing complete!" << std::endl;
    std::cout << "Max_SNR dataset saved to `broadband_max_snr_matrix.csv`" << std::endl;
    std::cout << "------------------------------" << std::endl;
    
    return 0;
} catch (const std::exception& e) {
    std::cerr << "Unntak kastet: " << e.what() << std::endl;
    return 1;
} catch (...) {
    std::cerr << "Ukjent feil (muligens segmentation fault)" << std::endl;
    return 2;
}
}
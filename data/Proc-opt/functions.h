// functions.h
#ifndef FUNCTIONS_H
#define FUNCTIONS_H

#include <vector>
#include <complex>
#include <string>
#include <tuple>

namespace functions {

// Type alias for complex numbers
using Complex = std::complex<double>;

// Function declarations
std::tuple<std::vector<double>, int> load_audiofile(const std::string& input_file, int fs, double fc_low, bool remove_offset = true);

std::vector<double> moving_average_padded(const std::vector<double>& signal, int window_size = 5);

std::vector<double> moving_average_zero_padded(const std::vector<double>& signal, int window_size = 5);

std::tuple<std::vector<double>, std::vector<double>, std::vector<double>> BB_data(
    const std::vector<double>& sx, 
    int fs, 
    const std::vector<double>& sx_buff, 
    int hilbert_win, 
    int window_size
);

std::vector<double> butter_highpass_filter(const std::vector<double>& data, double cutoff, int fs, int order = 5);

std::vector<double> butter_lowpass(const std::vector<double>& sig, int fs, double cutoff = 0.9);

std::vector<double> average_filter(const std::vector<double>& signal, int window_size);

std::vector<std::vector<double>> medfilt_vertcal_norm(const std::vector<std::vector<double>>& spec, int vertical_medfilt_size);

std::tuple<std::vector<std::vector<double>>, std::vector<double>, std::vector<double>> spec_hfilt2(
    const std::vector<std::vector<double>>& spec, 
    const std::vector<double>& freq, 
    const std::vector<double>& time, 
    float window_length
);

bool NB_detect(const std::vector<std::vector<double>>& spec, double Threshold);

// Helper functions needed for implementing the above functions
std::vector<Complex> hilbert_transform(const std::vector<double>& x);
std::tuple<std::vector<double>, std::vector<double>> butter_highpass(double cutoff, int fs, int order = 5);
std::vector<double> resample_poly(const std::vector<double>& x, int up, int down);
std::vector<double> medfilt(const std::vector<double>& x, int kernel_size);

} // namespace functions

#endif // FUNCTIONS_H


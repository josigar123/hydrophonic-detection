// functions.cpp
#include "functions.h"
#include <cmath>
#include <algorithm>
#include <numeric>
#include <iostream>
#include <fstream>
#include <stdexcept>

// For FFT implementation - you might need to include additional libraries
#include <fftw3.h>

// Audio file processing library - you'll need to include a suitable library
// For example: libsndfile or AudioFile
#include <sndfile.h>

namespace functions {

// Hilbert transform implementation using FFTW
std::vector<Complex> hilbert_transform(const std::vector<double>& x) {
    int n = x.size();
    if (n == 0) {
        throw std::runtime_error("hilbert_transform: inputsignal har lengde 0");
    }

    fftw_complex* in = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * n);
    fftw_complex* out = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * n);

    if (!in || !out) {
        fftw_free(in);
        fftw_free(out);
        throw std::runtime_error("hilbert_transform: klarte ikke å allokere minne");
    }

    for (int i = 0; i < n; i++) {
        in[i][0] = x[i];
        in[i][1] = 0.0;
    }

    fftw_plan p_forward = fftw_plan_dft_1d(n, in, out, FFTW_FORWARD, FFTW_ESTIMATE);
    fftw_execute(p_forward);

    for (int i = n / 2 + 1; i < n; i++) {
        out[i][0] = 0.0;
        out[i][1] = 0.0;
    }

    for (int i = 1; i < n / 2; i++) {
        out[i][0] *= 2.0;
        out[i][1] *= 2.0;
    }

    fftw_plan p_backward = fftw_plan_dft_1d(n, out, in, FFTW_BACKWARD, FFTW_ESTIMATE);
    fftw_execute(p_backward);

    std::vector<Complex> result(n);
    for (int i = 0; i < n; i++) {
        result[i] = Complex(in[i][0] / n, in[i][1] / n);
    }

    fftw_destroy_plan(p_forward);
    fftw_destroy_plan(p_backward);
    fftw_free(in);
    fftw_free(out);

    return result;
}


std::vector<double> moving_average_padded(const std::vector<double>& signal, int window_size) {
    int pad_size = window_size / 2;
    int signal_size = signal.size();
    
    // Create padded signal
    std::vector<double> padded_signal(signal_size + 2 * pad_size);
    
    // Calculate mean of first pad_size elements for left padding
    double left_mean = 0.0;
    if (signal_size >= pad_size) {
        left_mean = std::accumulate(signal.begin(), signal.begin() + pad_size, 0.0) / pad_size;
    } else if (signal_size > 0) {
        left_mean = std::accumulate(signal.begin(), signal.end(), 0.0) / signal_size;
    }
    
    // Calculate mean of last pad_size elements for right padding
    double right_mean = 0.0;
    if (signal_size >= pad_size) {
        right_mean = std::accumulate(signal.end() - pad_size, signal.end(), 0.0) / pad_size;
    } else if (signal_size > 0) {
        right_mean = std::accumulate(signal.begin(), signal.end(), 0.0) / signal_size;
    }
    
    // Fill padded signal
    for (int i = 0; i < pad_size; i++) {
        padded_signal[i] = left_mean;
    }
    
    for (int i = 0; i < signal_size; i++) {
        padded_signal[i + pad_size] = signal[i];
    }
    
    for (int i = 0; i < pad_size; i++) {
        padded_signal[i + pad_size + signal_size] = right_mean;
    }
    
    // Perform moving average
    std::vector<double> smoothed(signal_size);
    for (int i = 0; i < signal_size; i++) {
        double sum = 0.0;
        for (int j = 0; j < window_size; j++) {
            sum += padded_signal[i + j];
        }
        smoothed[i] = sum / window_size;
    }
    
    return smoothed;
}

std::vector<double> moving_average_zero_padded(const std::vector<double>& signal, int window_size) {
    int pad_size = window_size / 2;
    int signal_size = signal.size();
    
    // Create padded signal
    std::vector<double> padded_signal(signal_size + 2 * pad_size, 0.0);
    
    // Copy original signal to the middle of padded signal
    for (int i = 0; i < signal_size; i++) {
        padded_signal[i + pad_size] = signal[i];
    }
    
    // Perform moving average
    std::vector<double> smoothed(signal_size + 2 * pad_size);
    for (int i = 0; i < signal_size + 2 * pad_size - window_size + 1; i++) {
        double sum = 0.0;
        for (int j = 0; j < window_size; j++) {
            sum += padded_signal[i + j];
        }
        smoothed[i + window_size / 2] = sum / window_size;
    }
    
    return smoothed;
}

// Implementation of resampling function using linear interpolation
// For production code, consider using a proper resampling library
std::vector<double> resample_poly(const std::vector<double>& x, int up, int down) {
    int n = x.size();
    int resampled_size = (n * up) / down;
    std::vector<double> resampled(resampled_size);
    
    for (int i = 0; i < resampled_size; i++) {
        double src_idx = i * (double)down / up;
        int src_idx_floor = (int)src_idx;
        int src_idx_ceil = std::min(src_idx_floor + 1, n - 1);
        double frac = src_idx - src_idx_floor;
        
        resampled[i] = x[src_idx_floor] * (1 - frac) + x[src_idx_ceil] * frac;
    }
    
    return resampled;
}

// Implementation of median filter
std::vector<double> medfilt(const std::vector<double>& x, int kernel_size) {
    int n = x.size();
    std::vector<double> filtered(n);
    
    for (int i = 0; i < n; i++) {
        std::vector<double> window;
        
        // Fill window with values from the signal
        for (int j = i - kernel_size/2; j <= i + kernel_size/2; j++) {
            if (j >= 0 && j < n) {
                window.push_back(x[j]);
            }
        }
        
        // Sort window and get median
        std::sort(window.begin(), window.end());
        if (window.size() % 2 == 0) {
            filtered[i] = (window[window.size()/2 - 1] + window[window.size()/2]) / 2.0;
        } else {
            filtered[i] = window[window.size()/2];
        }
    }
    
    return filtered;
}

// Butterworth highpass filter coefficients
std::tuple<std::vector<double>, std::vector<double>> butter_highpass(double cutoff, int fs, int order) {
    double nyq = 0.5 * fs;
    double normal_cutoff = cutoff / nyq;
    
    // This is a placeholder - you'll need to implement the actual filter design
    // In a real implementation, you'd use a DSP library or implement the math for analog to digital filter conversion
    
    std::vector<double> b(order + 1, 0.0);
    std::vector<double> a(order + 1, 0.0);
    
    // Simple highpass approximation for demonstration
    // (In a real implementation, you'd calculate actual Butterworth coefficients)
    a[0] = 1.0;
    b[0] = 1.0;
    b[1] = -1.0;
    
    return {b, a};
}

// Butterworth highpass filter application
std::vector<double> butter_highpass_filter(const std::vector<double>& data, double cutoff, int fs, int order) {
    auto [b, a] = butter_highpass(cutoff, fs, order);
    
    // Apply filter (simplified - in a real implementation you'd properly apply the filter with filtfilt)
    int n = data.size();
    std::vector<double> y(n, 0.0);
    
    // This is a placeholder for a proper filter implementation
    // In a real implementation, you would implement filtfilt with proper initial conditions handling
    for (int i = 1; i < n; i++) {
        y[i] = 0.9 * y[i-1] + 0.1 * (data[i] - data[i-1]);
    }
    
    return y;
}

// Butterworth lowpass filter
std::vector<double> butter_lowpass(const std::vector<double>& sig, int fs, double cutoff) {
    // Another placeholder - in a real implementation you'd calculate actual filter coefficients
    // and properly apply the filter
    
    int n = sig.size();
    std::vector<double> filtered(n, 0.0);
    
    double alpha = cutoff / (cutoff + 1.0);  // Simple RC filter approximation
    
    filtered[0] = sig[0];
    for (int i = 1; i < n; i++) {
        filtered[i] = alpha * sig[i] + (1 - alpha) * filtered[i-1];
    }
    
    return filtered;
}

// Average filter for downsampling
std::vector<double> average_filter(const std::vector<double>& signal, int window_size) {
    int num_samples = signal.size() / window_size;
    std::vector<double> downsampled(num_samples);
    
    for (int i = 0; i < num_samples; i++) {
        double sum = 0.0;
        for (int j = 0; j < window_size; j++) {
            if (i * window_size + j < signal.size()) {
                sum += signal[i * window_size + j];
            }
        }
        downsampled[i] = sum / window_size;
    }
    
    return downsampled;
}

// Median filter along vertical axis and normalize spectrogram
std::vector<std::vector<double>> medfilt_vertcal_norm(const std::vector<std::vector<double>>& spec, int vertical_medfilt_size) {
    int rows = spec.size();
    int cols = spec[0].size();
    
    // Apply median filter to each column
    std::vector<std::vector<double>> sxx_med(rows, std::vector<double>(cols, 0.0));
    
    for (int col = 0; col < cols; col++) {
        // Extract column
        std::vector<double> column(rows);
        for (int row = 0; row < rows; row++) {
            column[row] = spec[row][col];
        }
        
        // Apply median filter
        std::vector<double> filtered_col = medfilt(column, vertical_medfilt_size);
        
        // Store result
        for (int row = 0; row < rows; row++) {
            sxx_med[row][col] = filtered_col[row];
        }
    }
    
    // Find minimum positive value
    double epsilon = std::numeric_limits<double>::epsilon();
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (sxx_med[i][j] > 0 && sxx_med[i][j] < epsilon) {
                epsilon = sxx_med[i][j];
            }
        }
    }
    
    // Normalize
    std::vector<std::vector<double>> sxx_norm(rows, std::vector<double>(cols));
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            double denom = std::max(sxx_med[i][j], epsilon);
            sxx_norm[i][j] = spec[i][j] / denom;
        }
    }
    
    return sxx_norm;
}

// Apply horizontal smoothing to a spectrogram
std::tuple<std::vector<std::vector<double>>, std::vector<double>, std::vector<double>> spec_hfilt2(
    const std::vector<std::vector<double>>& spec, 
    const std::vector<double>& freq, 
    const std::vector<double>& time, 
    float window_length) {
    
    // Calculate time step
    double dt = time[1] - time[0];
    
    // Convert window length from seconds to bins
    int segment_size = std::max(1, (int)(window_length / dt));
    
    // Calculate number of segments
    int num_segments = spec[0].size() / segment_size;
    
    // Initialize output arrays
    int rows = spec.size();
    std::vector<std::vector<double>> smoothed_spec(rows, std::vector<double>(num_segments, 0.0));
    std::vector<double> new_time(num_segments, 0.0);
    
    // Process each segment
    for (int seg = 0; seg < num_segments; seg++) {
        // Process each row
        for (int row = 0; row < rows; row++) {
            double sum = 0.0;
            for (int col = 0; col < segment_size; col++) {
                int idx = seg * segment_size + col;
                if (idx < spec[0].size()) {
                    sum += spec[row][idx];
                }
            }
            smoothed_spec[row][seg] = sum / segment_size;
        }
        
        // Calculate average time for this segment
        double time_sum = 0.0;
        for (int col = 0; col < segment_size; col++) {
            int idx = seg * segment_size + col;
            if (idx < time.size()) {
                time_sum += time[idx];
            }
        }
        new_time[seg] = time_sum / segment_size;
    }
    
    return {smoothed_spec, freq, new_time};
}

// NB detection function
bool NB_detect(const std::vector<std::vector<double>>& spec, double Threshold) {
    for (const auto& row : spec) {
        for (double val : row) {
            if (val > Threshold) {
                return true;
            }
        }
    }
    return false;
}

// Implementation of BB_data function
std::tuple<std::vector<double>, std::vector<double>, std::vector<double>> BB_data(
    const std::vector<double>& sx, 
    int fs, 
    const std::vector<double>& sx_buff, 
    int hilbert_win, 
    int window_size) {
    
    // Apply Hilbert transform
    std::vector<Complex> analytic_signal = hilbert_transform(sx);
    
    // Calculate power envelope (square of absolute value)
    std::vector<double> envelope(sx.size());
    for (size_t i = 0; i < sx.size(); i++) {
        envelope[i] = std::pow(std::abs(analytic_signal[i]), 2);
    }
    
    // Apply moving average filter
    envelope = moving_average_padded(envelope, hilbert_win);
    
    // Downsample
    std::vector<double> DS_Sx = resample_poly(envelope, 1, hilbert_win);
    double DS_Fs = fs / (double)hilbert_win;
    
    // Calculate kernel size for moving average filter
    int kernel_size = int(window_size * DS_Fs);
    if (kernel_size % 2 == 0) {
        kernel_size--;  // Ensure odd size
    }
    
    // Apply moving average filter
    std::vector<double> signal_med = moving_average_zero_padded(DS_Sx, kernel_size);
    
    // Remove invalid values
    signal_med = std::vector<double>(signal_med.begin() + kernel_size/2, signal_med.end() - kernel_size/2);
    
    // Add last of previous to start
    for (size_t i = 0; i < std::min(sx_buff.size(), signal_med.size()); i++) {
        signal_med[i] += sx_buff[i];
    }
    
    // Prepare buffer for next segment
    std::vector<double> sx_buff_out;
    if (signal_med.size() >= kernel_size) {
        sx_buff_out = std::vector<double>(signal_med.end() - kernel_size, signal_med.end());
    } else {
        sx_buff_out = signal_med;  // If signal is too short
    }
    
    // Cut end of current
    if (signal_med.size() > kernel_size) {
        signal_med.resize(signal_med.size() - kernel_size);
    }
    
    // Cut first part if buffer was empty
    if (sx_buff.empty() && signal_med.size() > kernel_size/2) {
        signal_med = std::vector<double>(signal_med.begin() + kernel_size/2, signal_med.end());
    }
    
    // Convert to dB
    std::vector<double> BB_sig(signal_med.size());
    for (size_t i = 0; i < signal_med.size(); i++) {
        BB_sig[i] = 10 * std::log10(std::max(signal_med[i], 1e-10));
    }
    
    // Generate time vector
    std::vector<double> t(BB_sig.size());
    for (size_t i = 0; i < t.size(); i++) {
        t[i] = i / DS_Fs;
    }
    
    return {BB_sig, t, sx_buff_out};
}

// Load audio file implementation
std::tuple<std::vector<double>, int> load_audiofile(const std::string& input_file, int fs, double fc_low, bool remove_offset) {
    // Open the audio file using libsndfile
    SF_INFO sfinfo;
    memset(&sfinfo, 0, sizeof(sfinfo));
    
    SNDFILE* file = sf_open(input_file.c_str(), SFM_READ, &sfinfo);
    if (!file) {
        throw std::runtime_error("Could not open audio file: " + input_file);
    }
    
    // Read the audio data
    std::vector<double> buffer(sfinfo.frames * sfinfo.channels);
    sf_read_double(file, buffer.data(), buffer.size());
    sf_close(file);
    
    // Convert to mono if necessary by averaging channels
    std::vector<double> mono_data(sfinfo.frames);
    for (int i = 0; i < sfinfo.frames; i++) {
        double sum = 0.0;
        for (int ch = 0; ch < sfinfo.channels; ch++) {
            sum += buffer[i * sfinfo.channels + ch];
        }
        mono_data[i] = sum / sfinfo.channels;
    }
    
    // Resample if necessary
    if (sfinfo.samplerate != fs) {
        // In a real implementation, use a proper resampling library
        // This is a placeholder for simplicity
        mono_data = resample_poly(mono_data, fs, sfinfo.samplerate);
    }
    
    // Apply highpass filter
    mono_data = butter_highpass_filter(mono_data, fc_low, fs);
    
    // Remove DC offset if requested
    if (remove_offset) {
        double mean = std::accumulate(mono_data.begin(), mono_data.end(), 0.0) / mono_data.size();
        for (auto& sample : mono_data) {
            sample -= mean;
        }
    }
    
    return {mono_data, fs};
}

} // namespace functions
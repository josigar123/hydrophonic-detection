
#include "functions.h"
#include <cmath>
#include <algorithm>
#include <numeric>
#include <iostream>
#include <fstream>
#include <stdexcept>
#include <limits>
#include <fftw3.h>
#include <sndfile.h>

namespace functions {

using Complex = std::complex<double>;

std::vector<Complex> hilbert_transform(const std::vector<double>& x) {
    int n = x.size();
    if (n == 0) {
        throw std::runtime_error("hilbert_transform: inputsignal har lengde 0");
    }

    fftw_complex* in = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * n);
    fftw_complex* out = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * n);
    fftw_complex* out2 = (fftw_complex*)fftw_malloc(sizeof(fftw_complex) * n); // output for IFFT

    if (!in || !out || !out2) {
        if (in) fftw_free(in);
        if (out) fftw_free(out);
        if (out2) fftw_free(out2);
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

    fftw_plan p_backward = fftw_plan_dft_1d(n, out, out2, FFTW_BACKWARD, FFTW_ESTIMATE);
    fftw_execute(p_backward);

    std::vector<Complex> result(n);
    for (int i = 0; i < n; i++) {
        result[i] = Complex(out2[i][0] / n, out2[i][1] / n);
    }

    fftw_destroy_plan(p_forward);
    fftw_destroy_plan(p_backward);
    fftw_free(in);
    fftw_free(out);
    fftw_free(out2);

    return result;
}

std::vector<double> resample_poly(const std::vector<double>& x, int up, int down) {
    int n = x.size();
    int resampled_size = (n * up) / down;
    std::vector<double> resampled(resampled_size);

    for (int i = 0; i < resampled_size; i++) {
        double src_idx = i * static_cast<double>(down) / up;
        int idx0 = static_cast<int>(src_idx);
        int idx1 = std::min(idx0 + 1, n - 1);
        double frac = src_idx - idx0;
        resampled[i] = x[idx0] * (1.0 - frac) + x[idx1] * frac;
    }

    return resampled;
}

std::tuple<std::vector<double>, std::vector<double>> butter_highpass(double cutoff, int fs, int order) {
    std::vector<double> b(order + 1, 0.0);
    std::vector<double> a(order + 1, 0.0);
    a[0] = 1.0;
    b[0] = 1.0;
    b[1] = -1.0;
    return {b, a};
}

std::vector<double> butter_highpass_filter(const std::vector<double>& data, double cutoff, int fs, int order) {
    auto [b, a] = butter_highpass(cutoff, fs, order);
    int n = data.size();
    std::vector<double> y(n, 0.0);
    for (int i = 1; i < n; i++) {
        y[i] = 0.9 * y[i-1] + 0.1 * (data[i] - data[i-1]);
    }
    return y;
}

std::vector<double> moving_average_padded(const std::vector<double>& signal, int window_size) {
    int pad = window_size / 2;
    int n = signal.size();
    std::vector<double> padded(n + 2 * pad);

    double left_mean = std::accumulate(signal.begin(), signal.begin() + pad, 0.0) / pad;
    double right_mean = std::accumulate(signal.end() - pad, signal.end(), 0.0) / pad;

    std::fill(padded.begin(), padded.begin() + pad, left_mean);
    std::copy(signal.begin(), signal.end(), padded.begin() + pad);
    std::fill(padded.begin() + pad + n, padded.end(), right_mean);

    std::vector<double> result(n);
    for (int i = 0; i < n; ++i) {
        result[i] = std::accumulate(padded.begin() + i, padded.begin() + i + window_size, 0.0) / window_size;
    }

    return result;
}

std::vector<double> moving_average_zero_padded(const std::vector<double>& signal, int window_size) {
    int pad = window_size / 2;
    int n = signal.size();
    std::vector<double> padded(n + 2 * pad, 0.0);
    std::copy(signal.begin(), signal.end(), padded.begin() + pad);

    std::vector<double> result(n + 2 * pad, 0.0);
    for (int i = 0; i <= n + 2 * pad - window_size; ++i) {
        double sum = 0.0;
        for (int j = 0; j < window_size; ++j) {
            sum += padded[i + j];
        }
        result[i + window_size / 2] = sum / window_size;
    }

    return result;
}

std::tuple<std::vector<double>, std::vector<double>, std::vector<double>> BB_data(
    const std::vector<double>& sx,
    int fs,
    const std::vector<double>& sx_buff,
    int hilbert_win,
    int window_size) {

    std::vector<Complex> analytic = hilbert_transform(sx);
    std::vector<double> envelope(sx.size());
    for (size_t i = 0; i < sx.size(); i++) {
        envelope[i] = std::norm(analytic[i]);
    }

    envelope = moving_average_padded(envelope, hilbert_win);
    std::vector<double> DS_Sx = resample_poly(envelope, 1, hilbert_win);
    double DS_Fs = fs / static_cast<double>(hilbert_win);

    int kernel_size = static_cast<int>(window_size * DS_Fs);
    if (kernel_size % 2 == 0) kernel_size--;

    std::vector<double> signal_med = moving_average_zero_padded(DS_Sx, kernel_size);
    signal_med = std::vector<double>(signal_med.begin() + kernel_size / 2, signal_med.end() - kernel_size / 2);

    for (size_t i = 0; i < std::min(sx_buff.size(), signal_med.size()); i++) {
        signal_med[i] += sx_buff[i];
    }

    std::vector<double> sx_buff_out;
    if (signal_med.size() >= static_cast<size_t>(kernel_size)) {
        sx_buff_out = std::vector<double>(signal_med.end() - kernel_size, signal_med.end());
    } else {
        sx_buff_out = signal_med;
    }

    if (signal_med.size() > static_cast<size_t>(kernel_size)) {
        signal_med.resize(signal_med.size() - kernel_size);
    }

    if (sx_buff.empty() && signal_med.size() > kernel_size / 2) {
        signal_med = std::vector<double>(signal_med.begin() + kernel_size / 2, signal_med.end());
    }

    std::vector<double> BB_sig(signal_med.size());
    for (size_t i = 0; i < signal_med.size(); i++) {
        BB_sig[i] = 10 * std::log10(std::max(signal_med[i], 1e-10));
    }

    std::vector<double> t(BB_sig.size());
    for (size_t i = 0; i < t.size(); i++) {
        t[i] = i / DS_Fs;
    }

    return {BB_sig, t, sx_buff_out};
}

std::tuple<std::vector<double>, int> load_audiofile(const std::string& input_file, int fs, double fc_low, bool remove_offset) {
    SF_INFO sfinfo;
    memset(&sfinfo, 0, sizeof(sfinfo));

    SNDFILE* file = sf_open(input_file.c_str(), SFM_READ, &sfinfo);
    if (!file) {
        throw std::runtime_error("Kunne ikke åpne lydfil: " + input_file);
    }

    std::vector<double> buffer(sfinfo.frames * sfinfo.channels);
    sf_read_double(file, buffer.data(), buffer.size());
    sf_close(file);

    std::vector<double> mono(sfinfo.frames);
    for (int i = 0; i < sfinfo.frames; i++) {
        double sum = 0.0;
        for (int ch = 0; ch < sfinfo.channels; ch++) {
            sum += buffer[i * sfinfo.channels + ch];
        }
        mono[i] = sum / sfinfo.channels;
    }

    if (sfinfo.samplerate != fs) {
        mono = resample_poly(mono, fs, sfinfo.samplerate);
    }

    mono = butter_highpass_filter(mono, fc_low, fs);

    if (remove_offset) {
        double mean = std::accumulate(mono.begin(), mono.end(), 0.0) / mono.size();
        for (auto& x : mono) x -= mean;
    }

    return {mono, fs};
}

} // namespace functions

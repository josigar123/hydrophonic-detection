function[sd, td, fd] = DemonAnalysis2(audio_data, Fs, pars)

% bandpass filter

% Design the filter
[b, a] = butter(pars.DEMON.bandpass.order, [pars.DEMON.bandpass.f_low/(Fs/2), .99], 'bandpass');

% Apply the filter to your audio data (assuming it's stored in a variable called 'audio_data')
filtered_audio = filter(b, a, audio_data);

% Define the length of each window (td)
d = round(1/pars.DEMON.fsd * Fs); % You can adjust this value as needed
fsd1 = Fs/d;

% Calculate the number of windows
num_windows = floor(length(filtered_audio) / d);

% Initialize an array to store RMS values for each part
rms_values = zeros(1, num_windows);

% Perform Hilbert transform and calculate RMS for each part
clear rms_values
for i = 1:num_windows

    % Define the start and end indices of the current window
    start_idx = (i - 1) * d + 1;
    end_idx = min(i * d, length(filtered_audio));

    % Extract the current window
    window_data = filtered_audio(start_idx:end_idx);

    % Mark Trevorrows suggestion for finding the envelope:
    rms_values(i) = sqrt(mean(abs(hilbert(window_data)).^2 + abs(window_data).^2));

end

% Spectrogram
df1 = 1/(pars.spectrogram.N_d/fsd1);
[sd, fd, td] = spectrogram(rms_values, pars.spectrogram.N_d, 5*pars.spectrogram.N_d/6, pars.DEMON.minfreq: df1 :pars.DEMON.maxfreq, fsd1);

return
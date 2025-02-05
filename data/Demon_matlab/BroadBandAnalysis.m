function[BBsignal] = BroadBandAnalysis(mixseg, noise, Fs, pars)

for j = 1:length(pars.broadband.FrequencyWindow(:,1)),
    
    % Filtering

    % Design the filter
    [b, a] = butter(pars.broadband.order, pars.broadband.FrequencyWindow(j,:)/Fs, 'bandpass');

    % Apply the filter to your audio data (assuming it's stored in a variable called 'audio_data')
    filtered_audio = filter(b, a, mixseg);
    filtered_noise = filter(b, a, noise);

    % RMS
    filtered_audio(isinf(filtered_audio)) = [];
    filtered_audio(isnan(filtered_audio)) = [];
    filtered_noise(isinf(filtered_audio)) = [];
    filtered_noise(isnan(filtered_audio)) = [];
    
    BBsignal(j) = 10*log10(sum(abs(filtered_audio).^2) / sum(abs(filtered_noise).^2));

end

return
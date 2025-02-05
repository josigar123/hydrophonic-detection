function[NBSNR, NBfreq] = NarrowBandAnalysis2(mixseg, noiseseg, Fs, pars);

% Performs a narrowband analysis of the signal

S = abs(fft(mixseg)).^2; % Spectral level
S = S(1:floor(length(S)/2));
Sn = abs(fft(noiseseg)).^2; % Spectral level
Sn = Sn(1:floor(length(Sn)/2));
f = Fs*[0:length(S)/2-1]/length(S);

% Whitening
% Snorm = S./Sn;
[Snorm] = normalise5(Snorm', pars.narrowband.N, pars.narrowband.G, 4);

%% Finding maximum peak above minimum frequency

% Keeping only frequency components within the set frequency window
els = find(f > pars.narrowband.minfreq & f < pars.narrowband.maxfreq);
Snorm = Snorm(els);
f = f(els);

% Finding the N strongest
[SnormSorted, I] = sort(Snorm);
NBfreq = sort(f(I(end:-1:end+1-pars.narrowband.NumLines)));
NBSNR = 10*log10(SnormSorted(end:-1:end+1-pars.narrowband.NumLines));

return
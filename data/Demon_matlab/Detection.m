clear

%% Parameters

% General. Maybe tune this for each detection scheme?
pars.AnalysisWindowwidth = 1; % Width of analysis window in seconds
pars.NoiseWindow = [0,pars.AnalysisWindowwidth]; % Window used for background estimate measured in seconds. Opting for first 8 seconds

% Broadband
pars.broadband.FrequencyWindow = [100, 1000; 500,5000; 100,10000]; % Frequency windows used for broadband detection measured in Hz.
pars.broadband.order = 4;

% DEMON
pars.DEMON.fsd = 200; % Sampling frequency of the DEMON data
pars.DEMON.bandpass.f_low = 100; % Highpass frequency limit. I have no idea what we should use here...
pars.DEMON.bandpass.order = 4; % Filter order
pars.DEMON.N = 15;
pars.DEMON.NumLines = 5;
pars.DEMON.minfreq = 0; % Min frequency we allow frequency lines for
pars.DEMON.maxfreq = 100; % Max frequency we allow frequency lines for

% Fourier
pars.spectrogram.N = 32*1024; % For ordinary spectrogram
pars.spectrogram.N_d = 990;%2*512; % For DEMON spectrogram. Mark Trevorrow suggests fds = 0.33 Hz

% Narrow band
pars.narrowband.N = 50; % Prewhitening normalization window size parameter for CACFAR
pars.narrowband.minfreq = 50; % Min frequency we allow frequency lines for
pars.narrowband.maxfreq = 1000; % Max frequency we allow frequency lines for
pars.narrowband.NumLines = 5; % Number of lines we select (from strongest to weakest)

%% Creating audio datastore
folder = pwd;
ads = audioDatastore(folder, 'IncludeSubfolders', true, 'LabelSource','foldernames');
selfiles = 1;

%% Processing and looping over files
for fileno = selfiles,

    % Loading data
    [data, Fs] = audioread(ads.Files{fileno});
    t = [0:length(data)-1]/Fs;

    % Spektrogram parameter
    pars.LOFAR.N = Fs*4;

    % Noisewindow
    noiseels = find(t <= pars.NoiseWindow(2) & t >= pars.NoiseWindow(1));

    % Looping over analysis windows
    tic
    for k = 2:max(t)/pars.AnalysisWindowwidth,

        progress = k/(max(t)/pars.AnalysisWindowwidth)

        % Analysis window
        anels = find(t <= (pars.NoiseWindow(2) + (k-1)*pars.AnalysisWindowwidth) & t >= (pars.NoiseWindow(1) + (k-1)*pars.AnalysisWindowwidth));
        t2(k) = mean(t(anels)); % Time in center of analysis window

        %% Broadband detection
        [BBsignal(k,:)] = BroadBandAnalysis(data(anels), data(noiseels), Fs, pars);
    end

    %% Narrowband detection
    df = 1/(pars.LOFAR.N/Fs);
    [sr, fr, tr] = spectrogram(data, pars.LOFAR.N, pars.LOFAR.N/2, pars.narrowband.minfreq : df : pars.narrowband.maxfreq, Fs);
    
    % Normalizing
    NBnorm = abs(sr).^2 ./ medfilt1(abs(sr).^2,pars.narrowband.N, 1);

    % Finding the N strongest
    for k = 1:length(tr),
        [NBnormSorted, I] = sort(NBnorm(:,k));
        NBfreq(k,:) = sort(fr(I(end:-1:end+1-pars.narrowband.NumLines)));
        NBSNR(k,:) = 10*log10(NBnormSorted(end:-1:end+1-pars.narrowband.NumLines));
    end

    %% DEMON detection
    [sd, td, fd] = DemonAnalysis3(data, Fs, pars);

    % Normalizing
    DEnorm = abs(sd).^2 ./ medfilt1(abs(sd).^2,pars.DEMON.N, 1);
    DEnorm(1:2,:) = 10^-10;
    DEnorm(end+ [-1:0],:) = 10^-10;

    % Finding the N strongest
    for k = 1:length(td),
        [DEnormSorted, I] = sort(DEnorm(:,k));
        DEfreq(k,:) = sort(fd(I(end:-1:end+1-pars.DEMON.NumLines)))';
        DESNR(k,:) = 10*log10(DEnormSorted(end:-1:end+1-pars.DEMON.NumLines))';
    end

end

   

    %% Plotting
    figure(1)
    subplot(3,2,1)
    plot(t, data)
    xlabel('Time [s]')
    ylabel('Amplitude')
    grid on
    box on
    
    subplot(3,2,2)
    plot(t2, BBsignal)
    xlabel('Time [s]')
    ylabel('BBnorm')
    grid on
    box on
    for k = 1:length(pars.broadband.FrequencyWindow(:,1)),
        BBleg{k} = [int2str(pars.broadband.FrequencyWindow(k,1)), ' - ', int2str(pars.broadband.FrequencyWindow(k,2)), ' Hz'];
    end
    legend(BBleg)

    subplot(3,2,3)
    plot(tr, NBSNR, '.')
    xlabel('Time [s]')
    ylabel('NBnorm')
    grid on
    box on
    
    subplot(3,2,4)
    plot(td, DESNR, '.')
    xlabel('Time [s]')
    ylabel('DEMON norm')
    grid on
    box on

    % Spectrogram
    subplot(3,2,5)
    set(gca, 'ydir', 'normal')
    imagesc(tr, fr, 10*log10(abs(NBnorm)))
    set(gca, 'ydir', 'normal')
    xlabel('Time (s)');
    ylabel('Frequency [Hz]');
    set(gca, 'clim', [0,20])
    ylim([pars.narrowband.minfreq,pars.narrowband.maxfreq])
    colorbar
    hold on
    plot(tr, NBfreq, 'w.', 'MarkerSize',3)
    grid on
    box on
   

    subplot(3,2,6)
    set(gca, 'ydir', 'normal')
    imagesc(td, fd, 10*log10(abs(DEnorm)))
    set(gca, 'ydir', 'normal')
    xlabel('Time (s)');
    ylabel('Demon Frequency [Hz]');
    set(gca, 'clim', [0,20])
    ylim([pars.DEMON.minfreq,pars.DEMON.maxfreq])
    colorbar
    hold on
    plot(td, DEfreq, 'w.', 'MarkerSize',3)
    grid on
    box on    
    


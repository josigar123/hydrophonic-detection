const SpectrogramParameterInfoCard = () => {
  const generalParams = [
    { name: 'Select window', description: 'The window to be applied?' },
    {
      name: 'tperseg (time per segment [s])',
      description: 'Seconds per segment?',
    },
    {
      name: 'freqFilt (frequency filter [S])',
      description: 'Number of frequency bins to coalesce into one',
    },
    {
      name: 'hfilt (horizontal filter length [s])',
      description:
        'Number of time bins to coalesce into one, also decides how frequently the graph updates?',
    },
    {
      name: 'winLen (window length [min])',
      description: 'Time in minutes that the graph will make room for',
    },
    {
      name: 'maxFreq (maximum frequency [Hz])',
      description: 'Upper bound for the frequency on the vertical axis',
    },
    {
      name: 'minFreq (minimum frequency [Hz])',
      description: 'Lower bound for the frequency on the vertical axis',
    },
    {
      name: 'maxDb (maximum decibel [dB])',
      description: 'Upper bound for the intensities',
    },
    {
      name: 'minDb (minimum decibel [dB])',
      description: 'Lower bound for the intensities',
    },
  ];

  const spectrogramParams = [
    {
      name: 'NBThresh (narrowband threshold [dB])',
      description:
        'The threshold for which a narrowband detection will be triggered',
    },
  ];

  const demonParams = [
    {
      name: 'demonFs (demon sample frequency [Hz]',
      description: 'The frequency the demon spectrogram gets sampled at?',
    },
  ];

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-blue-600 p-4">
        <h2 className="text-xl font-bold text-white">Parameter Information</h2>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            General Parameters
          </h3>
          <div className="space-y-3">
            {generalParams.map((param, index) => (
              <div key={index} className="flex">
                <div className="w-1/3 font-medium text-gray-700">
                  {param.name}
                </div>
                <div className="w-2/3 text-gray-600">{param.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            Spectrogram Parameters
          </h3>
          <div className="space-y-3">
            {spectrogramParams.map((param, index) => (
              <div key={index} className="flex">
                <div className="w-1/3 font-medium text-gray-700">
                  {param.name}
                </div>
                <div className="w-2/3 text-gray-600">{param.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            DEMON Spectrogram Parameters
          </h3>
          <div className="space-y-3">
            {demonParams.map((param, index) => (
              <div key={index} className="flex">
                <div className="w-1/3 font-medium text-gray-700">
                  {param.name}
                </div>
                <div className="w-2/3 text-gray-600">{param.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectrogramParameterInfoCard;

const BroadbandParameterInfoCard = () => {
  const generalParams = [
    {
      name: 'hilbertWin (Hilbert window [S])',
      description:
        'Downsampling factor. Determines the sampling rate of the envelope signal.',
    },
    {
      name: 'winSize (window size [s])',
      description: 'Time per processed segment. Determines graph refresh rate',
    },
    {
      name: 'winLen (window length [min]',
      description: 'Minutes of data shown on screen',
    },
    {
      name: 'bufferLen (buffer length [s])',
      description: 'Time of data to use for broadband analysis',
    },
    {
      name: 'BBThresh (broadband threshold [dB])',
      description: 'Decibel threshold for triggering a broadband detection',
    },
  ];

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-blue-600" p-4>
        <h2 className="text-xl font-bold text-white">Parameter Information</h2>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3">
            Broadband parameters
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
      </div>
    </div>
  );
};

export default BroadbandParameterInfoCard;

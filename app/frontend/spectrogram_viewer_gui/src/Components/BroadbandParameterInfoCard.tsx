const BroadbandParameterInfoCard = () => {
  const generalParams = [
    {
      name: 'BBThresh (broadband threshold [dB])',
      description:
        'The threshold for which a broadband detection will be triggered',
    },
    {
      name: 'winSize (window size [s])',
      description:
        'Number of seconds of audio to be analyzed at a time, decides how quickly the graph gets updated',
    },
    {
      name: 'hilbertWin (Hilbert window [S])',
      description: 'Number of samples to apply a hilbert transformation to',
    },
    {
      name: 'bufferLen (buffer length [s])',
      description:
        'In seconds, represents an internal FILO buffer and will represent N seconds of broadband signals, to be analyzed for detection',
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

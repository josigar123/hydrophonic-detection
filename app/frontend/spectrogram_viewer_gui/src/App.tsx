import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import {
  ConfigurationContext,
  isConfigValid,
} from './Contexts/ConfigurataionContext';
import 'leaflet/dist/leaflet.css';
import { Configuration } from './Interfaces/Configuration';

const defaultConfig: Configuration = {
  spectrogramConfiguration: {
    tperseg: 0,
    frequencyFilter: 0,
    horizontalFilterLength: 0,
    window: '',
  },
  demonSpectrogramConfiguration: {
    demonSampleFrequency: 0,
    tperseg: 0,
    frequencyFilter: 0,
    horizontalFilterLength: 0,
    window: '',
  },
  narrowbandThreshold: 0,
  broadbandDetectionThreshold: 0,
};

function App() {
  const [config, setConfig] = useState<Configuration>(defaultConfig);

  return (
    <ConfigurationContext.Provider
      value={{
        config,
        setConfig,
        isConfigValid,
      }}
    >
      <div className="min-h-screen h-screen overflow-hidden bg-[#374151]">
        <MainPage />
      </div>
    </ConfigurationContext.Provider>
  );
}

export default App;

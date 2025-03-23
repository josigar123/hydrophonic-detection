import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';

import {
  defaultBroadbandConfig,
  BroadbandConfigurationContext,
} from './Contexts/BroadbandConfigurationContext';
import {
  SpectrogramConfigurationContext,
  defaultSpectrogramConfig,
} from './Contexts/SpectrogramConfigurationContext';
import 'leaflet/dist/leaflet.css';
import {
  BroadbandConfiguration,
  SpectrogramNarrowbandAndDemonConfiguration,
} from './Interfaces/Configuration';

function App() {
  const [broadbandConfiguration, setBroadbandConfig] =
    useState<BroadbandConfiguration>(defaultBroadbandConfig);

  const [spectrogramConfig, setSpectrogramConfig] =
    useState<SpectrogramNarrowbandAndDemonConfiguration>(
      defaultSpectrogramConfig
    );

  return (
    <BroadbandConfigurationContext.Provider
      value={{ broadbandConfiguration, setBroadbandConfig }}
    >
      <SpectrogramConfigurationContext.Provider
        value={{ spectrogramConfig, setSpectrogramConfig }}
      >
        <div className="min-h-screen h-screen overflow-hidden bg-[#374151]">
          <MainPage />
        </div>
      </SpectrogramConfigurationContext.Provider>
    </BroadbandConfigurationContext.Provider>
  );
}

export default App;

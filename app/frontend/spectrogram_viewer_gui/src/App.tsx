import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react'

import DataSourceContext, 
{ DataSource } from './Contexts/DataSourceContext';
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
  const [dataSource, setDataSource] = useState<DataSource>('antenna');

  return (
    <BroadbandConfigurationContext.Provider
      value={{ broadbandConfiguration, setBroadbandConfig }}
    >
      <SpectrogramConfigurationContext.Provider
        value={{ spectrogramConfig, setSpectrogramConfig }}
      >
        <DataSourceContext.Provider value={{ dataSource, setDataSource }}
        >
          <div className="min-h-screen h-screen overflow-hidden bg-[#374151]">
            <MainPage />
          </div>
        </DataSourceContext.Provider>
      </SpectrogramConfigurationContext.Provider>
    </BroadbandConfigurationContext.Provider>
  );
}

export default App;

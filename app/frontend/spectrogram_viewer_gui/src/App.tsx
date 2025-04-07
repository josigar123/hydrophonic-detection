import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';

import DataSourceContext, { DataSource } from './Contexts/DataSourceContext';
import UserPositionContext, {
  Position,
  defaultPosition,
} from './Contexts/UserPositionContext';

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
import { DetectionContext, Detection } from './Contexts/DetectionContext';
import {
  Validity,
  ValidityContext,
  defaultInputValidity,
} from './Contexts/InputValidationContext';

function App() {
  const [broadbandConfiguration, setBroadbandConfig] =
    useState<BroadbandConfiguration>(defaultBroadbandConfig);

  const [spectrogramConfig, setSpectrogramConfig] =
    useState<SpectrogramNarrowbandAndDemonConfiguration>(
      defaultSpectrogramConfig
    );

  const [detection, setDetection] = useState<Detection>({
    narrowbandDetection: false,
    broadbandDetection: false,
  });

  const [validity, setValidity] = useState<Validity>(defaultInputValidity);

  const [dataSource, setDataSource] = useState<DataSource>('antenna');
  const [position, setPosition] = useState<Position>(defaultPosition);

  return (
    <ValidityContext.Provider value={{ validity, setValidity }}>
      <DetectionContext.Provider value={{ detection, setDetection }}>
        <BroadbandConfigurationContext.Provider
          value={{ broadbandConfiguration, setBroadbandConfig }}
        >
          <SpectrogramConfigurationContext.Provider
            value={{ spectrogramConfig, setSpectrogramConfig }}
          >
            <DataSourceContext.Provider value={{ dataSource, setDataSource }}>
              <UserPositionContext.Provider value={{ position, setPosition }}>
                <div className="min-h-screen h-screen overflow-hidden bg-[#374151]">
                  <MainPage />
                </div>
              </UserPositionContext.Provider>
            </DataSourceContext.Provider>
          </SpectrogramConfigurationContext.Provider>
        </BroadbandConfigurationContext.Provider>
      </DetectionContext.Provider>
    </ValidityContext.Provider>
  );
}

export default App;

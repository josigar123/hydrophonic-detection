import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import {
  ConfigurationContext,
  Configuration,
} from './Contexts/ConfigurataionContext';
import 'leaflet/dist/leaflet.css';

function App() {
  const [config, setConfig] = useState<Configuration | null>(null);

  const setConfiguration = (newConfig: Partial<Configuration>) => {
    setConfig(
      (prev) =>
        ({
          ...prev,
          ...newConfig,
        }) as Configuration
    );
  };

  const isConfigValid =
    config !== null &&
    Object.values(config).every(
      (field) => field !== undefined && field !== null
    );

  return (
    <ConfigurationContext.Provider
      value={{
        config: config ?? ({} as Configuration),
        setConfiguration,
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

import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import { SpectrogramContext } from './Contexts/SpectrogramContext';
import placeholderImage from './assets/spectrograms/41.png';
import 'leaflet/dist/leaflet.css';

function App() {
  const [spectrogramUrl, setSpectrogramUrl] = useState(placeholderImage);
  const [wavUri, setWavUri] = useState('');

  return (
    <SpectrogramContext.Provider
      value={{ spectrogramUrl, setSpectrogramUrl, wavUri, setWavUri }}
    >
      <div className="min-h-screen h-screen overflow-hidden bg-[#374151]">
        <MainPage />
      </div>
    </SpectrogramContext.Provider>
  );
}

export default App;

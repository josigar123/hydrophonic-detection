import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import { SpectrogramContext } from './Contexts/SpectrogramContext';
import placeholderImage from './assets/spectrograms/41.png';
import 'leaflet/dist/leaflet.css';

function App() {
  const [spectrogramURI, setSpectrogramURI] = useState(placeholderImage);

  return (
    <SpectrogramContext.Provider value={{ spectrogramURI, setSpectrogramURI }}>
      <div>
        <MainPage />
      </div>
    </SpectrogramContext.Provider>
  );
}

export default App;

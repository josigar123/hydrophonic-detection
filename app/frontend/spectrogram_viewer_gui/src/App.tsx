import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import { SpectrogramContext } from './Contexts/SpectrogramContext';
import placeholderImage from '/assets/spectrograms/41.png';

function App() {
  const [spectrogramUrl, setSpectrogramUrl] = useState(placeholderImage);
  const [wavUri, setWavUri] = useState('');

  return (
    <SpectrogramContext.Provider
      value={{ spectrogramUrl, setSpectrogramUrl, wavUri, setWavUri }}
    >
      <div>
        <MainPage />
      </div>
    </SpectrogramContext.Provider>
  );
}

export default App;

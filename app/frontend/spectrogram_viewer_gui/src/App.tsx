import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import { SpectrogramContext } from './Contexts/SpectrogramContext';
import placeholderImage from '/assets/placeholders/977232.png';

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

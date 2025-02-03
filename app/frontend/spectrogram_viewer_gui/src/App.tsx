import './App.css';
import MainPage from './Pages/MainPage';
import { useState } from 'react';
import { SpectrogramContext } from './Contexts/SpectrogramContext';

function App() {
  const [spectrogramURI, setSpectrogramURI] = useState('');

  return (
    <SpectrogramContext.Provider value={{ spectrogramURI, setSpectrogramURI }}>
      <div>
        <MainPage />
      </div>
    </SpectrogramContext.Provider>
  );
}

export default App;

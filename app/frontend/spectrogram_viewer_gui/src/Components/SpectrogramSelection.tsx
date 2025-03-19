import ScrollingDemonSpectrogram from './ScrollingDemonSpectrogram';
import ScrollingSpectrogram from './ScrollingSpectrogram';
import recordingConfig from '../../../../configs/recording_parameters.json';
import { useEffect, useId, useRef, useCallback } from 'react';
import { Button } from '@heroui/button';
import { Tabs, Tab } from '@heroui/tabs';
import SpectrogramParameterField from './SpectrogramParameterField';
import DemonSpectrogramParameterField from './DemonParameterField';

const websocketUrl = 'ws://localhost:8766?client_name=spectrogram_client';
const sampleRate = recordingConfig['sampleRate'];

const SpectrogramSelection = () => {
  return (
    <div>
      <Tabs
        key="bordered"
        aria-label="Graph choice"
        size="sm"
        radius="sm"
        className="h-full"
      >
        <Tab key="spectrogram" title="Spectrogram">
          <div className="h-full flex flex-col bg-slate-400 rounded-lg p-4">
            <div className="flex-1 min-h-0 overflow-auto flex justify-center items-center mb-4">
              <ScrollingSpectrogram />
            </div>
            <div className="flex-none">
              <SpectrogramParameterField />
            </div>
          </div>
        </Tab>
        <Tab key="DEMON" title="DEMON">
          <div className="h-full flex flex-col bg-slate-400 rounded-lg p-4">
            <div className="flex-1 min-h-0 overflow-auto flex justify-center items-center mb-4">
              <ScrollingDemonSpectrogram
                demonData={[1, 2, 3]}
                sampleRate={sampleRate}
                tperseg={2}
                xAxisViewInMinutes={20}
                heatmapMinTimeStepMs={500}
              />
            </div>
            <div className="flex-none">
              <DemonSpectrogramParameterField />
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SpectrogramSelection;

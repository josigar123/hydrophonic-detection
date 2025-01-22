import Spectrogram from '../components/Spectrogram';
import spectrogramImage from '../../spectrogram_jpeg_test_dir/Spectrogram-19thC.png';

const MainPage = () => {
  return (
    <div>
      <Spectrogram src={spectrogramImage} />
    </div>
  );
};

export default MainPage;

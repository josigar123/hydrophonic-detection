const Spectrogram = ({ src }: { src: string }) => {
  return (
    <img
      src={src}
      alt="Spectrogram"
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Spectrogram;

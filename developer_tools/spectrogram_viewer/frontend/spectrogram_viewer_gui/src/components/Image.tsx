interface ImageProps {
  src: string;
  alt: string;
}

const Image = (imageProps: ImageProps) => {
  return (
    <img
      src={imageProps.src}
      alt={imageProps.alt}
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default Image;

interface PlotProps {
  src: string;
  alt: string;
  className: string;
  associated_wav: string; // Will contain the URI to a wav blob in the cloud
}

const PlotImg = ({ src, alt, className, associated_wav }: PlotProps) => {
  return (
    <>
      <img src={src} alt={alt} className={className} />
    </>
  );
};

export default PlotImg;

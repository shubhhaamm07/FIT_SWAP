const ImageGallery = ({ images }) => {
  return (
    <div className="space-y-4">
      <img
        src={images[0]}
        alt="Gym"
        className="h-[450px] w-full rounded-3xl object-cover"
      />

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt=""
            className="h-24 w-full cursor-pointer rounded-xl object-cover border border-white/10 hover:border-violet-500"
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;

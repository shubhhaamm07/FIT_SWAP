const ImageGallery = ({ images = [] }) => {
  const availableImages = images.filter(Boolean);

  if (availableImages.length === 0) return null;

  return (
    <div className="space-y-4">
      <img
        src={availableImages[0]}
        alt="Gym"
        className="h-64 w-full rounded-2xl object-cover sm:h-80 sm:rounded-3xl lg:h-[450px]"
        loading="eager"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {availableImages.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Gym view ${index + 1}`}
            loading="lazy"
            className="h-20 w-full cursor-pointer rounded-xl border border-white/10 object-cover transition hover:border-violet-500 sm:h-24"
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;

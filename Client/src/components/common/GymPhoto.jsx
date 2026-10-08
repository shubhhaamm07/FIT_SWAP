import fallbackImage from "../../assets/images/member-dashboard-gym.png";

function GymPhoto({ src, alt = "", onError, ...props }) {
  const handleError = (event) => {
    const fallbackUrl = new URL(fallbackImage, document.baseURI).href;
    if (event.currentTarget.src !== fallbackUrl) {
      event.currentTarget.src = fallbackUrl;
    }
    onError?.(event);
  };

  return <img src={src || fallbackImage} alt={alt} onError={handleError} {...props} />;
}

export default GymPhoto;

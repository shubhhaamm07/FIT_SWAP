import fallbackImage from "../../assets/images/optimized/member-dashboard-gym.webp";

function GymPhoto({ src, alt = "", onError, loading = "lazy", sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", ...props }) {
  const imageSource = src || fallbackImage;
  const variant = (width) => {
    const url = new URL(imageSource);
    url.searchParams.set("w", width);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("q", "80");
    return url.href;
  };
  const responsive = /^https:\/\/images\.unsplash\.com\//.test(imageSource);
  const handleError = (event) => {
    const fallbackUrl = new URL(fallbackImage, document.baseURI).href;
    if (event.currentTarget.src !== fallbackUrl) {
      event.currentTarget.removeAttribute("srcset");
      event.currentTarget.src = fallbackUrl;
    }
    onError?.(event);
  };

  return <img src={responsive ? variant(960) : imageSource} srcSet={responsive ? [320, 640, 960, 1280].map((width) => `${variant(width)} ${width}w`).join(", ") : undefined} sizes={sizes} width="960" height="540" loading={loading} decoding="async" alt={alt} onError={handleError} {...props} />;
}

export default GymPhoto;

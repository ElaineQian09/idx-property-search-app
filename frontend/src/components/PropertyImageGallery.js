import { useEffect, useState } from "react";
import { FALLBACK_IMAGE, getPhotoUrls } from "../utils/propertyPhotos";

function PropertyImageGallery({ photos, alt }) {
  const photoUrls = getPhotoUrls(photos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedIndexes, setFailedIndexes] = useState([]);

  useEffect(() => {
    setActiveIndex(0);
    setIsLightboxOpen(false);
    setFailedIndexes([]);
  }, [photos]);

  const visibleIndexes = photoUrls
    .map((_, index) => index)
    .filter((index) => !failedIndexes.includes(index));
  const activePool = visibleIndexes.length > 0 ? visibleIndexes : [0];
  const normalizedActiveIndex = activePool.includes(activeIndex)
    ? activeIndex
    : activePool[0];
  const activePhoto = photoUrls[normalizedActiveIndex] || FALLBACK_IMAGE;
  const currentPoolPosition = activePool.indexOf(normalizedActiveIndex);

  function openLightbox() {
    setIsLightboxOpen(true);
  }

  function closeLightbox() {
    setIsLightboxOpen(false);
  }

  function showPrevious() {
    const previousPosition =
      currentPoolPosition === 0 ? activePool.length - 1 : currentPoolPosition - 1;
    setActiveIndex(activePool[previousPosition]);
  }

  function showNext() {
    const nextPosition =
      currentPoolPosition === activePool.length - 1 ? 0 : currentPoolPosition + 1;
    setActiveIndex(activePool[nextPosition]);
  }

  function handleImageError() {
    if (photoUrls.length <= 1) {
      return;
    }

    setFailedIndexes((currentFailedIndexes) => {
      if (currentFailedIndexes.includes(normalizedActiveIndex)) {
        return currentFailedIndexes;
      }

      return [...currentFailedIndexes, normalizedActiveIndex];
    });
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (activePool.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePool, currentPoolPosition, isLightboxOpen]);

  return (
    <>
      <div className="detail-gallery">
        <button
          type="button"
          className="detail-gallery__main-button"
          onClick={openLightbox}
          aria-label="Open property image lightbox"
        >
          <img
            className="detail-gallery__main-image"
            src={activePhoto}
            alt={alt}
            onError={handleImageError}
          />
        </button>

        {visibleIndexes.length > 1 ? (
          <div className="detail-gallery__thumb-strip" aria-label="Property image thumbnails">
            {visibleIndexes.map((index) => (
              <button
                key={`${photoUrls[index]}-${index}`}
                type="button"
                className={`detail-gallery__thumb${
                  index === normalizedActiveIndex ? " detail-gallery__thumb--active" : ""
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show property image ${index + 1}`}
                aria-pressed={index === normalizedActiveIndex}
              >
                <img
                  className="detail-gallery__thumb-image"
                  src={photoUrls[index]}
                  alt={`${alt} thumbnail ${index + 1}`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLightboxOpen ? (
        <div
          className="detail-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Property image lightbox"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="detail-lightbox__close"
            onClick={closeLightbox}
            aria-label="Close property image lightbox"
          >
            ×
          </button>
          <div
            className="detail-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            {activePool.length > 1 ? (
              <>
                <button
                  type="button"
                  className="detail-lightbox__nav detail-lightbox__nav--prev"
                  onClick={showPrevious}
                  aria-label="Show previous lightbox image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="detail-lightbox__nav detail-lightbox__nav--next"
                  onClick={showNext}
                  aria-label="Show next lightbox image"
                >
                  ›
                </button>
              </>
            ) : null}
            <img className="detail-lightbox__image" src={activePhoto} alt={alt} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default PropertyImageGallery;

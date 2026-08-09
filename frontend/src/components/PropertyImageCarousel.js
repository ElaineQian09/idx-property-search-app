import { useEffect, useState } from "react";
import { FALLBACK_IMAGE, getPhotoUrls } from "../utils/propertyPhotos";

function PropertyImageCarousel({ photos, alt }) {
  const photoUrls = getPhotoUrls(photos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState([]);
  const hasMultiplePhotos = photoUrls.length > 1;

  useEffect(() => {
    setActiveIndex(0);
    setFailedIndexes([]);
  }, [photos]);

  const availableIndexes = photoUrls
    .map((_, index) => index)
    .filter((index) => !failedIndexes.includes(index));
  const activePool = availableIndexes.length > 0 ? availableIndexes : [0];
  const normalizedActiveIndex = activePool.includes(activeIndex)
    ? activeIndex
    : activePool[0];
  const currentPoolPosition = activePool.indexOf(normalizedActiveIndex);
  const currentPhotoUrl =
    photoUrls[normalizedActiveIndex] || FALLBACK_IMAGE;

  function showPrevious(event) {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(() => {
      const previousPosition =
        currentPoolPosition === 0 ? activePool.length - 1 : currentPoolPosition - 1;
      return activePool[previousPosition];
    });
  }

  function showNext(event) {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(() => {
      const nextPosition =
        currentPoolPosition === activePool.length - 1 ? 0 : currentPoolPosition + 1;
      return activePool[nextPosition];
    });
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

  return (
    <div className="property-card__image-wrapper">
      <img
        className="property-card__image"
        src={currentPhotoUrl}
        alt={alt}
        onError={handleImageError}
      />

      {hasMultiplePhotos ? (
        <>
          <button
            type="button"
            className="property-card__carousel-button property-card__carousel-button--prev"
            onClick={showPrevious}
            aria-label="Show previous property photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="property-card__carousel-button property-card__carousel-button--next"
            onClick={showNext}
            aria-label="Show next property photo"
          >
            ›
          </button>
          <p className="property-card__carousel-counter" aria-live="polite">
            {normalizedActiveIndex + 1} / {photoUrls.length}
          </p>
        </>
      ) : null}
    </div>
  );
}

export default PropertyImageCarousel;

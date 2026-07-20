const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";

function normalizePhotoEntry(photo) {
  if (typeof photo === "string") {
    return photo.trim() || null;
  }

  if (!photo || typeof photo !== "object") {
    return null;
  }

  const candidateKeys = ["url", "href", "Uri", "uri", "MediaURL", "mediaUrl"];

  for (const key of candidateKeys) {
    if (typeof photo[key] === "string" && photo[key].trim()) {
      return photo[key].trim();
    }
  }

  return null;
}

export function getPrimaryPhotoUrl(photosValue) {
  if (!photosValue) {
    return FALLBACK_IMAGE;
  }

  let parsedPhotos = photosValue;

  if (typeof photosValue === "string") {
    try {
      parsedPhotos = JSON.parse(photosValue);
    } catch (error) {
      return FALLBACK_IMAGE;
    }
  }

  if (!Array.isArray(parsedPhotos) || parsedPhotos.length === 0) {
    return FALLBACK_IMAGE;
  }

  for (const photo of parsedPhotos) {
    const url = normalizePhotoEntry(photo);

    if (url) {
      return url;
    }
  }

  return FALLBACK_IMAGE;
}

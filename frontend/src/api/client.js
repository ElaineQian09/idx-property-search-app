const DEFAULT_ERROR_MESSAGE =
  "Unable to load properties right now. Please try again.";

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function request(path) {
  let response;

  try {
    response = await fetch(path);
  } catch (error) {
    throw new Error(
      "Cannot reach the backend. Make sure the Express server is running on port 5050."
    );
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : DEFAULT_ERROR_MESSAGE;

    throw new Error(message);
  }

  return payload;
}

export function fetchProperties(params = {}) {
  return request(`/api/properties${buildQueryString(params)}`);
}

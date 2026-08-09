import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPropertyById, fetchPropertyOpenHouses } from "../api/client";
import PropertyImageGallery from "./PropertyImageGallery";
import PropertyMap from "./PropertyMap";

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(numericPrice);
}

function formatAddress(property) {
  const parts = [
    property?.L_Address || property?.address,
    [property?.L_City || property?.city, property?.L_State || property?.state]
      .filter(Boolean)
      .join(", "),
    property?.L_Zip || property?.zipcode
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Address unavailable";
}

function formatMetaLabel(label, value) {
  if (value === undefined || value === null || value === "") {
    return `${label}: N/A`;
  }

  return `${label}: ${value}`;
}

function getValue(property, keys) {
  for (const key of keys) {
    const value = property?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function formatStat(value, suffix) {
  if (value === undefined || value === null || value === "") {
    return `N/A ${suffix}`;
  }

  return `${value} ${suffix}`;
}

function formatNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
  }).format(numericValue);
}

function formatSquareFeet(value) {
  const formatted = formatNumber(value);
  return formatted ? `${formatted} sqft` : "N/A sqft";
}

function formatYearBuilt(value) {
  return value ? `Built ${value}` : "Built year unavailable";
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  if (typeof value === "string") {
    const matchedDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (matchedDate) {
      const [, year, month, day] = matchedDate;
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTime(value) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = String(value).split(":");
  const numericHours = Number(hours);
  const numericMinutes = Number(minutes);

  if (!Number.isInteger(numericHours) || !Number.isInteger(numericMinutes)) {
    return String(value);
  }

  const date = new Date();
  date.setHours(numericHours, numericMinutes, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatOpenHouseTimeRange(openHouse) {
  const startTime = formatTime(openHouse?.startTime);
  const endTime = formatTime(openHouse?.endTime);

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (startTime) {
    return startTime;
  }

  if (endTime) {
    return endTime;
  }

  return "Time unavailable";
}

function parseJsonObject(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function getOpenHouseRemarks(openHouse) {
  const parsedData = parseJsonObject(openHouse?.allData);

  return (
    getValue(parsedData, [
      "OH_Remarks",
      "OpenHouseRemarks",
      "PublicRemarks",
      "Remarks",
      "remarks"
    ]) || null
  );
}

function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProperty() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [propertyData, openHouseData] = await Promise.all([
          fetchPropertyById(id),
          fetchPropertyOpenHouses(id)
        ]);

        if (!ignore) {
          setProperty(propertyData);
          setOpenHouses(Array.isArray(openHouseData) ? openHouseData : []);
        }
      } catch (error) {
        if (!ignore) {
          setProperty(null);
          setOpenHouses([]);
          setErrorMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      ignore = true;
    };
  }, [id]);

  const description =
    getValue(property, [
      "LR_remarks22",
      "L_Remarks",
      "PublicRemarks",
      "description"
    ]) || "No description available for this property.";
  const stats = [
    formatStat(getValue(property, ["L_Keyword2", "beds"]), "bd"),
    formatStat(getValue(property, ["LM_Dec_3", "baths"]), "ba"),
    formatSquareFeet(
      getValue(property, ["L_ApproximateSqFt", "L_SquareFootage", "sqft"])
    ),
    formatYearBuilt(getValue(property, ["L_YearBuilt", "yearBuilt"]))
  ];
  const propertyDetails = [
    ["Listing ID", getValue(property, ["L_ListingID", "listingId"])],
    ["Display ID", getValue(property, ["L_DisplayId", "displayId"])],
    ["Status", getValue(property, ["L_Status", "status"])],
    ["Property Type", getValue(property, ["L_Type_", "L_Type", "propertyType"])],
    ["Class", getValue(property, ["L_Class", "propertyClass"])],
    ["Area", getValue(property, ["L_Area", "area"])],
    [
      "Garage",
      (() => {
        const garageValue = getValue(property, ["L_GarageCapacity", "garageSpaces"]);
        const formatted = formatNumber(garageValue);
        return formatted ? `${formatted} cars` : null;
      })()
    ],
    [
      "Lot Size",
      (() => {
        const lotSize = getValue(property, [
          "L_LotSizeArea",
          "L_Acres",
          "lotSize"
        ]);
        const formatted = formatNumber(lotSize);
        return formatted ? `${formatted} acres` : null;
      })()
    ]
  ];

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="hero__eyebrow">IDX Exchange</p>
        <h1>Property Details</h1>
        <p className="hero__description">
          Review the selected listing and return to the directory when you are ready.
        </p>
      </section>

      <section className="detail-panel">
        <Link className="detail-panel__back-link" to="/">
          Back to listings
        </Link>

        {isLoading ? <div className="status-card">Loading property details...</div> : null}

        {!isLoading && errorMessage ? (
          <div className="status-card status-card--error">{errorMessage}</div>
        ) : null}

        {!isLoading && !errorMessage && property ? (
          <div className="detail-layout">
            <article className="detail-card">
              <PropertyImageGallery
                photos={property?.L_Photos || property?.photos}
                alt={formatAddress(property)}
              />

              <div className="detail-card__content">
                <p className="detail-card__price">
                  {formatPrice(property.L_SystemPrice || property.price)}
                </p>
                <h2 className="detail-card__address">{formatAddress(property)}</h2>

                <div className="detail-card__stats">
                  {stats.map((stat) => (
                    <p key={stat} className="detail-card__stat">
                      {stat}
                    </p>
                  ))}
                </div>

                <section className="detail-section">
                  <h3>Description</h3>
                  <p className="detail-section__body">{description}</p>
                </section>
              </div>
            </article>

            <section className="detail-section detail-section--grid">
              <h3>Property Details</h3>
              <div className="detail-facts">
                {propertyDetails.map(([label, value]) => (
                  <p key={label} className="detail-facts__item">
                    {formatMetaLabel(label, value)}
                  </p>
                ))}
              </div>
            </section>

            <section className="detail-section detail-section--grid">
              <h3>Open Houses</h3>

              {openHouses.length > 0 ? (
                <div className="open-house-list">
                  {openHouses.map((openHouse) => (
                    <article
                      key={openHouse.id || `${openHouse.openHouseDate}-${openHouse.startTime}`}
                      className="open-house-card"
                    >
                      <p className="open-house-card__date">
                        {formatDate(openHouse.openHouseDate || openHouse.startDate)}
                      </p>
                      <p className="open-house-card__time">
                        {formatOpenHouseTimeRange(openHouse)}
                      </p>
                      {getOpenHouseRemarks(openHouse) ? (
                        <p className="open-house-card__remarks">
                          {getOpenHouseRemarks(openHouse)}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="detail-section__body">No open houses scheduled.</p>
              )}
            </section>

            <PropertyMap property={property} />
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default PropertyDetailPage;

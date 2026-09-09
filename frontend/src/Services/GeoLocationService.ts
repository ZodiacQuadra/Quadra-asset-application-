import * as teams from "@microsoft/teams-js";

/**
 * GeoLocationService.ts
 *
 * Abstracts device location acquisition:
 * - Priority 1: Microsoft Teams JS SDK (native GPS on mobile Teams)
 * - Priority 2: Browser navigator.geolocation (desktop fallback)
 *
 * Returns a standardised { lat, lng, accuracy } object.
 */

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

/**
 * Get the user's current location.
 * Tries Teams SDK first, falls back to browser geolocation.
 * Throws a descriptive error if both fail (e.g. permission denied).
 */
export const getLocation = async (): Promise<GeoPosition> => {
  // console.log("[GeoLocation] Attempting to acquire location...");

  // ── Strategy 1: Teams JS SDK ────────────────────────────────────────────
  try {
    await teams.app.initialize();
    
    // Using a more direct check for location capability
    if (teams.location && teams.location.isSupported()) {
      // console.log("[GeoLocation] Strategy 1: Teams SDK is supported. Requesting location...");
      
      const loc = await new Promise<teams.location.Location>((resolve, reject) => {
        // Set a timeout for Teams SDK specifically
        const teamsTimeout = setTimeout(() => reject(new Error("Teams location request timed out")), 8000);
        
        teams.location.getLocation(
          { allowChooseLocation: false, showMap: false },
          (err, location) => {
            clearTimeout(teamsTimeout);
            if (err) {
              console.warn("[GeoLocation] Teams SDK getLocation failed:", err);
              reject(err);
            } else {
              resolve(location);
            }
          }
        );
      });

      // console.log("[GeoLocation] Strategy 1: Success.",loc);
      return {
        lat:      loc.latitude,
        lng:      loc.longitude,
        accuracy: loc.accuracy ?? 0,
      };
    } else {
      console.log("[GeoLocation] Strategy 1: Teams location capability not supported in this context.");
    }
  } catch (err) {
    console.warn("[GeoLocation] Strategy 1: Teams SDK error or context missing:", err);
  }

  // ── Strategy 2: Browser Geolocation API ─────────────────────────────────
  // console.log("[GeoLocation] Strategy 2: Falling back to Browser Geolocation API...");
  return new Promise<GeoPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // console.log("[GeoLocation] Strategy 2: Success.",position);
        resolve({
          lat:      position.coords.latitude,
          lng:      position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error("[GeoLocation] Strategy 2: Browser Geolocation Error:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission was denied. Please allow location access in your browser/Teams settings."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Your location could not be determined by the browser. Please ensure your device's location services are ON."));
            break;
          case error.TIMEOUT:
            reject(new Error("Location request timed out. Please try again."));
            break;
          default:
            reject(new Error("An unknown error occurred while retrieving your location."));
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            15000, // 15 seconds
        maximumAge:         0,     // always fresh
      }
    );
  });
};

/**
 * Format a GeoPosition as a "lat,lng" string for sending to the backend.
 */
export const formatCoordinates = (pos: GeoPosition): string =>
  `${pos.lat},${pos.lng}`;

/**
 * Reverse geocode lat/lng to a human-readable address using OpenStreetMap Nominatim.
 * Returns a short label like "Main Street, City" or null on failure.
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.county,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : (data.display_name?.split(",").slice(0, 2).join(", ") ?? null);
  } catch {
    return null;
  }
};

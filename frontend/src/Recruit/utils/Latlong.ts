import { useState } from "react";

interface NominatimAddress {
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimReverseResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: string[];
  error?: string;
}

interface UseReverseGeocodeReturn {
  isSearching: boolean;
  searchError: string;
  searchResults: NominatimReverseResult[];
  handleReverseGeocode: (lat: number, lng: number) => Promise<void>;
  clearResults: () => void;
}

export const useReverseGeocode = (): UseReverseGeocodeReturn => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimReverseResult[]>([]);

  const handleReverseGeocode = async (lat: number, lng: number) => {
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimReverseResult = await res.json();
      if (data.error) setSearchError("No place found at these coordinates.");
      else setSearchResults([data]);
    } catch {
      setSearchError("Reverse geocode failed. Check your internet connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setSearchResults([]);
    setSearchError("");
  };

  return { isSearching, searchError, searchResults, handleReverseGeocode, clearResults };
};

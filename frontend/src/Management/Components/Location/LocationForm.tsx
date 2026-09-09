import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  Text,
  Button,
  Input,
  Field,
  Dropdown,
  Option,
  Textarea,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Spinner,
} from "@fluentui/react-components";
import {
  Location20Regular,
  Building20Regular,
  Settings20Regular,
  Globe20Regular,
  Search20Regular,
  Dismiss20Regular,
  MyLocation20Regular,
  Home20Regular,
} from "@fluentui/react-icons";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {
  ALLOWLIST,
  detectSqlInjection,
  validateSafeText,
} from "../../Utils/inputValidation";

// Types
interface LocationFormData {
  Name: string;
  Code: string;
  Coordinates?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zipcode?: string;
  NumberOfFloors?: number | null;
  Country: string;
  Type: string;
  Description: string;
  Status: string;
}

interface FormErrors {
  Name?: string;
  Code?: string;
  Coordinates?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zipcode?: string;
  NumberOfFloors?: string;
  Country?: string;
  Type?: string;
  Description?: string;
  Status?: string;
}

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  location?: LocationFormData | null;
  onSave?: (data: LocationFormData) => void;
  isLoading?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// ─── Sub-component: flies the map to a given center ─────────────────────────
const FlyToLocation: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { animate: true, duration: 1 });
  }, [center, map]);
  return null;
};

// ─── Sub-component: captures clicks on the map ──────────────────────────────
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const LocationForm: React.FC<LocationFormProps> = ({
  isOpen,
  onClose,
  location,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    Name: "",
    Code: "",
    Coordinates: "",
    Street: "",
    City: "",
    State: "",
    Zipcode: "",
    NumberOfFloors: undefined,
    Country: "",
    Type: "Office",
    Description: "",
    Status: "active",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // PIN code auto-lookup state
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  // Fix Leaflet default marker icons (must run client-side only)
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Map picker state
  const [showMap, setShowMap] = useState(false);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (location) {
      setFormData({
        Name: location.Name || "",
        Code: location.Code || "",
        Coordinates: location.Coordinates || "",
        Street: location.Street || "",
        City: location.City || "",
        State: location.State || "",
        Zipcode: location.Zipcode || "",
        NumberOfFloors: location.NumberOfFloors ?? undefined,
        Country: location.Country || "",
        Type: location.Type || "Office",
        Description: location.Description || "",
        Status: location.Status || "active",
      });
      // If editing and coordinates exist, try to parse and show marker
      if (location.Coordinates) {
        const parts = location.Coordinates.split(",").map((s) => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          setMarkerPos([parts[0], parts[1]]);
        }
      }
    } else {
      setFormData({
        Name: "",
        Code: "",
        Coordinates: "",
        Street: "",
        City: "",
        State: "",
        Zipcode: "",
        NumberOfFloors: undefined,
        Country: "",
        Type: "Office",
        Description: "",
        Status: "active",
      });
      setMarkerPos(null);
    }
    setErrors({});
    setShowMap(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setPincodeError("");
    setIsPincodeLoading(false);
  }, [location, isOpen]);

  const handleInputChange = (field: keyof LocationFormData, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "Code" ? value.toUpperCase() : value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Zip / PIN code: sanitise input and auto-lookup City & State ───────────
  const handleZipcodeChange = (value: string): void => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, Zipcode: digits }));
    if (errors.Zipcode) setErrors((prev) => ({ ...prev, Zipcode: undefined }));
    setPincodeError("");
    if (digits.length === 6) {
      void lookupPincode(digits);
    }
  };

  // ── Number of Floors: digits only, up to 3 digits (max 999) ───────────────
  const handleNumberOfFloorsChange = (value: string): void => {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    setFormData((prev) => ({ ...prev, NumberOfFloors: digits ? Number(digits) : undefined }));
    if (errors.NumberOfFloors) setErrors((prev) => ({ ...prev, NumberOfFloors: undefined }));
  };

  const lookupPincode = async (pincode: string): Promise<void> => {
    setIsPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : null;
      const postOffice = entry?.PostOffice?.[0];
      if (entry?.Status === "Success" && postOffice) {
        setFormData((prev) => ({
          ...prev,
          City: postOffice.District || prev.City,
          State: postOffice.State || prev.State,
          Country: postOffice.Country || prev.Country,
        }));
      } else {
        setPincodeError("No location found for this PIN code.");
      }
    } catch {
      setPincodeError("Failed to look up PIN code. Enter City & State manually.");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name — required, allowlisted, injection-checked.
    newErrors.Name = validateSafeText(formData.Name, {
      label: "Location Name",
      allow: ALLOWLIST.name,
      maxLength: 100,
      required: true,
    });

    // Code — optional; keep the existing 2–50 alphanumeric rule.
    if (formData.Code && !/^[A-Z0-9_-]{2,50}$/i.test(formData.Code))
      newErrors.Code = "Code must be 2-50 characters (letters, numbers, -, _)";

    if (!formData.Country.trim()) newErrors.Country = "Country is required";
    if (!formData.Type.trim()) newErrors.Type = "Location Type is required";

    // Address fields — optional, but hardened when present.
    newErrors.Street = validateSafeText(formData.Street, {
      label: "Street",
      allow: ALLOWLIST.street,
      maxLength: 250,
    });
    newErrors.City = validateSafeText(formData.City, {
      label: "City / District",
      allow: ALLOWLIST.place,
      maxLength: 100,
    });
    newErrors.State = validateSafeText(formData.State, {
      label: "State",
      allow: ALLOWLIST.place,
      maxLength: 100,
    });

    if (formData.Zipcode && !ALLOWLIST.pincode.test(formData.Zipcode))
      newErrors.Zipcode = "PIN code must be 6 digits";

    if (formData.NumberOfFloors != null && formData.NumberOfFloors < 1)
      newErrors.NumberOfFloors = "Number of Floors must be at least 1";

    // Coordinates — optional; must be a valid "lat, lng" pair.
    if (formData.Coordinates && !ALLOWLIST.coordinates.test(formData.Coordinates.trim()))
      newErrors.Coordinates = "Coordinates must be in 'lat, lng' format";

    // Description — free text; block only injection-shaped payloads.
    if (formData.Description) {
      if (formData.Description.length > 1000)
        newErrors.Description = "Description must be 1000 characters or fewer";
      else if (detectSqlInjection(formData.Description))
        newErrors.Description = "Description contains characters that aren't allowed";
    }

    // Drop keys whose validators returned undefined (i.e. valid).
    (Object.keys(newErrors) as (keyof FormErrors)[]).forEach((k) => {
      if (!newErrors[k]) delete newErrors[k];
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validateForm()) return;
    if (onSave) onSave(formData);
    if (!isLoading) onClose();
  };

  const handleClose = (): void => {
    if (!isLoading) onClose();
  };

  // ── Map: click handler ───────────────────────────────────────────────────
  const handleMapClick = (lat: number, lng: number) => {
    const rounded = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setMarkerPos([lat, lng]);
    setFormData((prev) => ({ ...prev, Coordinates: rounded }));
    setSearchResults([]);
  };

  // ── Map: search via Nominatim ────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);
    // Normalise query for Nominatim:
    //  • Remove door/flat numbers like "#99", "No.5", "D-12" at the start
    //  • Strip bare # symbols (not indexed by OSM)
    //  • Convert "Tamil Nadu-641012" → "Tamil Nadu, 641012"
    const normalised = searchQuery
      .trim()
      .replace(/^#?\d+[\w-]*[,\s]*/i, "")   // strip leading house/door number
      .replace(/#\d*\s*/g, "")               // strip any remaining # tokens
      .replace(/\bNo\.?\s*\d+[,\s]*/gi, "") // strip "No.99" / "No 99"
      .replace(/-(\d{5,6})\b/g, ", $1")     // "Tamil Nadu-641012" → "Tamil Nadu, 641012"
      .replace(/\s{2,}/g, " ")
      .trim();
    try {
      const params = new URLSearchParams({
        q:              normalised,
        format:         "json",
        limit:          "5",
        countrycodes:   "in",
        addressdetails: "1",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { "Accept-Language": "en", "User-Agent": "QuadraPeople/1.0 (quadrasystems.net)" } }
      );
      const data: NominatimResult[] = await res.json();
      if (data.length === 0)
        setSearchError("No results found. Try a shorter term — e.g. 'Tatabad, Coimbatore'.");
      else setSearchResults(data);
    } catch {
      setSearchError("Search failed. Check your internet connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const rounded = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setMarkerPos([lat, lng]);
    setFlyTo([lat, lng]);
    setFormData((prev) => ({ ...prev, Coordinates: rounded }));
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  const handleClearCoordinates = () => {
    setMarkerPos(null);
    setFlyTo(null);
    setFormData((prev) => ({ ...prev, Coordinates: "" }));
    setSearchQuery("");
    setSearchResults([]);
  };

  const countries: string[] = ["India"];
  const locationTypes: string[] = ["Office", "Remote", "Temporary", "Coworking"];
  const statusOptions = [
    { value: "active", text: "Active" },
    { value: "inactive", text: "Inactive" },
  ];

  // Default map center: India
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(_event, data) => !data.open && !isLoading && onClose()}
    >
      <DialogSurface style={{ maxWidth: "620px", width: "100%" }}>
        <DialogBody>
          <DialogTitle className="flex items-center gap-2 mb-4">
            <Building20Regular style={{ color: "#6B46C1" }} />
            {location ? "Edit Location" : "Add New Location"}
          </DialogTitle>

          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* ── Basic Information ─────────────────────────────── */}
              <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <CardHeader
                  header={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Location20Regular style={{ color: "#2563eb" }} />
                      <Text weight="semibold">Basic Information</Text>
                    </div>
                  }
                />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <Field label="Location Name" required
                      validationState={errors.Name ? "error" : "none"}
                      validationMessage={errors.Name}>
                      <Input value={formData.Name}
                        onChange={(e) => handleInputChange("Name", e.target.value)}
                        placeholder="e.g., New York Office" disabled={isLoading} />
                    </Field>
                    <Field label="Location Code (Optional)"
                      validationState={errors.Code ? "error" : "none"}
                      validationMessage={errors.Code}>
                      <Input value={formData.Code}
                        onChange={(e) => handleInputChange("Code", e.target.value)}
                        placeholder="e.g., NYC-01" disabled={isLoading} />
                    </Field>
                  </div>
                  <Field label="Country" required
                    validationState={errors.Country ? "error" : "none"}
                    validationMessage={errors.Country}>
                    <Dropdown placeholder="Select Country" value={formData.Country}
                      selectedOptions={formData.Country ? [formData.Country] : []}
                      onOptionSelect={(_e, data) => { if (data.optionValue) handleInputChange("Country", data.optionValue); }}
                      disabled={isLoading}>
                      {countries.map((c) => <Option key={c} value={c}>{c}</Option>)}
                    </Dropdown>
                  </Field>
                  <Field label="Location Type" required
                    validationState={errors.Type ? "error" : "none"}
                    validationMessage={errors.Type}>
                    <Dropdown placeholder="Select location Type" value={formData.Type}
                      selectedOptions={[formData.Type]}
                      onOptionSelect={(_e, data) => { if (data.optionValue) handleInputChange("Type", data.optionValue); }}
                      disabled={isLoading}>
                      {locationTypes.map((t) => <Option key={t} value={t}>{t}</Option>)}
                    </Dropdown>
                  </Field>
                </div>
              </Card>

              {/* ── Address ───────────────────────────────────────── */}
              <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <CardHeader
                  header={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Home20Regular style={{ color: "#ea580c" }} />
                      <Text weight="semibold">Address</Text>
                    </div>
                  }
                />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Field label="Street"
                    validationState={errors.Street ? "error" : "none"}
                    validationMessage={errors.Street}>
                    <Textarea value={formData.Street}
                      onChange={(e) => handleInputChange("Street", e.target.value)}
                      placeholder="e.g., No. 12, 2nd Floor, Avinashi Road"
                      rows={2} style={{ width: "100%" }} disabled={isLoading} />
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
                    <Field label="Zip / PIN Code"
                      validationState={errors.Zipcode ? "error" : "none"}
                      validationMessage={errors.Zipcode}>
                      <Input value={formData.Zipcode}
                        onChange={(e) => handleZipcodeChange(e.target.value)}
                        placeholder="e.g., 638102"
                        inputMode="numeric"
                        maxLength={6}
                        disabled={isLoading}
                        contentAfter={isPincodeLoading ? <Spinner size="tiny" /> : undefined} />
                    </Field>
                    <Field label="City / District"
                      validationState={errors.City ? "error" : "none"}
                      validationMessage={errors.City}>
                      <Input value={formData.City}
                        onChange={(e) => handleInputChange("City", e.target.value)}
                        placeholder="e.g., Erode" disabled={isLoading} />
                    </Field>
                  </div>

                  <Text style={{ fontSize: "12px", color: "#6b7280", marginTop: "-6px" }}>
                    {isPincodeLoading
                      ? "Looking up City & State…"
                      : "Enter a 6-digit PIN code to auto-fill City & State."}
                  </Text>

                  <Field label="State"
                    validationState={errors.State ? "error" : "none"}
                    validationMessage={errors.State}>
                    <Input value={formData.State}
                      onChange={(e) => handleInputChange("State", e.target.value)}
                      placeholder="e.g., Tamil Nadu" disabled={isLoading} />
                  </Field>

                  {pincodeError && (
                    <Text style={{ color: "#dc2626", fontSize: "13px" }}>{pincodeError}</Text>
                  )}
                </div>
              </Card>

              {/* ── Coordinates ───────────────────────────────────── */}
              <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <CardHeader
                  header={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Globe20Regular style={{ color: "#9333ea" }} />
                      <Text weight="semibold">Coordinates</Text>
                    </div>
                  }
                />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

                  {/* Coordinates text field + action buttons */}
                  <Field label="Location Coordinates (Optional)"
                    validationState={errors.Coordinates ? "error" : "none"}
                    validationMessage={errors.Coordinates}
                    hint={formData.Coordinates ? "" : "Type manually or use the map picker below"}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Input
                        style={{ flex: 1 }}
                        value={formData.Coordinates}
                        onChange={(e) => handleInputChange("Coordinates", e.target.value)}
                        placeholder="e.g., 11.0168, 76.9558"
                        disabled={isLoading}
                      />
                      {formData.Coordinates && (
                        <Button
                          appearance="subtle"
                          icon={<Dismiss20Regular />}
                          onClick={handleClearCoordinates}
                          title="Clear coordinates"
                          style={{ minWidth: 0, padding: "0 6px" }}
                        />
                      )}
                      <Button
                        appearance={showMap ? "primary" : "outline"}
                        icon={<MyLocation20Regular />}
                        onClick={() => setShowMap((v) => !v)}
                        style={{
                          whiteSpace: "nowrap",
                          backgroundColor: showMap ? "#9333ea" : undefined,
                          borderColor: showMap ? "#9333ea" : "#d1d5db",
                          color: showMap ? "white" : "#374151",
                        }}
                        disabled={isLoading}
                      >
                        {showMap ? "Hide Map" : "Pick on Map"}
                      </Button>
                    </div>
                  </Field>

                  {/* Map picker panel */}
                  {showMap && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                      {/* Nominatim search */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Input
                          style={{ flex: 1 }}
                          placeholder="Search for a city or address..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                        />
                        <Button
                          appearance="primary"
                          icon={isSearching ? <Spinner size="tiny" /> : <Search20Regular />}
                          onClick={handleSearch}
                          disabled={isSearching || !searchQuery.trim()}
                          style={{ backgroundColor: "#7c3aed" }}
                        >
                          Search
                        </Button>
                      </div>

                      {/* Search results dropdown */}
                      {searchResults.length > 0 && (
                        <div style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          overflow: "hidden",
                          backgroundColor: "white",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}>
                          {searchResults.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => handleResultSelect(r)}
                              style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 14px",
                                border: "none",
                                borderBottom: i < searchResults.length - 1 ? "1px solid #f3f4f6" : "none",
                                backgroundColor: "white",
                                cursor: "pointer",
                                fontSize: "13px",
                                color: "#374151",
                                lineHeight: "1.4",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f3ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <span style={{ fontWeight: 500 }}>{r.display_name.split(",")[0]}</span>
                              <br />
                              <span style={{ color: "#6b7280", fontSize: "11px" }}>
                                {r.display_name.split(",").slice(1, 4).join(",").trim()}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchError && (
                        <Text style={{ color: "#dc2626", fontSize: "13px" }}>{searchError}</Text>
                      )}

                      {/* Instruction */}
                      <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                        🖱️ You can also click anywhere on the map to drop a pin.
                      </Text>

                      {/* Leaflet map */}
                      <div style={{
                        height: "280px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "2px solid #e5e7eb",
                        position: "relative",
                      }}>
                        <MapContainer
                          center={markerPos ?? defaultCenter}
                          zoom={markerPos ? 15 : 5}
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={true}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <MapClickHandler onMapClick={handleMapClick} />
                          {flyTo && <FlyToLocation center={flyTo} />}
                          {markerPos && <Marker position={markerPos} />}
                        </MapContainer>
                      </div>

                      {markerPos && (
                        <div style={{
                          backgroundColor: "#f5f3ff",
                          border: "1px solid #ddd6fe",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}>
                          <Globe20Regular style={{ color: "#7c3aed", flexShrink: 0 }} />
                          <Text style={{ fontSize: "13px", color: "#5b21b6", fontFamily: "monospace" }}>
                            {formData.Coordinates}
                          </Text>
                          <Text style={{ fontSize: "12px", color: "#7c3aed", marginLeft: "auto" }}>
                            ✓ Coordinates captured
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* ── Additional Details ────────────────────────────── */}
              <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <CardHeader
                  header={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Settings20Regular style={{ color: "#16a34a" }} />
                      <Text weight="semibold">Additional Details</Text>
                    </div>
                  }
                />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <Field label="Status"
                      validationState={errors.Status ? "error" : "none"}
                      validationMessage={errors.Status}>
                      <Dropdown placeholder="Select Status" value={formData.Status}
                        selectedOptions={[formData.Status]}
                        onOptionSelect={(_e, data) => { if (data.optionValue) handleInputChange("Status", data.optionValue); }}
                        disabled={isLoading}>
                        {statusOptions.map((o) => <Option key={o.value} value={o.value}>{o.text}</Option>)}
                      </Dropdown>
                    </Field>
                    <Field label="Number of Floors (Optional)"
                      validationState={errors.NumberOfFloors ? "error" : "none"}
                      validationMessage={errors.NumberOfFloors}>
                      <Input
                        value={formData.NumberOfFloors != null ? String(formData.NumberOfFloors) : ""}
                        onChange={(e) => handleNumberOfFloorsChange(e.target.value)}
                        placeholder="e.g., 4"
                        inputMode="numeric"
                        maxLength={3}
                        disabled={isLoading}
                      />
                    </Field>
                  </div>
                  <Field label="Description"
                    validationState={errors.Description ? "error" : "none"}
                    validationMessage={errors.Description}>
                    <Textarea value={formData.Description}
                      onChange={(e) => handleInputChange("Description", e.target.value)}
                      placeholder="Optional Description of the location..."
                      rows={3} style={{ width: "100%" }} disabled={isLoading} />
                  </Field>
                </div>
              </Card>

            </div>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              style={{ backgroundColor: "#6B46C1" }}
              disabled={isLoading}
              icon={isLoading ? <Spinner size="tiny" /> : undefined}
            >
              {isLoading
                ? location ? "Updating..." : "Creating..."
                : location ? "Update Location" : "Create Location"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default LocationForm;

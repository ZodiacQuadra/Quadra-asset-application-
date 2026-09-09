import {
  Card,
  Button,
  SearchBox,
  Badge,
  Text,
  Subtitle2,
  Caption1,
  Spinner,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  ToastIntent,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableBody,
  TableCell,
  Body1Strong,
  FluentProvider,
  useId,
} from "@fluentui/react-components";
import {
  Add20Regular,
  Location20Regular,
  Edit20Regular,
  Delete20Regular,
  Location48Regular,
  ErrorCircle20Regular,
  CheckmarkCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  Add24Regular,
} from "@fluentui/react-icons";
import React, { useState, useEffect } from "react";
import {
  AppLocation,
  LocationFormData,
  getAppLocations,
  createAppLocation,
  updateAppLocation,
  deleteAppLocation,
} from "../../../Services/Location";
import LocationForm from "./LocationForm";
import { useAuth } from "../../../Auth/AuthProvider";

interface SortConfig {
  key: keyof AppLocation;
  direction: "asc" | "desc";
}

const AppLocations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showLocationForm, setShowLocationForm] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<AppLocation | null>(
    null
  );
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { currentUser, accessToken }: any = useAuth();

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);

  // Fetch locations on component mount
  useEffect(() => {
    if (accessToken) {
      fetchLocations();
    }
  }, [accessToken]);

  const showToast = (intent: ToastIntent, title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            intent === "success" ? (
              <CheckmarkCircle20Regular />
            ) : (
              <ErrorCircle20Regular />
            )
          }
        >
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, timeout: 5000 }
    );
  };

  const fetchLocations = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const data = await getAppLocations(accessToken);
      setLocations(data || []);
    } catch (err) {
      console.error("Error fetching locations:", err);
      showToast("error", "Error", "Unable to get the locations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (location: AppLocation): void => {
    setEditingLocation(location);
    setShowLocationForm(true);
  };

  const handleDelete = async (locationId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this location?")) {
      return;
    }

    setDeletingId(locationId);

    try {
      await deleteAppLocation(locationId, currentUser.userID, accessToken);
      setLocations(locations.filter((loc) => loc.Id !== locationId));
      showToast("success", "Success", "Location deleted successfully");
    } catch (err) {
      console.error("Error deleting location:", err);
      showToast("error", "Error", "Unable to delete the location.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormClose = (): void => {
    setShowLocationForm(false);
    setEditingLocation(null);
  };

  const handleSave = async (locationData: LocationFormData): Promise<void> => {
    if (editingLocation) {
      // Update existing location
      setIsUpdating(true);

      try {
        const updatedLocation = await updateAppLocation(
          editingLocation.Id,
          locationData,
          currentUser.userID,
          accessToken
        );

        setLocations(
          locations.map((loc) =>
            loc.Id === editingLocation.Id ? updatedLocation : loc
          )
        );

        showToast("success", "Success", "Location updated successfully");
        handleFormClose();
      } catch (err) {
        console.error("Error updating location:", err);
        showToast("error", "Error", "Unable to update the location.");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Create new location
      setIsCreating(true);

      try {
        const newLocation = await createAppLocation(
          locationData,
          currentUser.userID,
          accessToken
        );
        setLocations([...locations, newLocation]);
        showToast("success", "Success", "Location created successfully");
        handleFormClose();
      } catch (err) {
        console.error("Error creating location:", err);
        showToast("error", "Error", "Unable to create the location.");
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleSort = (key: keyof AppLocation) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const filteredLocations = locations.filter(
    (location) =>
      location.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.Country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.Code &&
        location.Code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSortedLocations = () => {
    if (!sortConfig) return filteredLocations;

    return [...filteredLocations].sort((a, b) => {
      const aValue: any = a[sortConfig.key];
      const bValue: any = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
      if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedLocations = getSortedLocations();

  const getStatusBadgeAppearance: any = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return {
          appearance: "ghost" as const,
          color: "success" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          dotColor: "bg-green-500",
        };
      case "inactive":
        return {
          appearance: "ghost" as const,
          color: "warning" as const,
          className: "bg-amber-100 text-amber-800 border-amber-200",
          dotColor: "bg-amber-500",
        };
      default:
        return {
          appearance: "ghost" as const,
          color: "informative" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          dotColor: "bg-gray-500",
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Office Locations...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-4">
            <div>
              <Subtitle2 className="text-[#063762]">
                Office Locations ({filteredLocations.length})
              </Subtitle2>
              <div>
                <Caption1 className="text-gray-600">
                  Locations that can be added, edited, and deleted within this
                  application
                </Caption1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center gap-4 w-full md:w-1/4">
              <div className="relative w-full">
                <SearchBox
                  className={`w-full transition-all duration-200 ${
                    isTransitioning
                      ? "opacity-70 scale-[0.99]"
                      : "opacity-100 scale-100"
                  } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                  disabled={isLoading}
                  placeholder="Search by name, code, country..."
                  value={searchTerm}
                  onChange={(_, data) => handleSearchChange(data.value)}
                />
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none rounded" />
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                appearance="primary"
                onClick={() => setShowLocationForm(true)}
                shape="circular"
                icon={
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                    <Add24Regular />
                  </div>
                }
                className=" hover:bg-indigo-700 shadow  !bg-white/50 !text-[#626262] border-1 !border-white"
                disabled={isLoading}
              >
                Add Location
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4">
            {sortedLocations.length > 0 ? (
              <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Table sortable className="w-full">
                    <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                      <TableRow className="border-b-2 border-gray-100">
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("Name")}
                        >
                          <div className="flex items-center gap-2 ml-5">
                            <Body1Strong className="text-gray-900">
                              Location
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Name" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("Code")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Code
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Code" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell className="!py-3 !px-3">
                          <Body1Strong className="text-gray-900">
                            Coordinates
                          </Body1Strong>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("Country")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Country
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Country" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("Type")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Type
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Type" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("Status")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Status
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Status" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell className="!py-3 !px-3">
                          <Body1Strong className="text-gray-900">
                            Description
                          </Body1Strong>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-purple-50 group !py-3 !px-3"
                          onClick={() => handleSort("CreatedAt")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Created
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "CreatedAt" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell className="!py-3 !px-3">
                          <Body1Strong className="text-gray-900">
                            Actions
                          </Body1Strong>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {sortedLocations.map((location, index) => {
                        const statusColors = getStatusBadgeAppearance(
                          location.Status
                        );
                        return (
                          <TableRow
                            key={location.Id}
                            className={`hover:bg-purple-50/50 transition-all duration-200 border-b border-gray-100 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <TableCell className="px-6 !py-5">
                              <div className="flex items-center gap-3">
                                <Location20Regular className="w-5 h-5 text-purple-600" />
                                <div className="space-y-1 ml-2">
                                  <Text className="font-semibold text-gray-900 leading-tight">
                                    {location.Name}
                                  </Text>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              {location.Code ? (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    appearance="outline"
                                    className="font-mono bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    {location.Code}
                                  </Badge>
                                </div>
                              ) : (
                                <Text className="text-gray-400 italic">
                                  No code
                                </Text>
                              )}
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <Text className="text-gray-600 text-sm font-mono">
                                {location.Coordinates || <span className="text-gray-400 italic not-italic font-sans">—</span>}
                              </Text>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <Text className="font-semibold text-gray-900">
                                {location.Country}
                              </Text>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <Badge
                                appearance="filled"
                                color="brand"
                                className="bg-purple-600 text-white"
                              >
                                {location.Type}
                              </Badge>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge
                                  {...statusColors}
                                  className={`font-medium shadow-none ${statusColors.className}`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${statusColors.dotColor} mr-2`}
                                  />
                                  {location.Status}
                                </Badge>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <Text className="text-gray-600 max-w-48 truncate">
                                {location.Description || "No description"}
                              </Text>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <CalendarRegular className="w-4 h-4 text-gray-400" />
                                <Text
                                  size={200}
                                  className="text-gray-700 font-medium"
                                >
                                  {formatDate(location.CreatedAt)}
                                </Text>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  appearance="subtle"
                                  icon={<Edit20Regular />}
                                  onClick={() => handleEdit(location)}
                                  disabled={
                                    isUpdating || deletingId === location.Id || location.Code === "WFH"
                                  }
                                  className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                                  aria-label={`Edit ${location.Name}`}
                                />
                                <Button
                                  appearance="subtle"
                                  onClick={() => handleDelete(location.Id)}
                                  icon={
                                    deletingId === location.Id ? (
                                      <Spinner size="tiny" />
                                    ) : (
                                      <Delete20Regular />
                                    )
                                  }
                                  className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                                  disabled={
                                    isUpdating || deletingId === location.Id || location.Code === "WFH"
                                  }
                                  aria-label={`Delete ${location.Name}`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                {sortedLocations.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                    <div className="flex items-center justify-between">
                      <Caption1 className="text-gray-600 font-medium">
                        Showing {sortedLocations.length} of {locations.length}{" "}
                        locations
                      </Caption1>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <Location48Regular className="w-10 h-10 text-purple-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No locations found
                </Subtitle2>
                <div className="text-center">
                  <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any locations matching your criteria. Try adjusting your search."
                      : "Get started by creating a new location."}
                  </Text>
                </div>
                {searchTerm ? (
                  <Button
                    appearance="primary"
                    onClick={() => setSearchTerm("")}
                    className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    appearance="primary"
                    onClick={() => setShowLocationForm(true)}
                    className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 bg-purple-600 hover:bg-purple-700"
                    icon={<Add20Regular />}
                  >
                    Add Your First Location
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Form Modal */}
      {showLocationForm && (
        <LocationForm
          isOpen={showLocationForm}
          onClose={handleFormClose}
          location={editingLocation}
          onSave={handleSave}
          isLoading={isCreating || isUpdating}
        />
      )}
    </FluentProvider>
  );
};

export default AppLocations;

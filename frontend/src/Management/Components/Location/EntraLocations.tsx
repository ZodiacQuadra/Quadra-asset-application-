import {
  Card,
  CardHeader,
  Button,
  Spinner,
  SearchBox,
  Badge,
  Label,
  Text,
  Switch,
  Caption1,
  Subtitle2,
  Body1,
  Body1Strong,
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
  FluentProvider,
} from "@fluentui/react-components";
import {
  CloudSync20Regular,
  ArrowSync20Regular,
  Building20Regular,
  Add20Regular,
  Location48Regular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  Location20Regular,
} from "@fluentui/react-icons";
import React, { useState, useEffect } from "react";
import {
  EntraLocation,
  SyncResult,
  getEntraLocations,
  updateEntraLocationStatus,
  syncEntraLocations,
} from "../../../Services/Location"; // Adjust import path as needed
import { useAuth } from "../../../Auth/AuthProvider";

interface SortConfig {
  key: keyof EntraLocation;
  direction: "asc" | "desc";
}

const EntraLocations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [locations, setLocations] = useState<EntraLocation[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const { currentUser, accessToken }: any = useAuth();
  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Toast controller
  const { dispatchToast } = useToastController();

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

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

  const showSyncToast = (result: SyncResult) => {
    const syncDetails = `Records Processed: ${result.RecordsProcessed}, Added: ${result.RecordsAdded}, Updated: ${result.RecordsUpdated}, Deactivated: ${result.RecordsDeactivated}`;

    dispatchToast(
      <Toast>
        <ToastTitle media={<CheckmarkCircle20Regular />}>
          Sync Completed Successfully
        </ToastTitle>
        <ToastBody>{syncDetails}</ToastBody>
      </Toast>,
      { intent: "success", timeout: 8000 }
    );
  };

  const fetchLocations = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const data = await getEntraLocations(accessToken);
      setLocations(data);
    } catch (err) {
      showToast("error", "Error", "Unable to get the location.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);

    try {
      const result = await syncEntraLocations(accessToken);
      showSyncToast(result);

      // Refresh the locations list after sync
      await fetchLocations();
    } catch (err) {
      showToast("error", "Error", "Unable to sync locations.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStatusToggle = async (
    locationId: string,
    newStatus: boolean
  ): Promise<void> => {
    setUpdatingStatusId(locationId);

    try {
      const status = newStatus ? "active" : "inactive";
      const updatedLocation = await updateEntraLocationStatus(
        locationId,
        status,
        accessToken
      );

      setLocations((prev) =>
        prev.map((loc) =>
          loc.Id === locationId
            ? { ...loc, Status: updatedLocation.Status }
            : loc
        )
      );

      showToast("success", "Success", `Location status updated to ${status}`);
    } catch (err) {
      showToast("error", "Error", "Unable to update location status.");
      // Trigger a refresh to revert the UI state
      fetchLocations();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSort = (key: keyof EntraLocation) => {
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

  const getSortedLocations = () => {
    if (!sortConfig) return filteredLocations;

    return [...filteredLocations].sort((a, b) => {
      const aValue: any = a[sortConfig.key];
      const bValue: any = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const getStatusBadgeAppearance: any = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { appearance: "filled" as const, color: "success" as const };
      case "inactive":
        return { appearance: "outline" as const, color: "warning" as const };
      default:
        return { appearance: "outline" as const, color: "neutral" as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredLocations = locations.filter(
    (location) =>
      location?.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.Country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLocations = getSortedLocations();

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Toaster />
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">Loading Entra locations...</Body1Strong>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-4">
      <Toaster />

      {/* Header Actions */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* <CloudSync20Regular className="text-green-600 text-xl" /> */}
            <Subtitle2>
              EntraID Synchronization &nbsp; ({filteredLocations.length})
            </Subtitle2>
          </div>
          <Caption1 className="text-gray-600">
            These locations are synced from EntraID. You can toggle their
            active/inactive status here, but other changes must be made in the
            Microsoft Admin Center.
          </Caption1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            appearance="primary"
            onClick={handleSync}
            disabled={isLoading || isSyncing}
            className="bg-green-600 hover:bg-green-700"
            icon={isSyncing ? <Spinner size="tiny" /> : <ArrowSync20Regular />}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="gap-4 flex justify-end align-baseline">
        <div>
          <SearchBox
            placeholder="Search by Name or Country..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <FluentProvider style={{ background: "transparent" }}>
        <Card className="shadow-lg rounded-xl border-0 overflow-hidden bg-white">
          <div className="max-h-96 overflow-auto">
            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <TableRow className="bg-gray-50/80 backdrop-blur-sm">
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("Name")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Location
                      </Body1Strong>
                      {sortConfig?.key === "Name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-green-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-green-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("Country")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Country
                      </Body1Strong>
                      {sortConfig?.key === "Country" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-green-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-green-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Source
                      </Body1Strong>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("Status")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Status
                      </Body1Strong>
                      {sortConfig?.key === "Status" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-green-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-green-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("LastSynced")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Last Synced
                      </Body1Strong>
                      {sortConfig?.key === "LastSynced" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-green-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-green-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className="px-6 py-4">
                    <Body1Strong className="text-gray-700">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLocations.map((location, index) => (
                  <TableRow
                    key={location.Id}
                    className={`hover:bg-green-50/50 transition-all duration-200 border-b border-gray-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-row gap-1">
                        <Location20Regular className="text-green-600" />
                        <Body1Strong>{location.Name}</Body1Strong>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-row gap-1">
                        <Body1Strong>{location.Country}</Body1Strong>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        appearance="filled"
                        color="success"
                        className="bg-green-600 text-white"
                      >
                        EntraID
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        {...getStatusBadgeAppearance(location.Status)}
                        className="font-medium"
                      >
                        {location.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarRegular className="w-4 h-4 text-gray-400" />
                        <Text size={200} className="text-gray-600">
                          {formatDate(location.LastSynced)}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Label
                          htmlFor={`switch-${location.Id}`}
                          className="text-sm"
                        >
                          Active:
                        </Label>
                        <div className="flex items-center gap-2">
                          {updatingStatusId === location.Id && (
                            <Spinner size="tiny" />
                          )}
                          <Switch
                            id={`switch-${location.Id}`}
                            checked={location.Status === "active"}
                            onChange={(ev, data) => {
                              handleStatusToggle(location.Id, data.checked);
                            }}
                            disabled={updatingStatusId === location.Id}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer Section */}
          {filteredLocations.length > 0 && (
            <div className="border-t border-gray-200 px-2 py-4">
              <div className="flex items-center justify-between">
                <Caption1 className="text-gray-700 font-semibold">
                  Showing {filteredLocations.length} locations
                </Caption1>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredLocations.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <Location48Regular className="w-16 h-16 text-gray-400" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700 font-semibold">
                No locations found
              </Subtitle2>
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-gray-500 max-w-md leading-relaxed">
                  {searchTerm
                    ? "Try adjusting your search criteria."
                    : "No Entra locations are currently synced. Try syncing now."}
                </div>
              </div>
              {!searchTerm && (
                <Button
                  appearance="primary"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  icon={
                    isSyncing ? <Spinner size="tiny" /> : <ArrowSync20Regular />
                  }
                >
                  {isSyncing ? "Syncing..." : "Sync Entra Locations"}
                </Button>
              )}
            </div>
          )}
        </Card>
      </FluentProvider>
    </div>
  );
};

export default EntraLocations;

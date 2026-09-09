import {
  SelectTabEvent,
  SelectTabData,
  FluentProvider,
} from "@fluentui/react-components";

import { useState } from "react";
import AppLocations from "../Components/Location/AppLocations";
//import EntraLocations from "../Components/Location/EntraLocations";

export interface BaseLocation {
  id: string;
  name: string;

  country: string;
  status: "active" | "inactive";
}

export interface AppLocation extends BaseLocation {
  type:
    | "Office"
    | "Remote"
    | "Coworking"
    | "Temporary"
    | "Warehouse"
    | "Retail";
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntraLocation extends BaseLocation {
  lastSynced: string;
}

export interface LocationFormData {
  name: string;
  country: string;
  type: string;
  description: string;
  status: string;
}

export interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  location?: AppLocation | null;
  onSave: (data: LocationFormData) => void;
}

export interface FormErrors {
  name?: string;
  country?: string;
}

const Location: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>("app");

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData): void => {
    setSelectedTab(data.value as string);
  };

  return (
    <FluentProvider style={{ background: "transparent" }} className="h-full">
      {/* <div className="flex justify-between items-center pb-2">
        <div>
          <Subtitle2 className="text-gray-800">Location Management</Subtitle2>
          <div>
            <Caption1 className="text-gray-600">
              Configure your organization location.
            </Caption1>
          </div>
        </div>
      </div> */}

      <>
        <AppLocations />
      </>
    </FluentProvider>
  );
};

export default Location;

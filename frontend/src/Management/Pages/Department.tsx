import {
  SelectTabEvent,
  SelectTabData,
  FluentProvider,
  TabList,
  Tab,
  Text,
  Button,
  Caption1,
  Subtitle2,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Building20Regular,
  CloudSync20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import AppDepartments from "../Components/Department/AppDepartments";
import EntraDepartments from "../Components/Department/EntraDepartments";

export interface BaseDepartment {
  Id: string;
  Name: string;
  Status: "active" | "inactive";
}

export interface AppDepartment extends BaseDepartment {
  Description: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EntraDepartment extends BaseDepartment {
  LastSynced: string;
}

export interface DepartmentFormData {
  Name: string;
  Description: string;
  Status: string;
}

export interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  department?: AppDepartment | null;
  onSave: (data: DepartmentFormData) => void;
}

export interface FormErrors {
  Name?: string;
}

const Department: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>("app");

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData): void => {
    setSelectedTab(data.value as string);
  };

  return (
    <FluentProvider style={{ background: "transparent" }} className="h-full">
      {/* <div className="flex justify-between items-center pb-2">
        <div>
          <Subtitle2 className="text-gray-800">Department Management</Subtitle2>
          <div>
            <Caption1 className="text-gray-600">
              Configure your organization departments.
            </Caption1>
          </div>
        </div>
      </div> */}

      <>
        <EntraDepartments />
      </>
    </FluentProvider>
  );
};

export default Department;

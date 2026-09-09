import { useState } from "react";
import {
  Button,
  Input,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuButton,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Search24Regular,
  Filter24Regular,
  Clock24Regular,
  Person24Regular,
  Settings24Regular,
  Alert24Regular,
  ChevronDown24Regular,
} from "@fluentui/react-icons";

interface EnhancedHeaderProps {
  pendingCount: number;
  totalJobs: number;
  onCreateJob: () => void;
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
}

export const EnhancedHeader = ({
  pendingCount,
  totalJobs,
  onCreateJob,
  onSearch,
  onFilterChange,
  searchQuery,
}: EnhancedHeaderProps) => {
  const [currentFilter, setCurrentFilter] = useState("all");

  const handleFilterSelect = (filter: string) => {
    setCurrentFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className=" border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Breadcrumb Navigation */}
      <div className="mx-auto px-4 py-3 border-b border-gray-100">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbButton
              href="/"
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton className="text-gray-900 font-medium">
              Job Postings
            </BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      {/* Main Header */}
      <div className=" mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Title and Stats */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Person24Regular className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Job Posting Management
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{totalJobs} total postings</span>
                {pendingCount > 0 && (
                  <Badge
                    appearance="ghost"
                    className="bg-amber-100 text-amber-800"
                    icon={<Clock24Regular />}
                  >
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - Search and Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative w-80">
              <Input
                contentBefore={
                  <Search24Regular className="h-4 w-4 text-gray-400" />
                }
                placeholder="Search job postings..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <MenuButton
                  appearance="outline"
                  className="min-w-[120px]"
                  icon={<Filter24Regular />}
                >
                  {currentFilter === "all"
                    ? "All Jobs"
                    : currentFilter === "active"
                    ? "Active"
                    : currentFilter === "draft"
                    ? "Draft"
                    : "Closed"}
                  <ChevronDown24Regular className="ml-2" />
                </MenuButton>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => handleFilterSelect("all")}>
                    All Jobs
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterSelect("active")}>
                    Active Postings
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterSelect("draft")}>
                    Draft Postings
                  </MenuItem>
                  <MenuItem onClick={() => handleFilterSelect("closed")}>
                    Closed Postings
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>

            {/* Notifications */}
            <Button
              appearance="outline"
              className="relative"
              icon={<Alert24Regular />}
            >
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>

            {/* Settings */}
            <Button appearance="outline" icon={<Settings24Regular />} />

            {/* Create Job Button */}
            <Button
              onClick={onCreateJob}
              appearance="primary"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-105"
              icon={<Add24Regular />}
            >
              Create Job Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

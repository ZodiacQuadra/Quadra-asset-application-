import { useEffect, useState } from "react";
import {
  FluentProvider,
  teamsLightTheme,
  Card,
  SearchBox,
  Body1,
  Badge,
  Caption1,
} from "@fluentui/react-components";
import {
  Settings24Regular,
  People24Regular,
  AccessibilityCheckmark24Regular,
  Flash24Regular,
  PersonKey24Regular,
  Building24Regular,
  GlobeLocation24Regular,
  Laptop24Regular,
  BoxMultiple24Regular,
  CurrencyDollarRupee24Regular,
  DocumentBulletList24Regular,
  Group24Filled,
  Timer24Regular,
  CalendarStar24Regular,
  AccessTime24Regular,
  Accessibility24Regular,
  BoxToolboxRegular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Auth/AuthProvider";

const ManagementHub = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const settingsCategories = [
    {
      id: "JobPosting",
      label: "Job Role Library",
      icon: People24Regular,
      badge: "12",
      description:
        "Duties and Responsibilities expected from individuals in an organization",
    },
    {
      id: "HiringTemplate",
      label: "Interview Pipelines",
      icon: Settings24Regular,
      badge: null,
      description: "Design and Manage hiring stages",
    },
    {
      id: "PermissionMatrix",
      label: "Permission Matrix",
      icon: AccessibilityCheckmark24Regular,
      badge: "12",
      description:
        "Duties and Responsibilities expected from individuals in an organization",
    },
    {
      id: "UserRoleManagement",
      label: "User Roles & Permissions",
      icon: PersonKey24Regular,
      badge: null,
      description: "Design and Manage hiring stages",
    },
    {
      id: "Location",
      label: "Office Locations",
      icon: GlobeLocation24Regular,
      badge: "New",
      description: "Location Management",
    },
    {
      id: "Department",
      label: "Department",
      icon: Building24Regular,
      badge: null,
      description: "Department Management",
    },
    {
      id: "hr_mapping",
      label: "HR Mapping",
      icon: Group24Filled,
      badge: null,
      description: "Map HR to departments",
    },
    {
      id: "InductionTasks",
      label: "Onboarding Tasks",
      icon: Flash24Regular,
      badge: "3",
      description: "Onboarding tasks management",
    },
    {
      id: "DocumentManagement",
      label: "Document Management",
      icon: DocumentBulletList24Regular,
      badge: null,
      description: "Manage documents for your organization",
    },
    {
      id: "ITActivitiesManagement",
      label: "IT-Head Activity Management",
      icon: BoxMultiple24Regular,
      badge: null,
      description: "Manage IT head activities for your organization",
    },
    {
      id: "AdminActivityManagement",
      label: "Admin Activity Management",
      icon: Laptop24Regular,
      badge: null,
      description: "Manage administrative activities for your organization",
    },
    {
      id: "FinanceActivityManagement",
      label: "Finance Activity Management",
      icon: CurrencyDollarRupee24Regular,
      badge: null,
      description: "Manage finance activities for your organization",
    },
    {
      id: "ShiftTemplate",
      label: "Shift Template",
      icon: Timer24Regular,
      badge: null,
      description: "Define and manage employee work shift templates and timings",
    },
    {
      id: "HolidayManagement",
      label: "Holiday Management",
      icon: CalendarStar24Regular,
      badge: "New",
      description: "Manage company holidays and festival calendars",
    },
    {
      id: "LeavePolicy",
      label: "Leave Policy",
      icon: Accessibility24Regular,
      badge: "New",
      description: "Manage leave types",
    },
    {
      id: "AttendanceConfig",
      label: "Attendance Configuration",
      icon: Timer24Regular,
      badge: null,
      description: "Manage system-level attendance configuration settings",
    },
    {
      id: "AssetConfiguration",
      label: "Asset Configuration",
      icon: BoxToolboxRegular,
      badge: "New",
      description: "Manage asset vendors and brands",
    },
    {
      id: "AssetSLAConfiguration",
      label: "Asset SLA Configuration",
      icon: BoxToolboxRegular,
      badge: "New",
      description: "Manage SLA configurations for asset requests",
    },
  ];

  // Filter categories based on permissions
  const filterCategoriesByPermissions = (categories: any) => {
    return categories.filter((category: any) => {
      const permissions = (currentUser as any)?.permissions;
      if (!permissions) return false;

      switch (category.id) {
        case "JobPosting":
          return permissions?.recruit?.job_role === true;
        case "HiringTemplate":
          return permissions?.recruit?.hiring_template === true;
        case "Location":
          return permissions?.recruit?.location === true;
        case "Department":
          return permissions?.recruit?.department === true;
        case "hr_mapping":
          return permissions?.recruit?.hr_mapping === true;
        case "PermissionMatrix":
          return permissions?.permissions?.permission_matrix === true;
        case "UserRoleManagement":
          return permissions?.permissions?.user_role_management === true;
        case "InductionTasks":
          return permissions?.onboarding?.induction_tasks === true;
        case "DocumentManagement":
          return permissions?.background_verification?.document_management === true;
        case "ITActivitiesManagement":
          return permissions?.offboarding?.it_activity_management === true;
        case "AdminActivityManagement":
          return permissions?.offboarding?.admin_activity_management === true;
        case "FinanceActivityManagement":
          return permissions?.offboarding?.finance_activity_management === true;
        case "ShiftTemplate":
          return (
            permissions?.attendance?.shift_template === true           );
        case "HolidayManagement":
          return (
            permissions?.attendance?.holiday_management === true
          );
        case "LeavePolicy":
          return permissions?.attendance?.leave_policy === true;
        case "AttendanceConfig":
          return permissions?.attendance?.leave_policy === true;
        case "AssetConfiguration":
        case "AssetSLAConfiguration":
          // No dedicated permission yet — visible to anyone who can reach Configuration Hub.
          return true;
        default:
          return false;
      }
    });
  };

  // First filter by permissions, then by search
  const permissionFilteredCategories = filterCategoriesByPermissions(
    settingsCategories
  );

  const filteredCategories = permissionFilteredCategories.filter(
    (category: any) =>
      category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTab = (tabId: string | number) => {
    // Navigate to the settings page with the selected tab
    navigate(`/ManagementHub/${tabId}`);
  };

  const colorPallet = [
    { bg: "bg-blue-50", text: "text-blue-600" },
    { bg: "bg-emerald-50", text: "text-emerald-600" },
    { bg: "bg-amber-50", text: "text-amber-600" },
    { bg: "bg-rose-50", text: "text-rose-600" },
    { bg: "bg-purple-50", text: "text-purple-600" },
    { bg: "bg-pink-50", text: "text-pink-600" },
    { bg: "bg-teal-50", text: "text-teal-600" },
    { bg: "bg-indigo-50", text: "text-indigo-600" },
    { bg: "bg-cyan-50", text: "text-cyan-600" },
    { bg: "bg-orange-50", text: "text-orange-600" },
  ];

  const getColorForCategory = (index: number) => {
    return colorPallet[index % colorPallet.length];
  };

  useEffect(() => {
    localStorage.removeItem("inductionPagination");
  }, []);

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col justify-start items-center gap-[30px]"
      theme={teamsLightTheme}
    >
      <div className="flex flex-col md:flex-row justify-between items-baseline w-[99%]">
        <Body1 className="text-gray-600 mb-2">
          Manage your organization's configuration and preferences &nbsp;
          <Badge appearance="outline" color="informative">
            {filteredCategories.length} sections
          </Badge>
        </Body1>

        <div className="flex items-center justify-between">
          <div>
            <SearchBox
              className={`sm:min-w-xs sm:max-w-md transition-all duration-200  !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
              placeholder="Search"
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
            />
          </div>
        </div>
      </div>

      {filteredCategories.length === 0 && (
        <FluentProvider
          style={{ background: "transparent" }}
          theme={teamsLightTheme}
          className="flex justify-center items-center h-full"
        >
          <div className="min-h-screen p-1">
            <Body1>
              {searchQuery
                ? `No settings found for "${searchQuery}"`
                : "No settings available based on your permissions"}
            </Body1>
          </div>
        </FluentProvider>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 w-[99%]">
        {filteredCategories.map((category: any, idx: number) => {
          const Icon = category.icon;
          const colorScheme = getColorForCategory(idx);

          return (
            <Card
              key={category.id}
              onClick={() => handleTab(category.id)}
              className="text-left !rounded-[12px] border-none !bg-[#ffffff56] cursor-pointer w-full  h-[70px] transition-all duration-200 hover:-translate-y-1 p-4 hover:shadow-lg"
            >
              <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center gap-3 justify-between w-full">
                  <div className="flex flex-col gap-0.5 max-w-[80%]">
                    <Body1 className="!font-semibold !text-gray-700">
                      <p className="truncate">{category.label}</p>
                    </Body1>
                    <Caption1 className=" !text-gray-500 w-full">
                      <p className="truncate">{category.description}</p>
                    </Caption1>
                  </div>

                  <div
                    className={`rounded-full h-[50px] w-[50px] flex items-center justify-center ${colorScheme.bg} ${colorScheme.text}`}
                  >
                    <Icon />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </FluentProvider>
  );
};

export default ManagementHub;

// components/UserRoleAssignmentDashboard.tsx
import React, { useState, useEffect, useId } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Card,
  SearchBox,
  Button,
  Badge,
  Text,
  Body1Strong,
  Body1,
  Subtitle2,
  Caption1,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Persona,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  FluentProvider,
  makeStyles,
  tokens,
  Dropdown,
  Option,
  Label,
  Switch,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  DrawerFooter,
  ToastIntent,
  Field,
  Checkbox,
} from "@fluentui/react-components";
import {
  ChevronUpRegular,
  ChevronDownRegular,
  DeleteRegular,
  AddRegular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  PeopleTeamRegular,
  Edit24Regular,
  EyeRegular,
  SaveRegular,
  DismissRegular,
  Add24Regular,
  CalendarRegular,
  Checkmark20Regular,
  ErrorCircle20Regular,
} from "@fluentui/react-icons";
import { useToastController } from "@fluentui/react-components";
import CustomPagination from "../../Recruit/Components/CustomPagination";
import PeoplePicker, { Person } from "../../Recruit/Components/PeoplePicker";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getRoles,
  getAllUserRoles,
  getRolePermissionsForAssignment,
  assignRoleWithCustomPermissions,
  removeUserRole,
  getUserRoleDetails,
  updateCustomPermission,
  reassignUserRole,
  convertToBaseRole,
  Role,
  UserRole,
  Module,
  getUserDepartment,
} from "../../Services/UserAssignments";
import { CustomPermissionEditor } from "../Components/UserAssignments/CustomPermissionEditor";
import { fetchDepartments } from "../../Services/GraphAPI";
import { EntraDepartment, getEntraDepartments } from "../../Services/Department";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  card: {
    padding: tokens.spacingHorizontalM,
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  permissionEditorContainer: {
    maxHeight: "calc(100vh - 400px)",
    overflowY: "auto",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  drawerBody: {
    overflowY: "auto",
    padding: tokens.spacingHorizontalL,
  },
  infoBox: {
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
});

type DrawerMode = "assign" | "view" | "edit" | null;

export interface SelectedUserDepartments  {
  id: string,
  isActive:boolean
}

interface UserDepartment {
  DepartmentId: string,
  IsActive: boolean
}
export interface UserDepartmentResponse {
  data: UserDepartment[]
  success:boolean
}
export const UserRoleAssignmentDashboard: React.FC = () => {
  const styles = useStyles();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const { currentUser }: any = useAuth();

  // State
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredUserRoles, setFilteredUserRoles] = useState<UserRole[]>([]);
  const [paginatedUserRoles, setPaginatedUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<
    Module[]
  >([]);
  const [customizedPermissions, setCustomizedPermissions] = useState<Module[]>(
    []
  );

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Reassignment states
  const [isReassignMode, setIsReassignMode] = useState(false);
  const [roleToReassign, setRoleToReassign] = useState<UserRole | null>(null);
  const [existingCustomPermissions, setExistingCustomPermissions] = useState<
    Module[] | null
  >(null);

  // Dialog states
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userRoleToDelete, setUserRoleToDelete] = useState<UserRole | null>(
    null
  );

  // Assign role states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [enableCustomPermissions, setEnableCustomPermissions] = useState(false);
  const [hasPermissionChanges, setHasPermissionChanges] = useState(false);

  // View/Edit permission states
  const [viewEditPermissions, setViewEditPermissions] = useState<Module[]>([]);
  const [
    originalViewEditPermissions,
    setOriginalViewEditPermissions,
  ] = useState<Module[]>([]);
  const [baseRoleName, setBaseRoleName] = useState<string>("");
  const [customPermissionId, setCustomPermissionId] = useState<number | null>(
    null
  );
  const [hasViewEditChanges, setHasViewEditChanges] = useState(false);
  const [selectedEditRole, setSelectedEditRole] = useState<number | null>(null);
  const [useRoleTemplate, setUseRoleTemplate] = useState(false);

  // Loading states
  const [isLoadingUserRoles, setIsLoadingUserRoles] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingRolePermissions, setIsLoadingRolePermissions] = useState(
    false
  );

  // Departmental Access
  const [isDepartmentalRestriction,setIsDepartmentalRestriction] = useState(false)
  const [isLoadingDepartments,setIsLoadingDepartments] = useState(false)
  const [departmentData,setDepartmentData] = useState<EntraDepartment[]>([])
  const [selectedDepartmets,setSelectedDepartments] = useState<SelectedUserDepartments[]>([])
  const [isDepartmentalRestrictionForNew,setIsDepartmentalRestrictionForNew] = useState(false)
  const [selectedDepartmetsForNew,setSelectedDepartmentsForNew] = useState<SelectedUserDepartments[]>([])
  const [departmentDataForNew,setDepartmentDataForNew] = useState<EntraDepartment[]>([])


  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState(false);
  const [
    isLoadingViewEditPermissions,
    setIsLoadingViewEditPermissions,
  ] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const {accessToken} = useAuth()

  // Sort state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserRole;
    direction: "asc" | "desc";
  }>({ key: "assignedAt", direction: "desc" });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Fetch all available roles
  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await getRoles();

      if (response.success && response.data) {
        setAvailableRoles(response.data);
      } else {
        showErrorToast("Failed to load available roles");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      showErrorToast("Failed to load available roles");
    } finally {
      setIsLoadingRoles(false);
    }
  };

 const handleSelectDepartment = (departmentId: string) => {
  setHasViewEditChanges(true);
  setSelectedDepartments((prev) => {
    const exists = prev.find((p) => p.id === departmentId);
    if (exists) {
      // toggle immutably
      return prev.map((p) =>
        p.id === departmentId ? { ...p, isActive: !p.isActive } : p
      );
    }
    // add new selection
    return [...prev, { id: String(departmentId), isActive: true }];
  });
};

 const handleSelectDepartmentForNew = (departmentId: string) => {
  setSelectedDepartmentsForNew((prev) => {
    const exists = prev.find((p) => p.id === departmentId);
    if (exists) {
      // toggle immutably
      return prev.map((p) =>
        p.id === departmentId ? { ...p, isActive: !p.isActive } : p
      );
    }
    // add new selection
    return [...prev, { id: String(departmentId), isActive: true }];
  });
}

  const handleDepartmentAccessChange = () =>{
    setHasViewEditChanges(true);
    // use functional update so we can act based on the previous value
    setIsDepartmentalRestriction((prev) => {
      const newVal = !prev;

      // If disabling departmental restriction, clear all active selections
      if (!newVal) {
        setSelectedDepartments((prevSel) =>
          prevSel.map((item) => ({ ...item, isActive: false }))
        );
      } else {
        // If enabling restriction and departments not loaded, trigger load
        if (departmentData.length < 1) {
          loadDepartments();
        }
      }

      return newVal;
    });
  }

   const handleDepartmentAccessChangeForNew = () =>{
    // use functional update so we can act based on the previous value
    setIsDepartmentalRestrictionForNew((prev) => {
      const newVal = !prev;

      // If disabling departmental restriction, clear all active selections
      if (!newVal) {
        setSelectedDepartmentsForNew((prevSel) =>
          prevSel.map((item) => ({ ...item, isActive: false }))
        );
      } else {
        // If enabling restriction and departments not loaded, trigger load
        if (departmentDataForNew.length < 1) {
          // trigger load (we don't await here because this is inside a state setter)
          loadDepartmentsForNew();
        }
      }

      return newVal;
    });
  }

  useEffect(()=>{

    if(isDepartmentalRestriction && departmentData.length<1){
        loadDepartments()
    }

  },[isDepartmentalRestriction])

  useEffect(()=>{

    if(isDepartmentalRestrictionForNew && departmentDataForNew.length<1){
        loadDepartmentsForNew()
    }

  },[isDepartmentalRestrictionForNew])

  // Fetch all user role assignments
  const fetchUserRoles = async () => {
    try {
      setIsLoadingUserRoles(true);
      const response = await getAllUserRoles();

      if (response.success && response.data) {
        setUserRoles(response.data);
      } else {
        showErrorToast("Failed to load user role assignments");
      }
    } catch (error) {
      console.error("Error fetching user roles:", error);
      showErrorToast("Failed to load user role assignments");
    } finally {
      setIsLoadingUserRoles(false);
    }
  };

  // Fetch role permissions for customization
  const fetchRolePermissions = async (roleId: number) => {
    try {
      setIsLoadingRolePermissions(true);
      const response = await getRolePermissionsForAssignment(roleId);

      if (response.success && response.data) {
        setSelectedRolePermissions(response.data.modules);

        // If we have existing custom permissions and we're in reassign mode, use those
        // Otherwise use the role's default permissions
        if (isReassignMode && existingCustomPermissions) {
          setCustomizedPermissions(
            JSON.parse(JSON.stringify(existingCustomPermissions))
          );
        } else {
          setCustomizedPermissions(
            JSON.parse(JSON.stringify(response.data.modules))
          );
        }

        setHasPermissionChanges(false);
      } else {
        showErrorToast("Failed to load role permissions");
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      showErrorToast("Failed to load role permissions");
    } finally {
      setIsLoadingRolePermissions(false);
    }
  };

  // Fetch user role details for viewing/editing
  const fetchUserRoleDetails = async (userRoleId: number) => {
    try {
      setIsLoadingViewEditPermissions(true);
      const response = await getUserRoleDetails(userRoleId);

      if (response.success && response.data) {
        const {
          userRole,
          baseRolePermissions,
          customPermissions,
          IsDepartmentRestricted
        }: any = response.data;

      setIsDepartmentalRestriction(IsDepartmentRestricted)

      if (IsDepartmentRestricted) {
        const userId = userRole.userId;
        if (userId) {
          // Ensure departments are loaded first so we have a base list to map
          if (departmentData.length < 1) {
            await loadDepartments();
          }

          const departmentResponse = await getUserDepartment(userId);
          if (departmentResponse.success) {
            // Use the loaded departmentData (or fallback to fetching if empty)
            const baseList = departmentData.length
              ? departmentData
              : accessToken
              ? (await getEntraDepartments(accessToken)).filter((item) => item.Status === "active")
              : [];

            const modified = baseList.map((item) => ({
              id: String(item.Id),
              isActive: !!departmentResponse.data.find(
                (sub: UserDepartment) => String(sub.DepartmentId) === String(item.Id)
              ),
            }));

            setSelectedDepartments(modified);
          }
        }
      }


        // If custom role, use custom permissions, otherwise use base role permissions
        const permissionsToDisplay =
          customPermissions || baseRolePermissions || [];

        setViewEditPermissions(
          JSON.parse(JSON.stringify(permissionsToDisplay))
        );
        setOriginalViewEditPermissions(
          JSON.parse(JSON.stringify(permissionsToDisplay))
        );

        // Set base role name
        const baseRole = availableRoles.find(
          (r) => r.roleId === (userRole.baseRoleId || userRole.roleId)
        );
        setBaseRoleName(baseRole?.name || userRole.roleName);

        // Set custom permission ID if it's a custom role
        setCustomPermissionId(userRole.customPermissionId || null);
        setHasViewEditChanges(false);
        setUseRoleTemplate(false);
        setSelectedEditRole(null);
      } else {
        showErrorToast("Failed to load user role details");
      }
    } catch (error) {
      console.error("Error fetching user role details:", error);
      showErrorToast("Failed to load user role details");
    } finally {
      setIsLoadingViewEditPermissions(false);
    }
  };

  const showToast = (intent: ToastIntent, title: string, body?: string) => {
      dispatchToast(
        <Toast>
          <ToastTitle
            media={
              intent === "success" ? (
                <Checkmark20Regular />
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

  const loadDepartments = async (): Promise<void> => {
      setIsLoadingDepartments(true);
      try {
         if(accessToken){
             const data = await getEntraDepartments(accessToken);
             const filtered = data.filter((item)=>item.Status === 'active')
             setDepartmentData(filtered);
             // initialize selections based on the filtered (active) list
             const mapped = filtered.map((item)=>({ id: String(item.Id), isActive: false }));
             setSelectedDepartments(mapped);
          }
       
      } catch (error) {
        console.error("Error loading departments:", error);
        showToast(
          "error",
          "Error",
          "Failed to load departments. Please try again."
        );
      } finally {
        setIsLoadingDepartments(false);
      }
    };

  const loadDepartmentsForNew = async (): Promise<void> => {
      setIsLoadingDepartments(true);
      try {
         if(accessToken){
             const data = await getEntraDepartments(accessToken);
             const filtered = data.filter((item)=>item.Status === 'active')
             setDepartmentDataForNew(filtered);
             // initialize selections based on the filtered (active) list
             const mapped = filtered.map((item)=>({ id: String(item.Id), isActive: false }));
             setSelectedDepartmentsForNew(mapped);
          }
       
      } catch (error) {
        console.error("Error loading departments:", error);
        showToast(
          "error",
          "Error",
          "Failed to load departments. Please try again."
        );
      } finally {
        setIsLoadingDepartments(false);
      }
    };

  // Fetch existing custom permissions for reassignment
  const fetchExistingCustomPermissions = async (userRoleId: number) => {
    try {
      const response = await getUserRoleDetails(userRoleId);

      if (response.success && response.data) {
        const { customPermissions }: any = response.data;

        if (customPermissions) {
          setExistingCustomPermissions(
            JSON.parse(JSON.stringify(customPermissions))
          );
          return customPermissions;
        }
      }

      setExistingCustomPermissions(null);
      return null;
    } catch (error) {
      console.error("Error fetching existing custom permissions:", error);
      setExistingCustomPermissions(null);
      return null;
    }
  };

  // Handle role selection change in assign drawer
  const handleRoleSelectionChange = async (roleId: number) => {
    setSelectedRole(roleId);
    await fetchRolePermissions(roleId);
  };

  // Handle role selection change in edit drawer (template)
  const handleEditRoleTemplateChange = async (roleId: number) => {
    setSelectedEditRole(roleId);
    try {
      const response = await getRolePermissionsForAssignment(roleId);
      if (response.success && response.data) {
        setViewEditPermissions(
          JSON.parse(JSON.stringify(response.data.modules))
        );
        const hasChanges =
          JSON.stringify(response.data.modules) !==
          JSON.stringify(originalViewEditPermissions);
        setHasViewEditChanges(hasChanges);
      }
    } catch (error) {
      console.error("Error fetching role template:", error);
      showErrorToast("Failed to load role template");
    }
  };

  // Handle custom permissions change in assign drawer
  const handleCustomPermissionsChange = (updatedModules: Module[]) => {
    setCustomizedPermissions(updatedModules);
    const hasChanges =
      JSON.stringify(updatedModules) !==
      JSON.stringify(selectedRolePermissions);
    setHasPermissionChanges(hasChanges);
  };

  // Handle view/edit permissions change
  const handleViewEditPermissionsChange = (updatedModules: Module[]) => {
    setViewEditPermissions(updatedModules);
    const hasChanges =
      JSON.stringify(updatedModules) !==
      JSON.stringify(originalViewEditPermissions);
    setHasViewEditChanges(hasChanges);
  };

  // Open drawer for assigning role
  const openAssignDrawer = () => {
    setDrawerMode("assign");
    setIsReassignMode(false);
    setRoleToReassign(null);
    setExistingCustomPermissions(null);
    setIsDrawerOpen(true);
  };

  // Open drawer for reassigning role
  const openReassignDrawer = async (userRole: any) => {
    setRoleToReassign(userRole);
    setIsReassignMode(true);
    setDrawerMode("assign");

    if (userRole.isDepartmentRestricted) {
      setIsDepartmentalRestrictionForNew(true);
      // Await loading to ensure departmentDataForNew is available before mapping
      await loadDepartmentsForNew();

      const departmentResponse = await getUserDepartment(userRole.userId);
      if (departmentResponse.success) {
        // Use the loaded departmentDataForNew (or fallback to fetching if empty)
        const baseList = departmentDataForNew.length
          ? departmentDataForNew
          : accessToken
          ? (await getEntraDepartments(accessToken)).filter((item) => item.Status === "active")
          : [];

        const modified = baseList.map((item) => ({
          id: String(item.Id),
          isActive: !!departmentResponse.data.find(
            (sub: UserDepartment) => String(sub.DepartmentId) === String(item.Id)
          ),
        }));

        setSelectedDepartmentsForNew(modified);
      }
    }

    // If it's a custom role, fetch its custom permissions
    if (userRole.isCustomRole && userRole.customPermissionId) {
      await fetchExistingCustomPermissions(userRole.userRoleId);
      // Enable custom permissions toggle if it was a custom role
      setEnableCustomPermissions(true);
    } else {
      setExistingCustomPermissions(null);
      setEnableCustomPermissions(false);
    }

    setIsDrawerOpen(true);

    // Pre-select the current role (use base role ID for custom roles)
    const currentRoleId = userRole.isCustomRole
      ? userRole.baseRoleId || userRole.roleId
      : userRole.roleId;

    setSelectedRole(currentRoleId);

    // Set selected user based on userRole data
    setSelectedUser({
      id: userRole.userId,
      displayName: userRole.userName,
      email: userRole.userEmail,
      avatar: userRole.userAvatar,
    });

    // Load the role permissions (this will use existing custom permissions if available)
    await fetchRolePermissions(currentRoleId);
  };

  // Open drawer for viewing permissions
  const openViewDrawer = async (userRole: UserRole) => {
    setCurrentUserRole(userRole);
    setDrawerMode("view");
    setIsDrawerOpen(true);
    await fetchUserRoleDetails(userRole.userRoleId);
  };

  // Open drawer for editing permissions
  const openEditDrawer = async (userRole: UserRole) => {
    setCurrentUserRole(userRole);
    setDrawerMode("edit");
    setIsDrawerOpen(true);
    await fetchUserRoleDetails(userRole.userRoleId);
  };

  // Save edited permissions
  const saveEditedPermissions = async () => {
    try {
      if (!customPermissionId) {
        showErrorToast("No custom permission to update");
        return;
      }

      setIsSavingPermissions(true);

      const response = await updateCustomPermission(
        customPermissionId,
        viewEditPermissions,
        currentUser.userID,
        isDepartmentalRestriction,
        selectedDepartmets
      );

      if (response.success) {
        showSuccessToast("Permissions updated successfully");
        closeDrawer();
        fetchUserRoles(); // Refresh the list
      } else {
        showErrorToast(response.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      showErrorToast("Failed to save permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Assign role to user
  const assignRoleToUser = async () => {
    try {
      if (!selectedUser || !selectedRole) {
        showErrorToast("Please select both a user and a role");
        return;
      }

      setIsAssigningRole(true);

      const isCustomRole = enableCustomPermissions && hasPermissionChanges;
      let customRoleName = undefined;

      if (isCustomRole) {
        // Generate custom role name with user's name
        customRoleName = `Custom Role_${selectedUser.displayName}`;
      }

      const response = await assignRoleWithCustomPermissions({
        userId: selectedUser.id,
        roleId: selectedRole,
        assignedBy: currentUser.userID,
        isCustomRole: isCustomRole,
        customPermissions: isCustomRole ? customizedPermissions : undefined,
        customRoleName: customRoleName,
        isDepartmentRestricted: isDepartmentalRestrictionForNew,
        restrictedDepartments: selectedDepartmetsForNew
      });

      if (response.success) {
        const roleMessage = isCustomRole
          ? `Custom role "${customRoleName}" successfully assigned to ${selectedUser.displayName}`
          : `Role successfully assigned to ${selectedUser.displayName}`;
        showSuccessToast(roleMessage);
        fetchUserRoles();
        closeDrawer();
      } else {
        showErrorToast(response.message || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      showErrorToast("Failed to assign role to user");
    } finally {
      setIsAssigningRole(false);
    }
  };

  // Handle reassignment
  // Handle reassignment
  const handleReassignRole = async () => {
    try {
      if (!roleToReassign || !selectedRole) {
        showErrorToast("Please select a role");
        return;
      }

      setIsAssigningRole(true);

      // Determine if we're creating a custom role or converting to base
      const willBeCustomRole =
        enableCustomPermissions &&
        (hasPermissionChanges ||
          (roleToReassign.isCustomRole && existingCustomPermissions !== null));

      // IMPORTANT: Check if converting from custom to base (disabling customization)
      if (roleToReassign.isCustomRole && !enableCustomPermissions) {
        // Converting custom role to base role
        // console.log("Converting custom role to base role");
        const response = await convertToBaseRole({
          userRoleId: roleToReassign.userRoleId,
          newRoleId: selectedRole,
          updatedBy: currentUser.userID,
        });

        if (response.success) {
          showSuccessToast(
            `Successfully converted to base role for ${roleToReassign.userName}`
          );
          fetchUserRoles();
          closeDrawer();
        } else {
          showErrorToast(response.message || "Failed to convert role");
        }
      } else if (!willBeCustomRole && !roleToReassign.isCustomRole) {
        // Base role to base role reassignment (simple update)
        // console.log("Reassigning base role to base role");
        const response = await reassignUserRole({
          userRoleId: roleToReassign.userRoleId,
          newRoleId: selectedRole,
          reassignedBy: currentUser.userID,
          isCustomRole: false,
          customPermissions: undefined,
          customRoleName: undefined,
          isDepartmentRestricted: isDepartmentalRestrictionForNew,
          restrictedDepartments: selectedDepartmetsForNew
        });

        if (response.success) {
          showSuccessToast(
            `Role successfully reassigned to ${roleToReassign.userName}`
          );
          fetchUserRoles();
          closeDrawer();
        } else {
          showErrorToast(response.message || "Failed to reassign role");
        }
      } else {
        // Normal reassignment with custom permissions
        // console.log("Reassigning with custom permissions");
        let customRoleName = undefined;

        if (willBeCustomRole) {
          customRoleName = `Custom Role_${roleToReassign.userName}`;
        }

        const response = await reassignUserRole({
          userRoleId: roleToReassign.userRoleId,
          newRoleId: selectedRole,
          reassignedBy: currentUser.userID,
          isCustomRole: willBeCustomRole,
          customPermissions: willBeCustomRole
            ? customizedPermissions
            : undefined,
          customRoleName: customRoleName,
          isDepartmentRestricted: isDepartmentalRestrictionForNew,
          restrictedDepartments: selectedDepartmetsForNew
        });

        if (response.success) {
          const message = willBeCustomRole
            ? `Custom role "${customRoleName}" successfully reassigned to ${roleToReassign.userName}`
            : `Role successfully reassigned to ${roleToReassign.userName}`;
          showSuccessToast(message);
          fetchUserRoles();
          closeDrawer();
        } else {
          showErrorToast(response.message || "Failed to reassign role");
        }
      }
    } catch (error) {
      console.error("Error reassigning role:", error);
      showErrorToast("Failed to reassign role");
    } finally {
      setIsAssigningRole(false);
    }
  };
  // Remove role from user
  const removeRoleFromUser = async () => {
    try {
      if (!userRoleToDelete) return;

      setIsRemovingRole(true);

      const response = await removeUserRole(
        userRoleToDelete.userRoleId,
        currentUser.userID
      );

      if (response.success) {
        showSuccessToast(`Role removed from ${userRoleToDelete.userName}`);
        fetchUserRoles();
        setIsConfirmDeleteOpen(false);
        setUserRoleToDelete(null);
      } else {
        showErrorToast(response.message || "Failed to remove role");
      }
    } catch (error) {
      console.error("Error removing role:", error);
      showErrorToast("Failed to remove role from user");
    } finally {
      setIsRemovingRole(false);
    }
  };

  // Close drawer and reset state
  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setDrawerMode(null);
    setIsReassignMode(false);
    setRoleToReassign(null);
    setExistingCustomPermissions(null);

    // Reset assign states
    setSelectedUser(null);
    setSelectedRole(null);
    setSelectedRolePermissions([]);
    setCustomizedPermissions([]);
    setEnableCustomPermissions(false);
    setHasPermissionChanges(false);

    // Reset view/edit states
    setCurrentUserRole(null);
    setViewEditPermissions([]);
    setOriginalViewEditPermissions([]);
    setBaseRoleName("");
    setCustomPermissionId(null);
    setHasViewEditChanges(false);
    setSelectedEditRole(null);
    setUseRoleTemplate(false);

    // Reset departmental access state when closing the drawer so stale
    // department selections don't persist across open/close cycles.
    setIsDepartmentalRestriction(false);
    setSelectedDepartments(
      departmentData && departmentData.length
        ? departmentData.map((d) => ({ id: String(d.Id), isActive: false }))
        : []
    );
    setIsDepartmentalRestrictionForNew(false)
    setSelectedDepartmentsForNew(
      departmentDataForNew && departmentDataForNew.length
        ? departmentDataForNew.map((d) => ({ id: String(d.Id), isActive: false }))
        : []
    );
  };

  // Load initial data
  useEffect(() => {
    fetchRoles();
    fetchUserRoles();
  }, []);

  // Apply filtering and sorting
  useEffect(() => {
    let filtered = [...userRoles];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((userRole) => {
        const searchableFields = [
          userRole.userName,
          userRole.userEmail,
          userRole.roleName,
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;

        if (sortConfig.key === "assignedAt") {
          comparison =
            new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    setFilteredUserRoles(filtered);

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    setPagination((prev) => ({
      ...prev,
      totalCount,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [userRoles, searchQuery, sortConfig, pagination.pageSize]);

  // Apply pagination
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredUserRoles.slice(startIndex, endIndex);
    setPaginatedUserRoles(paginated);
  }, [filteredUserRoles, pagination.currentPage, pagination.pageSize]);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSort = (key: keyof UserRole) => {
    setSortConfig((prevSort) => {
      if (prevSort && prevSort.key === key) {
        return {
          key,
          direction: prevSort.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalCount / itemsPerPage),
    }));
  };

  // Toast notifications
  const showSuccessToast = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle media={<CheckmarkCircle24Filled />}>Success</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "success", timeout: 3000 }
    );
  };

  const showErrorToast = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle media={<ErrorCircle24Filled />}>Error</ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "error", timeout: 4000 }
    );
  };

  // Get drawer title based on mode
  const getDrawerTitle = () => {
    switch (drawerMode) {
      case "assign":
        return isReassignMode ? "Reassign Role" : "User Role Assignment";
      case "view":
        return "View Permissions";
      case "edit":
        return "Edit Permissions";
      default:
        return "";
    }
  };

  // Render drawer content based on mode
  const renderDrawerContent = () => {
    if (drawerMode === "assign") {
      return (
        <>
          {isReassignMode && roleToReassign && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorBrandBackground2 }}
            >
              <Text weight="semibold">Current Assignment:</Text>
              <div className="mt-2">
                <Caption1 className="block">
                  User: {roleToReassign.userName}
                </Caption1>
                <Caption1 className="block">
                  Current Role: {roleToReassign.roleName}
                </Caption1>
                {roleToReassign.isCustomRole && (
                  <Badge appearance="filled" color="brand" className="mt-1">
                    Custom Role
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!isReassignMode && (
            <div>
              <Label weight="semibold">Select User</Label>
              <div className="mt-2">
                <PeoplePicker
                  placeholder="Search for a user..."
                  selectedPerson={selectedUser}
                  onSelectionChanged={setSelectedUser}
                  minSearchLength={2}
                />
              </div>
            </div>
          )}

          {(selectedUser || isReassignMode) && (
            <div>
              <Label weight="semibold">
                {isReassignMode ? "Select New Role" : "Select Role"}
              </Label>
              <div className="mt-2">
                <Dropdown
                  placeholder="Select a role to assign"
                  value={
                    selectedRole
                      ? availableRoles.find((r) => r.roleId === selectedRole)
                          ?.name || ""
                      : ""
                  }
                  onOptionSelect={(_, data) =>
                    handleRoleSelectionChange(Number(data.optionValue))
                  }
                  disabled={isLoadingRolePermissions}
                >
                  {availableRoles.map((role) => (
                    <Option
                      text={role.name}
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      <div className="flex items-center">
                        {role.isAdmin && (
                          <Badge
                            className="mr-2"
                            appearance="filled"
                            color="warning"
                          >
                            Admin
                          </Badge>
                        )}
                        <span>{role.name}</span>
                      </div>
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </div>
          )}

          {isReassignMode &&
            roleToReassign?.isCustomRole &&
            selectedRole &&
            !enableCustomPermissions && (
              <div
                className={styles.infoBox}
                style={{
                  backgroundColor: tokens.colorPaletteYellowBackground2,
                }}
              >
                <Text
                  weight="semibold"
                  style={{ color: tokens.colorPaletteYellowForeground1 }}
                >
                  ⚠️ Converting Custom Role to Base Role
                </Text>
                <Text
                  style={{ color: tokens.colorPaletteYellowForeground1 }}
                  className="block mt-1"
                >
                  The user's custom permissions will be replaced with the
                  selected base role's permissions. This action will deactivate
                  the custom role.
                </Text>
              </div>
            )}

          {selectedRole && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorNeutralBackground3 }}
            >
              <Text weight="semibold">Role Description:</Text>&nbsp;
              <Text className="block mt-1">
                {availableRoles.find((r) => r.roleId === selectedRole)
                  ?.description || "No description available"}
              </Text>
            </div>
          )}

          {selectedRole && !isLoadingRolePermissions && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorBrandBackground2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <Text weight="semibold">Customize Permissions</Text>
                  <div>
                    <Caption1 className="block mt-1">
                      Enable to modify permissions for this user only
                    </Caption1>
                  </div>
                </div>
                <Switch
                  checked={enableCustomPermissions}
                  onChange={(_, data) =>
                    setEnableCustomPermissions(data.checked)
                  }
                />
              </div>
            </div>
          )}

          {selectedRole &&
            enableCustomPermissions &&
            !isLoadingRolePermissions && (
              <div>
                <Label weight="semibold">Customize Permissions</Label>
                <div>&nbsp;</div>
                <div className={styles.permissionEditorContainer}>
                  <CustomPermissionEditor
                    modules={customizedPermissions}
                    onPermissionsChange={handleCustomPermissionsChange}
                    baseRoleName={
                      availableRoles.find((r) => r.roleId === selectedRole)
                        ?.name || ""
                    }
                  />
                </div>
                {(hasPermissionChanges ||
                  (isReassignMode && existingCustomPermissions)) && (
                  <div
                    className="mt-2 p-2 rounded-lg"
                    style={{
                      backgroundColor: tokens.colorPaletteYellowBackground2,
                    }}
                  >
                    <Caption1
                      style={{ color: tokens.colorPaletteYellowForeground1 }}
                    >
                      ⚠️{" "}
                      {hasPermissionChanges
                        ? `You have modified the permissions. A custom role will be ${
                            isReassignMode ? "reassigned" : "created"
                          } for this user.`
                        : `Existing custom permissions are loaded. You can modify them or disable customization to use the base role.`}
                    </Caption1>
                  </div>
                )}
              </div>
            )}

          {/* Department Filter */}
          {selectedRole && ( <div
            className={styles.infoBox}
            style={{ backgroundColor: "rgba(255, 215, 0, 0.1)"}}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <Text weight="semibold">Departmental Access Restriction</Text>
                <div>
                  <Caption1 className="block mt-1">
                    Limits visibility or actions to a specific department.
                  </Caption1>
                </div>
              </div>
              <Switch
                checked={isDepartmentalRestrictionForNew}
                onChange={()=>handleDepartmentAccessChangeForNew()}
              />
            </div>
            {

             isDepartmentalRestrictionForNew && ( <div className="flex flex-col gap-3">

              {
                isLoadingDepartments?
                <div className="w-full flex justify-center">
                <Spinner size="medium"/>
                </div>
                :
                departmentDataForNew.filter((item)=>item.Status==="active"&&item.Code).map((item)=>(
                  <Checkbox
                    key={String(item.Id)}
                    checked={!!selectedDepartmetsForNew.find(sub => sub.id === String(item.Id))?.isActive}
                    label={item.Name}
                    onChange={()=>handleSelectDepartmentForNew(String(item.Id))}
                    className="!text-gray-800 !font-medium"
                  />
                ))
              }
              
            </div>)
            }
            
          </div>)
}

          {isLoadingRolePermissions && (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Spinner />
              <Body1Strong className="mt-2">
                Loading role permissions...
              </Body1Strong>
            </div>
          )}

          {!isReassignMode && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorPaletteYellowBackground2 }}
            >
              <Text
                weight="semibold"
                style={{ color: tokens.colorPaletteYellowForeground1 }}
              >
                Note:
              </Text>{" "}
              &nbsp;
              <Caption1
                style={{ color: tokens.colorPaletteYellowForeground1 }}
                className="block mt-1"
              >
                Each user can have only one role. If the selected user already
                has a role, it will be replaced with the new assignment.
              </Caption1>
            </div>
          )}
        </>
      );
    }

    if (drawerMode === "view") {
      return (
        <>
          {currentUserRole && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorBrandBackground2 }}
            >
              <div>
                <Text weight="semibold">User: {currentUserRole.userName}</Text>
                <div>
                  <Caption1 className="block mt-1">
                    Role: {currentUserRole.roleName}
                    {currentUserRole.isCustomRole && " (Custom)"}
                  </Caption1>
                </div>

                {baseRoleName && currentUserRole.isCustomRole && (
                  <Caption1 className="block mt-1">
                    Base Role: {baseRoleName}
                  </Caption1>
                )}
              </div>
            </div>
          )}

          {isLoadingViewEditPermissions ? (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Spinner />
              <Body1Strong className="mt-2">Loading permissions...</Body1Strong>
            </div>
          ) : (
            <div>
              <Label weight="semibold">Permissions</Label>
              <br />
              <div>&nbsp;</div>
              <CustomPermissionEditor
                modules={viewEditPermissions}
                onPermissionsChange={() => {}}
                baseRoleName={baseRoleName}
                isReadOnly={true}
              />
            </div>
          )}
        </>
      );
    }

    if (drawerMode === "edit") {
      return (
        <>
          {currentUserRole && (
            <div
              className={styles.infoBox}
              style={{ backgroundColor: tokens.colorBrandBackground2 }}
            >
              <div>
                <Text weight="semibold">User: {currentUserRole.userName}</Text>
                <div>
                  <Caption1 className="block mt-1">
                    Role: {currentUserRole.roleName}
                    {currentUserRole.isCustomRole && " (Custom)"}
                  </Caption1>
                </div>

                {baseRoleName && (
                  <Caption1 className="block mt-1">
                    Base Role: {baseRoleName}
                  </Caption1>
                )}
              </div>
            </div>
          )}

          {/* Role Template Selector */}
          <div
            className={styles.infoBox}
            style={{ backgroundColor: tokens.colorNeutralBackground3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <Text weight="semibold">Use Role Template</Text>
                <div>
                  <Caption1 className="block mt-1">
                    Load permissions from an existing role
                  </Caption1>
                </div>
              </div>
              <Switch
                checked={useRoleTemplate}
                onChange={(_, data) => {
                  setUseRoleTemplate(data.checked);
                  if (!data.checked) {
                    setSelectedEditRole(null);
                    setViewEditPermissions(
                      JSON.parse(JSON.stringify(originalViewEditPermissions))
                    );
                    setHasViewEditChanges(false);
                  }
                }}
              />
            </div>

            {useRoleTemplate && (
              <div className="mt-2">
                <Dropdown
                  placeholder="Select a role template"
                  value={
                    selectedEditRole
                      ? availableRoles.find(
                          (r) => r.roleId === selectedEditRole
                        )?.name || ""
                      : ""
                  }
                  onOptionSelect={(_, data) =>
                    handleEditRoleTemplateChange(Number(data.optionValue))
                  }
                >
                  {availableRoles.map((role) => (
                    <Option
                      text={role.name}
                      key={role.roleId}
                      value={role.roleId.toString()}
                    >
                      <div className="flex items-center">
                        {role.isAdmin && (
                          <Badge
                            className="mr-2"
                            appearance="filled"
                            color="warning"
                          >
                            Admin
                          </Badge>
                        )}
                        <span>{role.name}</span>
                      </div>
                    </Option>
                  ))}
                </Dropdown>
              </div>
            )}
          </div>

          {/* Department Filter */}
           <div
            className={styles.infoBox}
            style={{ backgroundColor: "rgba(255, 215, 0, 0.1)"}}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <Text weight="semibold">Departmental Access Restriction</Text>
                <div>
                  <Caption1 className="block mt-1">
                    Limits visibility or actions to a specific department.
                  </Caption1>
                </div>
              </div>
              <Switch
                checked={isDepartmentalRestriction}
                onChange={()=>handleDepartmentAccessChange()}
              />
            </div>
            {

             isDepartmentalRestriction && ( <div className="flex flex-col gap-3">

              {
                isLoadingDepartments?
                <div className="w-full flex justify-center">
                <Spinner size="medium"/>
                </div>
                :
                departmentData.filter((item)=>item.Status==="active"&&item.Code).map((item)=>(
                  <Checkbox
                    key={String(item.Id)}
                    checked={!!selectedDepartmets.find(sub => sub.id === String(item.Id))?.isActive}
                    label={item.Name}
                    onChange={()=>handleSelectDepartment(String(item.Id))}
                    className="!text-gray-800 !font-medium"
                  />
                ))
              }
              
            </div>)
            }
            
          </div>

          {isLoadingViewEditPermissions ? (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Spinner />
              <Body1Strong className="mt-2">Loading permissions...</Body1Strong>
            </div>
          ) : (
            <div>
              <Label weight="semibold">Permissions</Label>
              <br />
              <div>&nbsp;</div>
              <CustomPermissionEditor
                modules={viewEditPermissions}
                onPermissionsChange={handleViewEditPermissionsChange}
                baseRoleName={baseRoleName}
                isReadOnly={false}
              />
            </div>
          )}

          {hasViewEditChanges && (
            <div
              className="mt-2 p-2 rounded-lg"
              style={{ backgroundColor: tokens.colorPaletteYellowBackground2 }}
            >
              <Caption1 style={{ color: tokens.colorPaletteYellowForeground1 }}>
                ⚠️ You have unsaved changes. Click "Save Changes" to update the
                permissions.
              </Caption1>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  // Render drawer footer based on mode
  const renderDrawerFooter = () => {
    if (drawerMode === "assign") {
      return (
        <DrawerFooter>
          <Button
            appearance="secondary"
            onClick={closeDrawer}
            disabled={isAssigningRole}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={isReassignMode ? handleReassignRole : assignRoleToUser}
            disabled={
              (!selectedUser && !isReassignMode) ||
              !selectedRole ||
              isAssigningRole
            }
          >
            {isAssigningRole
              ? isReassignMode
                ? "Reassigning..."
                : "Assigning..."
              : isReassignMode
              ? "Reassign Role"
              : "Assign Role"}
          </Button>
        </DrawerFooter>
      );
    }

    if (drawerMode === "view") {
      return (
        <DrawerFooter>
          <Button appearance="primary" onClick={closeDrawer}>
            Close
          </Button>
        </DrawerFooter>
      );
    }

    if (drawerMode === "edit") {
      return (
        <DrawerFooter>
          <Button
            appearance="secondary"
            onClick={closeDrawer}
            disabled={isSavingPermissions}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={saveEditedPermissions}
            disabled={!hasViewEditChanges || isSavingPermissions}
            icon={<SaveRegular />}
          >
            {isSavingPermissions ? "Saving..." : "Save Changes"}
          </Button>
        </DrawerFooter>
      );
    }

    return null;
  };

  if (isLoadingUserRoles && userRoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading user roles...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider className="!bg-transparent">
      <div className="space-y-4 min-h-screen mx-auto ">
        {/* Header */}
        <div className="flex justify-between items-center ">
          <div>
            <Subtitle2 className="text-gray-800">
              User Roles & Permissions
            </Subtitle2>
            <div>
              {" "}
              <Caption1 className="text-gray-600">
                Assign and manage roles with customizable permissions for users
              </Caption1>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="flex items-center gap-4 w-full md:w-1/4">
            <div className="relative w-full">
              <SearchBox
                className={`w-full transition-all duration-200 !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                placeholder="Search by name, code, country..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              appearance="primary"
              onClick={openAssignDrawer}
              shape="circular"
              icon={
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                  <Add24Regular />
                </div>
              }
              className=" hover:bg-indigo-700 shadow  !bg-white/50 !text-[#626262] border-1 !border-white"
            >
              Assign Role
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
          <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                <TableRow className="border-b-2 border-gray-100">
                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("userName")}
                  >
                    <div className="flex items-center gap-2 ml-5">
                      <Body1Strong className="text-gray-900">User</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === "userName" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("roleName")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">Role</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === "roleName" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("assignedBy")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">
                        Assigned By
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === "assignedBy" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("assignedAt")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">
                        Assigned Date
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig.key === "assignedAt" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell className="!py-3 !px-3">
                    <Body1Strong className="text-gray-900">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedUserRoles.map((userRole, index) => (
                  <TableRow
                    key={userRole.userRoleId}
                    className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <TableCell className="px-6 !py-5 !truncate !text-ellipsis">
                      <div className="flex items-center gap-3 !text-ellipsis">
                        <Persona
                          name={userRole.userName}
                          secondaryText={userRole.userEmail}
                          avatar={{
                            image: userRole.userAvatar
                              ? { src: userRole.userAvatar }
                              : undefined,
                          }}
                          size="medium"
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {userRole.isCustomRole ? (
                          <Badge
                            appearance="filled"
                            color="brand"
                            className="bg-blue-600 text-white shadow-none"
                          >
                            {userRole.roleName}
                          </Badge>
                        ) : userRole.isAdmin ? (
                          <Badge
                            appearance="filled"
                            color="warning"
                            className="bg-amber-500 text-white shadow-none"
                          >
                            {userRole.roleName}
                          </Badge>
                        ) : (
                          <Badge
                            appearance="filled"
                            color="informative"
                            className="bg-indigo-500 text-white shadow-none"
                          >
                            {userRole.roleName}
                          </Badge>
                        )}
                      </div>
                      {userRole.roleDescription && (
                        <Text
                          size={200}
                          className="text-gray-600 max-w-48 truncate block mt-1"
                        >
                          {userRole.roleDescription}
                        </Text>
                      )}
                    </TableCell>

                    <TableCell>
                      <Text className="font-semibold text-gray-900">
                        {userRole.assignedByName}
                      </Text>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarRegular className="w-4 h-4 text-gray-400" />
                        <Text size={200} className="text-gray-700 font-medium">
                          {formatDate(userRole.assignedAt)}
                        </Text>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          appearance="subtle"
                          icon={<EyeRegular />}
                          onClick={() => openViewDrawer(userRole)}
                          className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                          title="View permissions"
                          aria-label={`View permissions for ${userRole.userName}`}
                        />
                        <Button
                          appearance="subtle"
                          icon={<Edit24Regular />}
                          onClick={() => {
                            if (userRole.isCustomRole) {
                              openEditDrawer(userRole);
                            } else {
                              openReassignDrawer(userRole);
                            }
                          }}
                          className="w-8 h-8 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 rounded-lg"
                          title={
                            userRole.isCustomRole
                              ? "Edit custom permissions"
                              : "Reassign role"
                          }
                          aria-label={`Edit ${userRole.userName}`}
                        />
                        <Button
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          onClick={() => {
                            setUserRoleToDelete(userRole);
                            setIsConfirmDeleteOpen(true);
                          }}
                          className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                          title="Remove role"
                          aria-label={`Delete ${userRole.userName}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {paginatedUserRoles.length === 0 && !isLoadingUserRoles && (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <PeopleTeamRegular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">
                No user role assignments found
              </Subtitle2>
              <div className="text-center">
                <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery
                    ? "We couldn't find any user roles matching your criteria. Try adjusting your search."
                    : "Get started by assigning roles to users."}
                </Text>
              </div>
              {searchQuery ? (
                <Button
                  appearance="primary"
                  onClick={() => setSearchQuery("")}
                  className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  onClick={openAssignDrawer}
                  className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 bg-blue-600 hover:bg-blue-700"
                  icon={<AddRegular />}
                >
                  Assign Your First Role
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          {paginatedUserRoles.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
              <div className="flex items-center justify-between">
                <Caption1 className="text-gray-600 font-medium">
                  Showing{" "}
                  {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    filteredUserRoles.length
                  )}{" "}
                  of {filteredUserRoles.length} results
                </Caption1>
                <CustomPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={pagination.pageSize}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Overlay Drawer for Assign/View/Edit */}
        <OverlayDrawer
          position="end"
          open={isDrawerOpen}
          onOpenChange={(_, { open }) => {
            if (!open) {
              closeDrawer();
            }
          }}
          size="large"
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<DismissRegular />}
                  onClick={closeDrawer}
                />
              }
            >
              {getDrawerTitle()}
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody className={styles.drawerBody}>
            <div className={styles.drawerContent}>{renderDrawerContent()}</div>
          </DrawerBody>

          {renderDrawerFooter()}
        </OverlayDrawer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isConfirmDeleteOpen}
          onOpenChange={(_, data) => setIsConfirmDeleteOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Remove Role</DialogTitle>
              <DialogContent>
                <div className="space-y-4">
                  <Text>
                    Are you sure you want to remove the role "
                    {userRoleToDelete?.roleName}" from user "
                    {userRoleToDelete?.userName}"?
                  </Text>
                  {userRoleToDelete?.isCustomRole && (
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: tokens.colorPaletteYellowBackground2,
                      }}
                    >
                      <Text
                        weight="semibold"
                        style={{ color: tokens.colorPaletteYellowForeground1 }}
                      >
                        Note:
                      </Text>
                      <Text
                        style={{ color: tokens.colorPaletteYellowForeground1 }}
                        className="block mt-1"
                      >
                        This is a custom role. The customized permissions will
                        also be removed.
                      </Text>
                    </div>
                  )}
                  <Text weight="semibold" className="text-red-600">
                    This action cannot be undone.
                  </Text>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => {
                    setIsConfirmDeleteOpen(false);
                    setUserRoleToDelete(null);
                  }}
                  disabled={isRemovingRole}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={removeRoleFromUser}
                  disabled={isRemovingRole}
                >
                  {isRemovingRole ? "Removing..." : "Remove Role"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default UserRoleAssignmentDashboard;

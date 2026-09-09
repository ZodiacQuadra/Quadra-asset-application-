// components/RolePermissionConfig.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Dropdown,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Label,
  Checkbox,
  Radio,
  RadioGroup,
  Spinner,
  FluentProvider,
  webLightTheme,
  Toast,
  Toaster,
  ToastTitle,
  ToastBody,
  useToastController,
  useId,
  Badge,
  Body1,
  Caption1,
  Subtitle2,
  Body1Strong,
} from "@fluentui/react-components";
import {
  ChevronDownRegular,
  ChevronRightRegular,
  SaveRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  CheckmarkCircle24Filled,
  ErrorCircle24Filled,
  Settings24Regular,
  Shield24Regular,
} from "@fluentui/react-icons";
import {
  Module,
  Entity,
  Action,
  SubAction,
  Role,
  getPermissionStructure,
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../../Services/Permissions";

export const RolePermissionConfig: React.FC = () => {
  // State management
  const [modules, setModules] = useState<Module[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [editRoleName, setEditRoleName] = useState("");
  const [editRoleDescription, setEditRoleDescription] = useState("");

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Helper function to determine if entity should be in right column
  const isRightColumnEntity = (
    moduleId: string,
    entityKey: string
  ): boolean => {
    const rightColumnEntities: Record<string, string[]> = {
      recruit: ["hiring_template", "location", "department","hr_mapping"],
      onboarding: ["induction_tasks"],
      background_verification: ["document_management"],
      offboarding: [
        "it_activity_management",
        "admin_activity_management",
        "finance_activity_management",
      ],
      attendance:['approval_exception','escalation_exception','checkin_exception']
    };

    return rightColumnEntities[moduleId]?.includes(entityKey) || false;
  };

  // Helper function to split entities into left and right columns
  const splitEntitiesIntoColumns = (moduleId: string, entities: Entity[]) => {
    const leftColumn: Entity[] = [];
    const rightColumn: Entity[] = [];

    entities.forEach((entity) => {
      if (isRightColumnEntity(moduleId, entity.id)) {
        rightColumn.push(entity);
      } else {
        leftColumn.push(entity);
      }
    });

    return { leftColumn, rightColumn };
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [structureResponse, rolesResponse] = await Promise.all([
        getPermissionStructure(),
        getRoles(),
      ]);

      if (structureResponse.success && structureResponse.data) {
        setModules(structureResponse.data);
      }

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);
      }
    } catch (error) {
      showErrorToast("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: number) => {
    setLoading(true);
    try {
      const response = await getRole(roleId);
      if (response.success && response.data && response.data.modules) {
        setModules(response.data.modules);
        setSelectedRoleId(roleId);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      showErrorToast("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  // Toast helpers
  const showSuccessToast = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={<CheckmarkCircle24Filled style={{ color: "#16a34a" }} />}
        >
          Success
        </ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "success", timeout: 3000 }
    );
  };

  const showErrorToast = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={<ErrorCircle24Filled style={{ color: "#dc2626" }} />}
        >
          Error
        </ToastTitle>
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: "error", timeout: 4000 }
    );
  };

  // Toggle handlers
  const toggleModule = (moduleId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? { ...module, expanded: !module.expanded }
          : module
      )
    );
  };

  const toggleEntity = (moduleId: string, entityId: string) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              entities: module.entities.map((entity) =>
                entity.id === entityId
                  ? { ...entity, expanded: !entity.expanded }
                  : entity
              ),
            }
          : module
      )
    );
  };

  const toggleAction = (
    moduleId: string,
    entityId: string,
    actionId: string
  ) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              entities: module.entities.map((entity) =>
                entity.id === entityId
                  ? {
                      ...entity,
                      actions: entity.actions?.map((action) =>
                        action.id === actionId
                          ? { ...action, expanded: !action.expanded }
                          : action
                      ),
                    }
                  : entity
              ),
            }
          : module
      )
    );
  };

  // Checkbox handlers
  const handleModuleCheck = (moduleId: string, checked: boolean) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            checked: checked,
            entities: module.entities.map((entity) => ({
              ...entity,
              checked: checked,
              actions: entity.actions?.map((action) => ({
                ...action,
                checked: checked,
                subActions: action.subActions?.map((sub) => ({
                  ...sub,
                  checked: checked,
                })),
              })),
              subActions: entity.subActions?.map((sub, index) => ({
                ...sub,
                checked: checked && index === 0,
              })),
            })),
          };
        }
        return module;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleEntityCheck = (
    moduleId: string,
    entityId: string,
    checked: boolean
  ) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity) => {
            if (entity.id === entityId) {
              let updatedSubActions = entity.subActions;
              if (
                checked &&
                entity.subActions &&
                entity.subActions.length > 0
              ) {
                updatedSubActions = entity.subActions.map((sub, index) => ({
                  ...sub,
                  checked: index === 0,
                }));
              } else if (!checked && entity.subActions) {
                updatedSubActions = entity.subActions.map((sub) => ({
                  ...sub,
                  checked: false,
                }));
              }

              return {
                ...entity,
                checked: checked,
                actions: entity.actions?.map((action) => ({
                  ...action,
                  checked: checked,
                  subActions: action.subActions?.map((sub, index) => ({
                    ...sub,
                    checked: checked && index === 0,
                  })),
                })),
                subActions: updatedSubActions,
              };
            }
            return entity;
          });

          const allChecked = updatedEntities.every((e) => e.checked);
          const someChecked = updatedEntities.some((e) => e.checked);

          return {
            ...module,
            entities: updatedEntities,
            checked: allChecked || someChecked,
          };
        }
        return module;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleActionCheck = (
    moduleId: string,
    entityId: string,
    actionId: string,
    checked: boolean
  ) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity) => {
            if (entity.id === entityId) {
              const updatedActions = entity.actions?.map((action) => {
                if (action.id === actionId) {
                  let updatedSubActions = action.subActions;
                  if (
                    checked &&
                    action.subActions &&
                    action.subActions.length > 0
                  ) {
                    updatedSubActions = action.subActions.map((sub, index) => ({
                      ...sub,
                      checked: index === 0,
                    }));
                  } else if (!checked && action.subActions) {
                    updatedSubActions = action.subActions.map((sub) => ({
                      ...sub,
                      checked: false,
                    }));
                  }

                  return {
                    ...action,
                    checked: checked,
                    subActions: updatedSubActions,
                  };
                }
                return action;
              });

              const allActionsChecked =
                updatedActions?.every((a) => a.checked) ?? false;
              const someActionsChecked =
                updatedActions?.some((a) => a.checked) ?? false;

              return {
                ...entity,
                actions: updatedActions,
                checked: allActionsChecked || someActionsChecked,
              };
            }
            return entity;
          });

          const allEntitiesChecked = updatedEntities.every((e) => e.checked);
          const someEntitiesChecked = updatedEntities.some((e) => e.checked);

          return {
            ...module,
            entities: updatedEntities,
            checked: allEntitiesChecked || someEntitiesChecked,
          };
        }
        return module;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleSubActionRadioChange = (
    moduleId: string,
    entityId: string,
    actionId: string | null,
    selectedSubActionId: string
  ) => {
    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity) => {
            if (entity.id === entityId) {
              if (actionId === null && entity.subActions) {
                const updatedSubActions = entity.subActions.map((sub) => ({
                  ...sub,
                  checked: sub.id === selectedSubActionId,
                }));

                return {
                  ...entity,
                  subActions: updatedSubActions,
                  checked: true,
                };
              }

              if (actionId && entity.actions) {
                const updatedActions = entity.actions.map((action) => {
                  if (action.id === actionId) {
                    const updatedSubActions = action.subActions?.map((sub) => ({
                      ...sub,
                      checked: sub.id === selectedSubActionId,
                    }));

                    return {
                      ...action,
                      subActions: updatedSubActions,
                      checked: true,
                    };
                  }
                  return action;
                });

                const someActionsChecked = updatedActions.some(
                  (a) => a.checked
                );

                return {
                  ...entity,
                  actions: updatedActions,
                  checked: someActionsChecked,
                };
              }
            }
            return entity;
          });

          const someEntitiesChecked = updatedEntities.some((e) => e.checked);

          return {
            ...module,
            entities: updatedEntities,
            checked: someEntitiesChecked,
          };
        }
        return module;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Role management handlers
  const handleRoleChange = (_: any, data: any) => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Do you want to discard them?"
      );
      if (!confirm) return;
    }
    const roleId = parseInt(data.optionValue);
    if (roleId) {
      loadRolePermissions(roleId);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      showErrorToast("Please select a role first");
      return;
    }

    setLoading(true);
    try {
      const currentUser = localStorage.getItem("username") || "system";
      const selectedRole = roles.find((r) => r.roleId === selectedRoleId);

      if (!selectedRole) return;

      await updateRole(selectedRoleId, {
        name: selectedRole.name,
        description: selectedRole.description,
        isAdmin: selectedRole.isAdmin,
        modules: modules,
        modifiedBy: currentUser,
      });

      showSuccessToast("Permissions have been updated successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      showErrorToast("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      showErrorToast("Role name is required");
      return;
    }

    setLoading(true);
    try {
      const currentUser = localStorage.getItem("username") || "system";
      const structureResponse = await getPermissionStructure();

      const response = await createRole({
        name: newRoleName,
        description: newRoleDescription,
        modules: structureResponse.data || [],
        createdBy: currentUser,
      });

      if (response.success) {
        showSuccessToast("Role created successfully");
        setIsCreateDialogOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
        await loadInitialData();
        if (response.data?.roleId) {
          loadRolePermissions(response.data.roleId);
        }
      }
    } catch (error) {
      showErrorToast("Failed to create role");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = async () => {
    if (!selectedRoleId || !editRoleName.trim()) {
      showErrorToast("Role name is required");
      return;
    }

    setLoading(true);
    try {
      const currentUser = localStorage.getItem("username") || "system";
      const selectedRole = roles.find((r) => r.roleId === selectedRoleId);

      if (!selectedRole) return;

      await updateRole(selectedRoleId, {
        name: editRoleName,
        description: editRoleDescription,
        isAdmin: selectedRole.isAdmin,
        modules: modules,
        modifiedBy: currentUser,
      });

      showSuccessToast("Role updated successfully");
      setIsEditDialogOpen(false);
      await loadInitialData();
      loadRolePermissions(selectedRoleId);
    } catch (error) {
      showErrorToast("Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId) return;

    setLoading(true);
    try {
      const currentUser = localStorage.getItem("username") || "system";
      await deleteRole(selectedRoleId, currentUser);

      showSuccessToast("Role deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedRoleId(null);
      await loadInitialData();
    } catch (error) {
      showErrorToast("Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    const role = roles.find((r) => r.roleId === selectedRoleId);
    if (role) {
      setEditRoleName(role.name);
      setEditRoleDescription(role.description);
      setIsEditDialogOpen(true);
    }
  };

  // Render entity component
  const renderEntity = (module: Module, entity: Entity) => {
    const getSelectedSubAction = (subActions?: SubAction[]) => {
      if (!subActions) return "";
      const selected = subActions.find((sub) => sub.checked);
      return selected ? selected.id : "";
    };

    return (
      <div key={entity.id} className="pl-8 mt-3">
        <div className="flex items-center gap-2 mb-2">
          {entity.hasActions ||
          (entity.subActions && entity.subActions.length > 0) ? (
            <Button
              appearance="transparent"
              size="small"
              icon={
                entity.expanded ? (
                  <ChevronDownRegular />
                ) : (
                  <ChevronRightRegular />
                )
              }
              onClick={() => toggleEntity(module.id, entity.id)}
            />
          ) : (
            <div className="w-7" />
          )}
          <Checkbox
            checked={entity.checked}
            onChange={(_, data) =>
              handleEntityCheck(module.id, entity.id, data.checked as boolean)
            }
          />
          <div className="flex flex-col gap-1">
            <Body1>
              <b>{entity.name}</b>
            </Body1>
            <Caption1>{entity.description}</Caption1>
          </div>
        </div>

        {entity.expanded && (
          <>
            {/* Render entity-level sub-actions as radio buttons */}
            {entity.subActions && entity.subActions.length > 0 && (
              <div className="pl-12 mt-2">
                <RadioGroup
                  value={getSelectedSubAction(entity.subActions)}
                  onChange={(_, data) =>
                    handleSubActionRadioChange(
                      module.id,
                      entity.id,
                      null,
                      data.value
                    )
                  }
                  className="flex flex-col gap-2"
                >
                  {entity.subActions.map((subAction) => (
                    <Radio
                      key={subAction.id}
                      value={subAction.id}
                      label={<Body1>{subAction.name}</Body1>}
                    />
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Render actions */}
            {entity.actions && entity.actions.length > 0 && (
              <div className="pl-8 mt-2">
                {entity.actions.map((action) => (
                  <div key={action.id} className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {action.subActions && action.subActions.length > 0 ? (
                        <Button
                          appearance="transparent"
                          size="small"
                          icon={
                            action.expanded ? (
                              <ChevronDownRegular />
                            ) : (
                              <ChevronRightRegular />
                            )
                          }
                          onClick={() =>
                            toggleAction(module.id, entity.id, action.id)
                          }
                        />
                      ) : (
                        <div className="w-7" />
                      )}
                      <Checkbox
                        checked={action.checked}
                        onChange={(_, data) =>
                          handleActionCheck(
                            module.id,
                            entity.id,
                            action.id,
                            data.checked as boolean
                          )
                        }
                      />
                      <div>
                        <div className="flex flex-col gap-1">
                          <Body1>{action.name}</Body1>

                          {/* {action.description && (
                            <Caption1>{action.description}</Caption1>
                          )} */}
                        </div>
                      </div>
                    </div>

                    {action.expanded &&
                      action.subActions &&
                      action.subActions.length > 0 && (
                        <div className="pl-12 mt-2">
                          <RadioGroup
                            value={getSelectedSubAction(action.subActions)}
                            onChange={(_, data) =>
                              handleSubActionRadioChange(
                                module.id,
                                entity.id,
                                action.id,
                                data.value
                              )
                            }
                            className="flex flex-col gap-2"
                          >
                            {action.subActions.map((subAction) => (
                              <Radio
                                key={subAction.id}
                                value={subAction.id}
                                label={<Body1>{subAction.name}</Body1>}
                              />
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const selectedRole = roles.find((r) => r.roleId === selectedRoleId);

  if (loading && modules.length === 0) {
    return (
      <FluentProvider className="!bg-transparent  h-full">
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">Loading permissions...</Body1Strong>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider className="!bg-transparent">
      <Toaster toasterId={toasterId} />

      <div>
        {/* Header */}
        <div className="mb-6">
          <Subtitle2>Action Permission Configuration</Subtitle2>
          <div>
            <Caption1 className="text-gray-600">
              Configure hierarchical action permissions (roles will be assigned
              later)
            </Caption1>
          </div>
        </div>

        {/* Role Selection Card */}
        <Card className="max-w-full mb-4">
          <CardHeader
            image={<Shield24Regular />}
            header={
              <Body1>
                <b>Role Configuration</b>
              </Body1>
            }
            description={
              <Caption1>
                Select a role to configure permissions
                {hasUnsavedChanges && (
                  <Badge
                    appearance="filled"
                    color="danger"
                    size="small"
                    style={{ marginLeft: "8px" }}
                  >
                    Unsaved changes
                  </Badge>
                )}
              </Caption1>
            }
            action={
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                onClick={handleSave}
                disabled={!hasUnsavedChanges || !selectedRoleId || loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            }
          />

          <div className="p-4">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Label
                  weight="semibold"
                  style={{ display: "block", marginBottom: "8px" }}
                >
                  Select Role
                </Label>
                <Dropdown
                  placeholder="Select a role"
                  value={selectedRole?.name || ""}
                  onOptionSelect={handleRoleChange}
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {roles.map((role) => (
                    <Option
                      key={role.roleId}
                      value={role.roleId.toString()}
                      text={role.roleId.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <span>{role.name}</span>
                        {role.isPredefined && (
                          <Badge
                            appearance="outline"
                            color="informative"
                            size="small"
                          >
                            Predefined
                          </Badge>
                        )}
                      </div>
                    </Option>
                  ))}
                </Dropdown>
                {selectedRole && (
                  <Caption1 className="mt-2 block text-gray-600">
                    {selectedRole.description}
                  </Caption1>
                )}
              </div>

              <div className="flex gap-2 mt-7">
                <Button
                  appearance="outline"
                  icon={<AddRegular />}
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={loading}
                  title="Create New Role"
                >
                  New Role
                </Button>

                {selectedRole && !selectedRole.isPredefined && (
                  <>
                    <Button
                      appearance="outline"
                      icon={<EditRegular />}
                      onClick={openEditDialog}
                      disabled={loading}
                      title="Edit Role"
                    />
                    <Button
                      appearance="outline"
                      icon={<DeleteRegular />}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={loading}
                      title="Delete Role"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Permissions Tree */}
        <div className="mt-6">
          {modules.map((module) => {
            const { leftColumn, rightColumn } = splitEntitiesIntoColumns(
              module.id,
              module.entities
            );

            return (
              <Card key={module.id} className="max-w-full mb-3">
                <CardHeader
                  image={<Settings24Regular />}
                  header={
                    <div className="flex items-center gap-3">
                      <Button
                        appearance="transparent"
                        size="small"
                        icon={
                          module.expanded ? (
                            <ChevronDownRegular />
                          ) : (
                            <ChevronRightRegular />
                          )
                        }
                        onClick={() => toggleModule(module.id)}
                      />
                      <Checkbox
                        checked={module.checked}
                        onChange={(_, data) =>
                          handleModuleCheck(module.id, data.checked as boolean)
                        }
                      />
                      <Body1>
                        <b>{module.name}</b>
                      </Body1>
                    </div>
                  }
                  description={<Caption1>{module.description}</Caption1>}
                />

                {module.expanded && (
                  <CardPreview className="p-4 bg-gray-50">
                    <div className="!grid !grid-cols-1 lg:!grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div>
                        {leftColumn.map((entity) =>
                          renderEntity(module, entity)
                        )}
                      </div>

                      {/* Right Column */}
                      <div>
                        {rightColumn.map((entity) =>
                          renderEntity(module, entity)
                        )}
                      </div>
                    </div>
                  </CardPreview>
                )}
              </Card>
            );
          })}
        </div>

        {/* Dialogs */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(_, data) => setIsCreateDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label weight="semibold" required>
                      Role Name
                    </Label>
                    <Input
                      value={newRoleName}
                      onChange={(_, data) => setNewRoleName(data.value)}
                      placeholder="Enter role name"
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <Label weight="semibold">Description</Label>
                    <Input
                      value={newRoleDescription}
                      onChange={(_, data) => setNewRoleDescription(data.value)}
                      placeholder="Enter role description"
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleCreateRole}
                  disabled={!newRoleName.trim() || loading}
                >
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(_, data) => setIsEditDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogContent>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label weight="semibold" required>
                      Role Name
                    </Label>
                    <Input
                      value={editRoleName}
                      onChange={(_, data) => setEditRoleName(data.value)}
                      placeholder="Enter role name"
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <Label weight="semibold">Description</Label>
                    <Input
                      value={editRoleDescription}
                      onChange={(_, data) => setEditRoleDescription(data.value)}
                      placeholder="Enter role description"
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleEditRole}
                  disabled={!editRoleName.trim() || loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(_, data) => setIsDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogContent>
                <p>
                  Are you sure you want to delete this role? This action cannot
                  be undone.
                </p>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleDeleteRole}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </FluentProvider>
  );
};

export default RolePermissionConfig;

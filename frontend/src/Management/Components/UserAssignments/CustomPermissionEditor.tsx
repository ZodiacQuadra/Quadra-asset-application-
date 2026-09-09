// components/CustomPermissionEditor.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  Label,
  Body1,
  Caption1,
  Body1Strong,
  Subtitle2,
  Badge,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  ChevronDownRegular,
  ChevronRightRegular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { Module, Entity, Action } from "../../../Services/UserAssignments";

const useStyles = makeStyles({
  moduleCard: {
    maxWidth: "100%",
    marginBottom: "12px",
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  permissionContent: {
    padding: "16px",
    backgroundColor: "#fafafa",
  },
  twoColumnLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  entitySection: {
    paddingLeft: "32px",
    marginTop: "12px",
  },
  actionSection: {
    paddingLeft: "32px",
    marginTop: "8px",
  },
  subActionSection: {
    paddingLeft: "48px",
    marginTop: "6px",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  radioGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

interface CustomPermissionEditorProps {
  modules: Module[];
  onPermissionsChange: (modules: Module[]) => void;
  baseRoleName: string;
  isReadOnly?: boolean;
}

export const CustomPermissionEditor: React.FC<CustomPermissionEditorProps> = ({
  modules: initialModules,
  onPermissionsChange,
  baseRoleName,
  isReadOnly = false,
}) => {
  const styles = useStyles();
  const [modules, setModules] = useState<Module[]>(initialModules);

  // THIS IS THE KEY FIX: Update internal state when initialModules changes
  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  // Update parent component whenever modules change
  useEffect(() => {
    // Only notify parent if modules have actually been modified by user interaction
    // We check if it's not just the initial load
    if (modules.length > 0) {
      onPermissionsChange(modules);
    }
  }, [modules]);

  // Helper function to determine if entity should be in right column
  const isRightColumnEntity = (
    moduleId: string,
    entityKey: string
  ): boolean => {
    const rightColumnEntities: Record<string, string[]> = {
      recruit: ["hiring_template", "location", "department"],
      onboarding: ["induction_tasks"],
      background_verification: ["document_management"],
      offboarding: [
        "it_activity_management",
        "admin_activity_management",
        "finance_activity_management",
      ],
    };
    return rightColumnEntities[moduleId]?.includes(entityKey) || false;
  };

  // Split entities into left and right columns
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

  // Toggle handlers
  const toggleModule = (moduleId: string) => {
    // console.log("Toggling module:", moduleId);
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
              entities: module.entities.map((entity: any) =>
                entity.id === entityId
                  ? { ...entity, expanded: !entity.expanded }
                  : entity
              ),
            }
          : module
      )
    );
  };

  // console.log("Modules state:", modules);
  // console.log("Initial modules prop:", initialModules);

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
              entities: module.entities.map((entity: any) =>
                entity.id === entityId
                  ? {
                      ...entity,
                      actions: entity.actions?.map((action: any) =>
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
    if (isReadOnly) return;

    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            checked: checked,
            entities: module.entities.map((entity: any) => ({
              ...entity,
              checked: checked,
              actions: entity.actions?.map((action: any) => ({
                ...action,
                checked: checked,
                subActions: action.subActions?.map((sub: any, index: any) => ({
                  ...sub,
                  checked: checked && index === 0,
                })),
              })),
              subActions: entity.subActions?.map((sub: any, index: any) => ({
                ...sub,
                checked: checked && index === 0,
              })),
            })),
          };
        }
        return module;
      })
    );
  };

  const handleEntityCheck = (
    moduleId: string,
    entityId: string,
    checked: boolean
  ) => {
    if (isReadOnly) return;

    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity: any) => {
            if (entity.id === entityId) {
              let updatedSubActions = entity.subActions;
              if (
                checked &&
                entity.subActions &&
                entity.subActions.length > 0
              ) {
                updatedSubActions = entity.subActions.map(
                  (sub: any, index: any) => ({
                    ...sub,
                    checked: index === 0,
                  })
                );
              } else if (!checked && entity.subActions) {
                updatedSubActions = entity.subActions.map((sub: any) => ({
                  ...sub,
                  checked: false,
                }));
              }

              return {
                ...entity,
                checked: checked,
                actions: entity.actions?.map((action: any) => ({
                  ...action,
                  checked: checked,
                  subActions: action.subActions?.map(
                    (sub: any, index: any) => ({
                      ...sub,
                      checked: checked && index === 0,
                    })
                  ),
                })),
                subActions: updatedSubActions,
              };
            }
            return entity;
          });

          const allChecked = updatedEntities.every((e: any) => e.checked);
          const someChecked = updatedEntities.some((e: any) => e.checked);

          return {
            ...module,
            entities: updatedEntities,
            checked: allChecked || someChecked,
          };
        }
        return module;
      })
    );
  };

  const handleActionCheck = (
    moduleId: string,
    entityId: string,
    actionId: string,
    checked: boolean
  ) => {
    if (isReadOnly) return;

    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity: any) => {
            if (entity.id === entityId) {
              const updatedActions = entity.actions?.map((action: any) => {
                if (action.id === actionId) {
                  let updatedSubActions = action.subActions;
                  if (
                    checked &&
                    action.subActions &&
                    action.subActions.length > 0
                  ) {
                    updatedSubActions = action.subActions.map(
                      (sub: any, index: any) => ({
                        ...sub,
                        checked: index === 0,
                      })
                    );
                  } else if (!checked && action.subActions) {
                    updatedSubActions = action.subActions.map((sub: any) => ({
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
                updatedActions?.every((a: any) => a.checked) ?? false;
              const someActionsChecked =
                updatedActions?.some((a: any) => a.checked) ?? false;

              return {
                ...entity,
                actions: updatedActions,
                checked: allActionsChecked || someActionsChecked,
              };
            }
            return entity;
          });

          const allEntitiesChecked = updatedEntities.every(
            (e: any) => e.checked
          );
          const someEntitiesChecked = updatedEntities.some(
            (e: any) => e.checked
          );

          return {
            ...module,
            entities: updatedEntities,
            checked: allEntitiesChecked || someEntitiesChecked,
          };
        }
        return module;
      })
    );
  };

  const handleSubActionRadioChange = (
    moduleId: string,
    entityId: string,
    actionId: string | null,
    selectedSubActionId: string
  ) => {
    if (isReadOnly) return;

    setModules((prev) =>
      prev.map((module) => {
        if (module.id === moduleId) {
          const updatedEntities = module.entities.map((entity: any) => {
            if (entity.id === entityId) {
              if (actionId === null && entity.subActions) {
                const updatedSubActions = entity.subActions.map((sub: any) => ({
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
                const updatedActions = entity.actions.map((action: any) => {
                  if (action.id === actionId) {
                    const updatedSubActions = action.subActions?.map(
                      (sub: any) => ({
                        ...sub,
                        checked: sub.id === selectedSubActionId,
                      })
                    );

                    return {
                      ...action,
                      subActions: updatedSubActions,
                      checked: true,
                    };
                  }
                  return action;
                });

                const someActionsChecked = updatedActions.some(
                  (a: any) => a.checked
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

          const someEntitiesChecked = updatedEntities.some(
            (e: any) => e.checked
          );

          return {
            ...module,
            entities: updatedEntities,
            checked: someEntitiesChecked,
          };
        }
        return module;
      })
    );
  };

  const getSelectedSubAction = (subActions?: any[]) => {
    if (!subActions) return "";
    const selected = subActions.find((sub) => sub.checked);
    return selected ? selected.id : "";
  };

  // Render entity component
  const renderEntity = (module: Module, entity: Entity) => {
    return (
      <div key={entity.id} className={styles.entitySection}>
        <div className={styles.checkboxRow}>
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
              disabled={isReadOnly}
            />
          ) : (
            <div style={{ width: "28px" }} />
          )}
          <Checkbox
            checked={entity.checked}
            onChange={(_, data) =>
              handleEntityCheck(module.id, entity.id, data.checked as boolean)
            }
            disabled={isReadOnly}
          />
          <div className={styles.headerContent}>
            <Body1>
              <b>{entity.name}</b>
            </Body1>
            <Caption1>{entity.description}</Caption1>
          </div>
        </div>

        {entity.expanded && (
          <>
            {entity.subActions && entity.subActions.length > 0 && (
              <div className={styles.subActionSection}>
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
                  className={styles.radioGroup}
                  disabled={isReadOnly}
                >
                  {entity.subActions.map((subAction: any) => (
                    <Radio
                      key={subAction.id}
                      value={subAction.id}
                      label={<Body1>{subAction.name}</Body1>}
                      disabled={isReadOnly}
                    />
                  ))}
                </RadioGroup>
              </div>
            )}

            {entity.actions && entity.actions.length > 0 && (
              <div className={styles.actionSection}>
                {entity.actions.map((action: any) => (
                  <div key={action.id} style={{ marginBottom: "12px" }}>
                    <div className={styles.checkboxRow}>
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
                          disabled={isReadOnly}
                        />
                      ) : (
                        <div style={{ width: "28px" }} />
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
                        disabled={isReadOnly}
                      />
                      <div>
                        <Body1>{action.name}</Body1>
                        {/* {action.description && (
                          <Caption1>{action.description}</Caption1>
                        )} */}
                      </div>
                    </div>

                    {action.expanded &&
                      action.subActions &&
                      action.subActions.length > 0 && (
                        <div className={styles.subActionSection}>
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
                            className={styles.radioGroup}
                            disabled={isReadOnly}
                          >
                            {action.subActions.map((subAction: any) => (
                              <Radio
                                key={subAction.id}
                                value={subAction.id}
                                label={<Body1>{subAction.name}</Body1>}
                                disabled={isReadOnly}
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

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const { leftColumn, rightColumn } = splitEntitiesIntoColumns(
          module.id,
          module.entities
        );

        return (
          <Card key={module.id} className={styles.moduleCard}>
            <CardHeader
              image={<Settings24Regular />}
              header={
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
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
                    disabled={isReadOnly}
                  />
                  <Checkbox
                    checked={module.checked}
                    onChange={(_, data) =>
                      handleModuleCheck(module.id, data.checked as boolean)
                    }
                    disabled={isReadOnly}
                  />
                  <Body1>
                    <b>{module.name}</b>
                  </Body1>
                </div>
              }
              description={<Caption1>{module.description}</Caption1>}
            />

            {module.expanded && (
              <CardPreview className={styles.permissionContent}>
                <div className={styles.twoColumnLayout}>
                  <div>
                    {leftColumn.map((entity) => renderEntity(module, entity))}
                  </div>
                  <div>
                    {rightColumn.map((entity) => renderEntity(module, entity))}
                  </div>
                </div>
              </CardPreview>
            )}
          </Card>
        );
      })}
    </div>
  );
};

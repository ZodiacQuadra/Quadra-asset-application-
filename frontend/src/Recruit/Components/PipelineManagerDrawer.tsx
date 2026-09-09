import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Card,
  Text,
  Caption1,
  Body1Strong,
  Spinner,
  Badge,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  useId,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  ReOrderDotsVertical24Regular,
  Settings24Regular,
  Dismiss24Regular,
  Add12Filled,
  Info24Regular,
} from "@fluentui/react-icons";
import {
  HiringPipelineStage,
  useHiringPipelineApi,
  CreatePipelineStageData,
  UpdatePipelineStageData,
  DeletePipelineStageData,
  ReorderPipelineStageData,
} from "../../Services/HiringPipeline";
import PipelineStageForm from "../../Management/Components/StageTemplates/PipelineStageForm";
import { useAuth } from "../../Auth/AuthProvider";

interface PipelineManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onPipelineUpdate?: () => void;
}

const PipelineManagerDrawer: React.FC<PipelineManagerDrawerProps> = ({
  isOpen,
  onClose,
  jobId,
  onPipelineUpdate,
}) => {
  const { currentUser, accessToken }: any = useAuth();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController();
  const api = useHiringPipelineApi(accessToken);

  // State management
  const [stages, setStages] = useState<HiringPipelineStage[]>([]);
  const [editingStage, setEditingStage] = useState<HiringPipelineStage | null>(
    null
  );
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [draggedStage, setDraggedStage] = useState<HiringPipelineStage | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isLegendDialogOpen, setIsLegendDialogOpen] = useState(false);

  const showToast = (
    message: string,
    intent: "success" | "error" | "warning" = "success",
    title?: string
  ) => {
    dispatchToast(
      <Toast>
        {title && <ToastTitle>{title}</ToastTitle>}
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent }
    );
  };

  // Load pipeline stages
  const loadStages = async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      const result = await api.fetchPipelineByJobId(jobId);

      if (result.error) {
        showToast(result.error, "error", "Failed to Load Pipeline");
        setStages([]);
      } else if (result.data) {
        setStages(result.data);
      }
    } catch (error) {
      showToast("Failed to load pipeline stages", "error", "Error");
      console.error("Error loading pipeline stages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load stages when drawer opens or jobId changes
  useEffect(() => {
    if (isOpen && jobId) {
      loadStages();
    }
  }, [isOpen, jobId]);

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    stage: HiringPipelineStage
  ) => {
    if (isProtectedStage(stage)) {
      e.preventDefault();
      showToast(
        "Protected stages cannot be moved",
        "warning",
        "Action Restricted"
      );
      return;
    }
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedStage(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();

    if (isProtectedIndex(index)) {
      e.dataTransfer.dropEffect = "none";
      return;
    }

    if (isProtectedStage(stages[index])) {
      e.dataTransfer.dropEffect = "none";
      return;
    }

    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number
  ) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedStage) return;

    if (
      isProtectedIndex(targetIndex) ||
      isProtectedStage(stages[targetIndex])
    ) {
      showToast(
        "Cannot reorder onto a protected stage.",
        "warning",
        "Reorder Restricted"
      );
      return;
    }

    const sourceIndex = stages.findIndex((s) => s.ID === draggedStage.ID);
    if (sourceIndex === targetIndex) {
      setDraggedStage(null);
      return;
    }

    try {
      setIsOperationLoading(true);

      const newStages = [...stages];
      const [movedStage] = newStages.splice(sourceIndex, 1);
      newStages.splice(targetIndex, 0, movedStage);

      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        Order: index + 1,
      }));

      const reorderData: ReorderPipelineStageData = {
        stages: updatedStages.map((stage) => ({
          id: stage.ID,
          order: stage.Order,
        })),
        modifiedByUserId: currentUser.userID,
      };

      const result = await api.reorderPipelineStages(jobId, reorderData);

      if (result.error) {
        showToast(result.error, "error", "Reorder Failed");
        await loadStages();
      } else {
        setStages(updatedStages);
        showToast("Pipeline stages reordered successfully", "success");
        onPipelineUpdate?.();
      }
    } catch (error) {
      showToast("Failed to reorder stages", "error", "Error");
      console.error("Error reordering stages:", error);
      await loadStages();
    } finally {
      setIsOperationLoading(false);
      setDraggedStage(null);
    }
  };

  // CRUD operations
  const handleAddStage = async (data: any) => {
    try {
      setIsOperationLoading(true);

      const createData: CreatePipelineStageData = {
        ...data,
        jobPostingId: jobId,
        createdByUserId: currentUser.userID,
      };

      const result = await api.createPipelineStage(createData);

      if (result.error) {
        showToast(result.error, "error", "Create Failed");
      } else if (result.data) {
        await loadStages();
        setIsAddFormOpen(false);
        showToast("New stage added successfully", "success");
        onPipelineUpdate?.();
      }
    } catch (error) {
      showToast("Failed to add stage", "error", "Error");
      console.error("Error adding stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleEditStage = (stage: HiringPipelineStage) => {
    if (isProtectedStage(stage)) {
      showToast(
        "Default stages cannot be edited",
        "warning",
        "Edit Restricted"
      );
      return;
    }

    if (stage.ApplicantCount > 0) {
      showToast(
        "Cannot edit stage with existing applicants",
        "warning",
        "Edit Restricted"
      );
      return;
    }

    setEditingStage(stage);
    setIsEditFormOpen(true);
  };

  const handleUpdateStage = async (data: any) => {
    if (!editingStage) return;

    try {
      setIsOperationLoading(true);

      const updateData: UpdatePipelineStageData = {
        ...data,
        modifiedByUserId: currentUser.userID,
      };

      const result = await api.updatePipelineStage(editingStage.ID, updateData);

      if (result.error) {
        showToast(result.error, "error", "Update Failed");
      } else {
        await loadStages();
        setEditingStage(null);
        setIsEditFormOpen(false);
        showToast("Stage updated successfully", "success");
        onPipelineUpdate?.();
      }
    } catch (error) {
      showToast("Failed to update stage", "error", "Error");
      console.error("Error updating stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const stage = stages.find((s) => s.ID === stageId);

    if (!stage) return;

    if (isProtectedStage(stage)) {
      showToast(
        "Default stages cannot be deleted",
        "warning",
        "Delete Restricted"
      );
      return;
    }

    if (stage.ApplicantCount > 0) {
      showToast(
        "Cannot delete stage with existing applicants",
        "warning",
        "Delete Restricted"
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${stage.InterviewName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setIsOperationLoading(true);

      const deleteData: DeletePipelineStageData = {
        modifiedByUserId: currentUser.userID,
      };

      const result = await api.deletePipelineStage(stageId, deleteData);

      if (result.error) {
        showToast(result.error, "error", "Delete Failed");
      } else {
        await loadStages();
        showToast("Stage deleted successfully", "success");
        onPipelineUpdate?.();
      }
    } catch (error) {
      showToast("Failed to delete stage", "error", "Error");
      console.error("Error deleting stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  // Helper functions
  const isProtectedStage = (stage: HiringPipelineStage): boolean => {
    return stage.isDefault;
  };

  const isProtectedIndex = (index: number): boolean => {
    const stage = stages[index];
    return stage ? stage.isDefault : false;
  };

  const canEditOrDelete = (stage: HiringPipelineStage): boolean => {
    return !isProtectedStage(stage) && stage.ApplicantCount === 0;
  };

  const retryLoadStages = async () => {
    await loadStages();
  };

  if (isLoading) {
    return (
      <Drawer
        type="overlay"
        separator
        open={isOpen}
        position="end"
        onOpenChange={(_, { open }) => !open && onClose()}
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            <div className="flex items-center space-x-2">
              <Settings24Regular className="h-5 w-5" />
              <span>Pipeline Manager</span>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col items-center justify-center py-8 h-full">
            <Spinner />
            <Body1Strong className="mt-2">
              Loading pipeline stages...
            </Body1Strong>
          </div>
        </DrawerBody>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        type="overlay"
        separator
        open={isOpen}
        position="end"
        onOpenChange={(_, { open }) => !open && onClose()}
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            <div className="flex items-center space-x-2">
              <Settings24Regular className="h-5 w-5" />
              <span>Pipeline Manager</span>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          <div className="space-y-2">
            {/* Operation loading overlay */}
            {isOperationLoading && (
              <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">Processing...</Body1Strong>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center pb-4">
              <div className="w-80">
                <div>
                  <Caption1 className="text-gray-600">
                    Configure your hiring pipeline stages. Default stages are
                    protected and maintain fixed positions.
                  </Caption1>{" "}
                  <Dialog
                    open={isLegendDialogOpen}
                    onOpenChange={(event, data) =>
                      setIsLegendDialogOpen(data.open)
                    }
                  >
                    <DialogTrigger disableButtonEnhancement>
                      <Button
                        appearance="transparent"
                        icon={<Info24Regular />}
                        size="small"
                        className="!text-blue-600 hover:!text-blue-700"
                        title="View stage type information"
                      />
                    </DialogTrigger>
                    <DialogSurface className="max-w-2xl">
                      <DialogBody>
                        <DialogTitle>Stage Type Indicators</DialogTitle>
                        <DialogContent>
                          <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="text-gray-700 mb-4 block">
                                <Text
                                  weight="semibold"
                                  size={300}
                                  className="text-gray-700"
                                >
                                  Stage Type Indicators:
                                </Text>
                              </div>

                              <div className="grid grid-row-1 md:grid-cols-1 gap-3 text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="bg-green-100 text-green-800 border-green-800 border-1 px-2 py-1 rounded-xl text-xs whitespace-nowrap">
                                    Show in UI
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    This stage appears in the candidate pipeline
                                    view
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 border-blue-800 border-1 rounded-xl text-xs whitespace-nowrap">
                                    Direct Decision
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    Recruiters can approve/reject without
                                    scheduling interviews
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="bg-yellow-100 text-yellow-800 border-yellow-800 border-1 px-2 py-1 rounded-xl text-xs whitespace-nowrap">
                                    Protected
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    Default stage that cannot be edited or
                                    deleted
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <Text size={200} className="text-gray-600">
                                  <strong>Interview-Based Stages:</strong>{" "}
                                  Stages without "Direct Decision" require
                                  interview scheduling. Candidates progress
                                  based on interviewer feedback.
                                </Text>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                        <DialogActions>
                          <Button
                            appearance="primary"
                            onClick={() => setIsLegendDialogOpen(false)}
                          >
                            Got it
                          </Button>
                        </DialogActions>
                      </DialogBody>
                    </DialogSurface>
                  </Dialog>
                </div>
              </div>
              <div>
                <Button
                  appearance="primary"
                  onClick={() => setIsAddFormOpen(true)}
                  shape="circular"
                  icon={
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                      <Add12Filled />
                    </div>
                  }
                  className="hover:bg-indigo-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
                  disabled={isLoading || isOperationLoading}
                >
                  Append a Stage
                </Button>
              </div>
            </div>

            {/* Stages list */}
            {stages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  No pipeline stages found
                </div>
                <Button onClick={retryLoadStages}>Retry Loading</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <Card
                    key={stage.ID}
                    draggable={!isProtectedStage(stage) && !isOperationLoading}
                    onDragStart={(e) => handleDragStart(e, stage)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`!rounded-xl p-4 transition-all duration-200 ${
                      isProtectedStage(stage) ? "opacity-75" : "cursor-move"
                    } ${
                      dragOverIndex === index
                        ? "border-2 border-blue-400 bg-blue-50"
                        : ""
                    } ${
                      isOperationLoading ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-md ${
                            isProtectedStage(stage) || isOperationLoading
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-grab active:cursor-grabbing hover:bg-white/50"
                          }`}
                        >
                          <ReOrderDotsVertical24Regular className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="bg-white/80 text-gray-700 font-medium px-4 py-2 rounded-3xl border">
                            {stage.Order}
                          </span>

                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <span>{stage.InterviewName}</span>
                              {stage.ApplicantCount > 0 && (
                                <Badge appearance="tint" color="informative">
                                  {stage.ApplicantCount} applicants
                                </Badge>
                              )}
                            </div>
                            <Caption1 className="text-sm text-gray-600">
                              {stage.Description}
                            </Caption1>
                            <div className="flex items-center space-x-2">
                              {stage.Show && (
                                <Caption1 className="bg-green-100 text-green-800 border-green-800 border-1 px-2 py-1 rounded-xl text-xs font-medium">
                                  Show in UI
                                </Caption1>
                              )}
                              {stage.IsManual && (
                                <Caption1 className="bg-blue-100 text-blue-800 px-2 py-1 border-blue-800 border-1 rounded-xl text-xs font-medium">
                                  Direct Decision
                                </Caption1>
                              )}
                              {stage.isDefault && (
                                <Caption1 className="bg-yellow-100 text-yellow-800 px-2 py-1 border-yellow-800 border-1 rounded-xl text-xs font-medium">
                                  Protected
                                </Caption1>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditStage(stage)}
                            disabled={
                              !canEditOrDelete(stage) || isOperationLoading
                            }
                            className={`p-2 rounded hover:bg-white/50 ${
                              !canEditOrDelete(stage) || isOperationLoading
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Edit24Regular className="h-4 w-4 text-gray-500" />
                          </button>

                          <button
                            onClick={() => handleDeleteStage(stage.ID)}
                            disabled={
                              !canEditOrDelete(stage) || isOperationLoading
                            }
                            className={`p-2 rounded hover:bg-red-50 hover:text-red-600 ${
                              !canEditOrDelete(stage) || isOperationLoading
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Delete24Regular className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DrawerBody>
      </Drawer>

      {/* Forms */}
      <PipelineStageForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleAddStage}
        title="Add New Stage"
        description="Create a new stage for your hiring pipeline."
      />

      <PipelineStageForm
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingStage(null);
        }}
        onSubmit={handleUpdateStage}
        stage={editingStage}
        title="Edit Stage"
        description="Update the details of this pipeline stage."
      />

      <Toaster toasterId={toasterId} />
    </>
  );
};

export default PipelineManagerDrawer;

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  ReOrderDotsVertical24Regular,
  Add12Filled,
  Info24Regular,
} from "@fluentui/react-icons";
import {
  Subtitle2,
  Caption1,
  Body1Strong,
  Card,
  Button,
  FluentProvider,
  Spinner,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  Text,
  useId,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import StageForm from "../Components/StageTemplates/StageForm";
import {
  InterviewStagesApiService,
  useInterviewStagesApi,
  InterviewStage,
  StageFormData,
  CreateStageData,
  UpdateStageData,
  DeleteStageData,
  ReorderStageData,
  ApiUtils,
} from "../../Services/StageMaster";
import { useAuth } from "../../Auth/AuthProvider";

const InterviewStageManager: React.FC = () => {
  const { currentUser, accessToken }: any = useAuth();
  const toasterId = useId("toaster");
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [editingStage, setEditingStage] = useState<InterviewStage | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [draggedStage, setDraggedStage] = useState<InterviewStage | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [isLegendDialogOpen, setIsLegendDialogOpen] = useState(false);

  const { dispatchToast } = useToastController();
  const api = useInterviewStagesApi();

  const showToast = (message: string, intent: any, title?: string) => {
    dispatchToast(
      <Toast>
        {title && <ToastTitle>{title}</ToastTitle>}
        <ToastBody>{message}</ToastBody>
      </Toast>,
      { intent: intent }
    );
  };

  // Load stages on component mount
  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      setIsLoading(true);
      const result = await api.fetchAllStages(accessToken);

      if (result.error) {
        showToast(result.error, "error", "Failed to Load Stages");
        setStages([]);
      } else if (result.data) {
        setStages(
          result.data.map((result, index) => ({ ...result, order: index + 1 }))
        );
      }
    } catch (error) {
      showToast("Failed to load interview stages", "error", "Error");
      console.error("Error loading stages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    stage: InterviewStage
  ) => {
    if (isProtectedStage(stage.name)) {
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

    if (index === 0 || index === stages.length - 1) {
      e.dataTransfer.dropEffect = "none";
      return;
    }

    if (isProtectedStage(stages[index].name)) {
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

    if (targetIndex === 0 || targetIndex === stages.length - 1) {
      showToast(
        "Applied and Hired stages must remain in their fixed positions.",
        "warning",
        "Reorder Restricted"
      );
      return;
    }

    if (isProtectedStage(stages[targetIndex].name)) {
      showToast(
        "Cannot reorder onto a protected stage.",
        "warning",
        "Reorder Restricted"
      );
      return;
    }

    const sourceIndex = stages.findIndex((s) => s.id === draggedStage.id);
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
        order: index + 1,
      }));

      const reorderData: ReorderStageData = {
        stages: updatedStages.map((stage) => ({
          id: stage.id,
          order: stage.order,
          name: stage.name,
          description: stage.description,
        })),
        modifiedByUserID: currentUser.userID,
      };

      // console.log("Sending reorder data:", reorderData);

      const result = await api.reorderStages(reorderData, accessToken);

      if (result.error) {
        showToast(result.error, "error", "Reorder Failed");
        await loadStages();
      } else {
        setStages(updatedStages);
        showToast("Stages reordered successfully", "success");
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

  const handleDeleteStage = async (stageId: string) => {
    const stageToDelete = stages.find((stage) => stage.id === stageId);

    if (
      stageToDelete &&
      (stageToDelete.name === "Applied" ||
        stageToDelete.name === "HR Screening" ||
        stageToDelete.name === "Hired")
    ) {
      showToast(
        "Applied, HR Screening and Hired stages are protected and cannot be deleted.",
        "warning",
        "Delete Restricted"
      );
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this stage? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsOperationLoading(true);

      const deleteData: DeleteStageData = {
        modifiedByUserID: currentUser.userID,
      };

      const result = await api.deleteStage(stageId, deleteData, accessToken);

      if (result.error) {
        showToast(result.error, "error", "Delete Failed");
      } else {
        const updatedStages = stages
          .filter((stage) => stage.id !== stageId)
          .map((stage, index) => ({
            ...stage,
            order: index + 1,
          }));

        setStages(updatedStages);
        showToast("Stage deleted successfully", "success");
      }
    } catch (error) {
      showToast("Failed to delete stage", "error", "Error");
      console.error("Error deleting stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleEditStage = (stage: InterviewStage) => {
    if (
      stage.name === "Applied" ||
      stage.name === "HR Screening" ||
      stage.name === "Hired"
    ) {
      showToast(
        "Applied, HR Screening and Hired stages are protected and cannot be edited.",
        "warning",
        "Edit Restricted"
      );
      return;
    }

    setEditingStage(stage);
    setIsEditFormOpen(true);
  };

  const handleUpdateStage = async (data: StageFormData) => {
    if (!editingStage) return;

    try {
      setIsOperationLoading(true);

      const updateData: UpdateStageData = {
        ...data,
        modifiedByUserID: currentUser.userID,
      };

      const result = await api.updateStage(
        editingStage.id,
        updateData,
        accessToken
      );

      if (result.error) {
        showToast(result.error, "error", "Update Failed");
      } else {
        const updatedStages = stages.map((stage) =>
          stage.id === editingStage.id ? { ...stage, ...data } : stage
        );

        setStages(updatedStages);
        setEditingStage(null);
        setIsEditFormOpen(false);
        showToast("Stage updated successfully", "success");
      }
    } catch (error) {
      showToast("Failed to update stage", "error", "Error");
      console.error("Error updating stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const handleAddStage = async (data: StageFormData) => {
    try {
      setIsOperationLoading(true);

      const createData: CreateStageData = {
        ...data,
        createdByUserID: currentUser.userID,
      };

      const result = await api.createStage(createData, accessToken);

      if (result.error) {
        showToast(result.error, "error", "Create Failed");
      } else if (result.data) {
        const newStage: InterviewStage = {
          id: result.data.stageId,
          ...data,
          isDefault: false,
          order: stages.length,
          notify: false,
          notifyUsers: []
        };

        const updatedStages = [
          ...stages.slice(0, -1),
          newStage,
          stages[stages.length - 1],
        ].map((stage, index) => ({
          ...stage,
          order: index + 1,
        }));

        setStages(updatedStages);
        setIsAddFormOpen(false);
        showToast("New stage added successfully", "success");
      }
    } catch (error) {
      showToast("Failed to add stage", "error", "Error");
      console.error("Error adding stage:", error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  const isProtectedStage = (stageName: string) => {
    return (
      stageName === "Applied" ||
      stageName === "HR Screening" ||
      stageName === "Hired" ||
      stageName === "Offboarded"
    );
  };

  const retryLoadStages = async () => {
    try {
      await ApiUtils.retry(() => loadStages(), 3, 1000);
    } catch (error) {
      showToast(
        "Failed to load stages after multiple retries",
        "error",
        "Retry Failed"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Interview Pipelines...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <Toaster />
      <div className="space-y-2">
        {isOperationLoading && (
          <div className="flex flex-col items-center justify-center py-8 h-full">
            <Spinner />
            <Body1Strong className="mt-2">Processing...</Body1Strong>
          </div>
        )}

        <div className="flex justify-between items-center pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Subtitle2 className="text-gray-800">
                Interview Pipeline Configuration
              </Subtitle2>
              <Dialog
                open={isLegendDialogOpen}
                onOpenChange={(event, data) => setIsLegendDialogOpen(data.open)}
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
                        <div className=" p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                                HR can approve/reject without scheduling
                                interviews
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 border-purple-800 border-1 rounded-xl text-xs whitespace-nowrap">
                                Auto-Assigned
                              </span>
                              <span className="text-gray-600 text-xs">
                                New applicants automatically start at this stage
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Text size={200} className="text-gray-600">
                              <strong>Interview-Based Stages:</strong> Stages
                              without "Direct Decision" require interview
                              scheduling. Candidates progress based on
                              interviewer feedback.
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
            <div>
              <Caption1 className="text-gray-600">
                Configure your interview stages. "Applied", "HR Screening" and
                "Hired" stages are protected and maintain fixed positions.
              </Caption1>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <div></div>
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
                disabled={isLoading}
              >
                Add New Stage
              </Button>
            </div>
          </div>
        </div>

        {stages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-5 mb-4">No interview stages found</div>
            <Button onClick={retryLoadStages}>Retry Loading</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <Card
                key={stage.id}
                draggable={!isProtectedStage(stage.name) && !isOperationLoading}
                onDragStart={(e) => handleDragStart(e, stage)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`!rounded-xl p-4 transition-all duration-200 ${
                  isProtectedStage(stage.name) ? "opacity-75" : "cursor-move"
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
                        isProtectedStage(stage.name) || isOperationLoading
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-grab active:cursor-grabbing hover:bg-white/50"
                      }`}
                    >
                      <ReOrderDotsVertical24Regular className="h-5 w-5 text-gray-400" />
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="bg-white/80 text-gray-700 font-medium px-4 py-2 rounded-3xl border">
                        {stage.order}
                      </span>

                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{stage.name}</span>
                        </div>
                        <Caption1 className="text-sm text-gray-600">
                          {stage.description}
                        </Caption1>
                        <div className="flex items-center space-x-2">
                          {stage.show && (
                            <Caption1 className="bg-green-100 text-green-800  border-green-800 border-1 px-2 py-1 rounded-xl font-medium">
                              Show in UI
                            </Caption1>
                          )}
                          {stage.isManual && (
                            <Caption1 className="bg-blue-100 text-blue-800 px-2 py-1 border-blue-800 border-1 rounded-xl font-medium">
                              Direct Decision
                            </Caption1>
                          )}
                          {stage.isDefault && (
                            <Caption1 className="bg-purple-100 text-purple-800 px-2 py-1 border-purple-800 border-1 rounded-xl font-medium">
                              Auto-Assigned
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
                          isProtectedStage(stage.name) || isOperationLoading
                        }
                        className={`p-2 rounded hover:bg-white/50 ${
                          isProtectedStage(stage.name) || isOperationLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Edit24Regular className="h-4 w-4 text-gray-500" />
                      </button>

                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        disabled={
                          isProtectedStage(stage.name) || isOperationLoading
                        }
                        className={`p-2 rounded hover:bg-red-50 hover:text-red-600 ${
                          isProtectedStage(stage.name) || isOperationLoading
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

        <StageForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={handleAddStage}
          title="Add New Stage"
          description="Create a new stage for your recruitment pipeline."
        />

        <StageForm
          isOpen={isEditFormOpen}
          onClose={() => {
            setIsEditFormOpen(false);
            setEditingStage(null);
          }}
          onSubmit={handleUpdateStage}
          stage={editingStage}
          title="Edit Stage"
          description="Update the details of this interview stage."
          
        />
      </div>
      <FluentProvider style={{ background: "transparent" }}>
        <Toaster toasterId={toasterId} />
      </FluentProvider>
    </FluentProvider>
  );
};

export default InterviewStageManager;

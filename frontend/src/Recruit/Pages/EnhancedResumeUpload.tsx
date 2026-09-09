import type React from "react"
import { useState, useCallback } from "react"
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  TabList,
  Tab,
  type TabValue,
  type SelectTabData,
  type SelectTabEvent,
  Badge,
  Spinner,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  makeStyles,
  tokens,
  shorthands,
  Body1,
  Caption1,
  Caption1Strong,
  Body1Strong,
  Subtitle2,
  Dropdown,
  Option,
  type DropdownProps,
} from "@fluentui/react-components"
import {
  DocumentRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  DismissRegular,
  SaveRegular,
  CloudAddRegular,
  DeleteRegular,
  EditRegular,
} from "@fluentui/react-icons"
import { AzureAIService } from "../../Services/AzureAIService"
import { AzureBlobService } from "../../Services/AzureBlobService"

import { ResumeUploadProps, UploadedFile, ResumeMetadata } from "../../Types/resume"
import FileUploadArea from "../Components/FileUploadArea"
import ResumeForm from "../Components/ResumeForm"
import { createApplicant, deleteApplicant, updateApplicantBlobUrl } from "../../Services/Resume"
import { useAuth } from "../../Auth/AuthProvider"

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    
    gap: tokens.spacingVerticalXL,
    maxWidth: "1400px",
    margin: "0 auto",
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: "93vh",
  },

  headerCard: {
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorBrandBackground} 100%)`,
    border: "none",
    boxShadow: tokens.shadow16,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },

  headerContent: {
    color: tokens.colorNeutralForegroundOnBrand,
    "& .fui-Text": {
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },

  messageBarEnhanced: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
    ...shorthands.border("1px", "solid", tokens.colorTransparentStroke),
  },

  processCard: {
    background: `linear-gradient(145deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    boxShadow: tokens.shadow16,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
  },

  tabFileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeBase200,
  },

  tabStatus: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    flexWrap: "wrap",
  },

  statusIcon: {
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalXXL),
    background: `linear-gradient(145deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: `inset ${tokens.colorNeutralShadowAmbient}`,
  },

  actionButtons: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalXL,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    background: `linear-gradient(135deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    // boxShadow: tokens.shadow16,
    // ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
  },

  summaryCard: {
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorCompoundBrandBackground} 100%)`,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
  },

  tabListContainer: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch", // for smooth scrolling on iOS
    scrollbarWidth: "thin", // Firefox
    "&::-webkit-scrollbar": {
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: tokens.colorNeutralBackground1,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStrokeAccessible,
      borderRadius: tokens.borderRadiusCircular,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.colorNeutralStrokeAccessibleHover,
    },
  },

  progressBarEnhanced: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    overflow: "hidden",
    height: "8px",
    boxShadow: `inset 0 1px 3px ${tokens.colorNeutralShadowAmbient}`,
  },

  batchProgressContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.margin(tokens.spacingVerticalM, "0", "0", "0"),
  },

  primaryActionButton: {
    background: `linear-gradient(135deg, ${tokens.colorCompoundBrandBackground} 0%, ${tokens.colorCompoundBrandBackgroundHover} 100%)`,
    border: "none",
    boxShadow: tokens.shadow8,
    fontWeight: tokens.fontWeightSemibold,
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: tokens.shadow16,
    },
  },

  subtleButton: {
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      boxShadow: tokens.shadow4,
    },
  },

  errorContainer: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    ...shorthands.border("1px", "solid", tokens.colorPaletteRedBorder1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    color: tokens.colorPaletteRedForeground1,
  },
})

export const EnhancedResumeUpload: React.FC<ResumeUploadProps> = ({ jobPosting, onSaveComplete }) => {
  const styles = useStyles()
  const toasterId = useId("toaster")
  const { dispatchToast } = useToastController(toasterId)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedTabValue, setSelectedTabValue] = useState<TabValue>("")
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const { currentUser,accessToken }: any = useAuth();
  
  const blobService = new AzureBlobService()
  const aiService = new AzureAIService()

  const showToast = (type: "success" | "error", title: string, message: string) => {

    // console.log(title, message)
    dispatchToast(
      <Toast>
        <ToastTitle
          media={type === "success" ? <CheckmarkCircleRegular /> : <ErrorCircleRegular />}
        >
          {title}
        </ToastTitle>
        <ToastBody subtitle={message} />
      </Toast>,
      { intent: type, timeout: type === "error" ? 8000 : 4000 }
    )
  }

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTabValue(data.value)
  }

  const processFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return

    setIsProcessing(true)
    setMessage(null)

    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
    setSelectedFiles([])

    if (!selectedTabValue && newFiles.length > 0) {
      setSelectedTabValue(newFiles[0].id)
    }

    setBatchProgress({ current: 0, total: newFiles.length })

    for (let index = 0; index < newFiles.length; index++) {
      const uploadedFile = newFiles[index]
      setBatchProgress({ current: index + 1, total: newFiles.length })

      try {
        // Step 1: Upload to temp storage
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "uploading", progress: 0 } : f)),
        )

        const tempId = `temp_${Date.now()}_${uploadedFile.id}`

        // Upload to temporary blob storage
        const tempBlobResult = await blobService.uploadToTemp(
          uploadedFile.file, 
          jobPosting.id, 
          tempId,accessToken
        )

        // console.log("temp blob result",tempBlobResult)

        // Update progress for upload completion
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: 50, tempBlobPath: tempBlobResult.blobPath } : f)),
        )

        // Step 2: Process with AI
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: "processing", progress: 60 } : f)),
        )

        // Extract resume data using Azure AI
        const extractedData = await aiService.extractResumeData(
          tempBlobResult.url,
          uploadedFile.file.name,accessToken
        )

        // Update progress for AI processing
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress: 80 } : f)),
        )

        // Step 3: Validate and enhance extracted data
        const validatedData = await aiService.validateResumeData(extractedData,accessToken)
// console.log(validatedData)
        // Add additional metadata
        const finalData: ResumeMetadata = {
          ...validatedData,
          jobPostingId: jobPosting.id,
          fileName: uploadedFile.file.name,
          fileSize: uploadedFile.file.size,
          uploadDate: new Date(),
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                ...f,
                status: "completed",
                progress: 100,
                extractedData: finalData,
                tempBlobPath: tempBlobResult.blobPath,
              }
              : f,
          ),
        )

      } catch (error) {
        console.error("Processing error:", error)

        // Clean up temp file if it was uploaded
        const failedFile = uploadedFiles.find(f => f.id === uploadedFile.id)
        if (failedFile?.tempBlobPath) {
          try {
            await blobService.deleteFromBlob(failedFile.tempBlobPath, true,accessToken)
          } catch (cleanupError) {
            console.error("Failed to cleanup temp file:", cleanupError)
          }
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                ...f,
                status: "error",
                errorMessage: error instanceof Error ? error.message : "Failed to process resume",
              }
              : f,
          ),
        )
      }
    }

    setBatchProgress(null)
    setIsProcessing(false)
  }, [selectedFiles, jobPosting.id, selectedTabValue])

  const removeFile = async (fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId)

    // Clean up temp file if it exists
    if (fileToRemove?.tempBlobPath) {
      try {
        await blobService.deleteFromBlob(fileToRemove.tempBlobPath, true,accessToken)
      } catch (error) {
        console.error("Failed to cleanup temp file:", error)
      }
    }

    setUploadedFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId)

      if (selectedTabValue === fileId) {
        if (newFiles.length > 0) {
          const nextFile = newFiles.find((f) => f.status === "completed") || newFiles[0]
          setSelectedTabValue(nextFile.id)
        } else {
          setSelectedTabValue("")
        }
      }

      return newFiles
    })
  }

  const handleLocalSave = (fileId: string, data: ResumeMetadata) => {
    setUploadedFiles((prev)=>{
      return prev.map((f)=>
        f.id === fileId ? { ...f, extractedData: data } : f
      )
    })

    
  }

  const handleSaveResume = async (fileId: string, data: ResumeMetadata) => {
  try {
    const uploadedFile = uploadedFiles.find((f) => f.id === fileId)
    if (!uploadedFile || !uploadedFile.tempBlobPath) {
      throw new Error("File not found or not properly uploaded")
    }

    setMessage({ type: "success", text: "Saving resume..." })

    // STEP 1: Save to database FIRST (with temp blob URL)
    const tempBlobUrl = uploadedFile.tempBlobPath // Use temp path for now
    
    const result:any = await createApplicant({
      ...data,
      blobUrl: tempBlobUrl, // Use temp URL initially
      blobPath: uploadedFile.tempBlobPath,
      createdByUserID: currentUser.userID
    })

    // Check if the API returned an error response
    if (result && typeof result === 'object' && 'success' in result && !result.success) {
      throw new Error("Failed to save resume to database")
    }

    const savedId = result.data.data?.applicantId // Get the saved ID

    // STEP 2: Now that DB save succeeded, move to permanent storage
    const permanentBlobResult = await blobService.moveToPermStorage(
      uploadedFile.tempBlobPath,
      jobPosting.id,
      uploadedFile.file.name,
      accessToken
    )

    // STEP 3: Update the database with permanent blob URL
    await updateApplicantBlobUrl(savedId, {
      blobPath: permanentBlobResult.blobPath,
      blobUrl: permanentBlobResult.url    },accessToken)

    // Update the uploaded file with permanent storage info
    setUploadedFiles((prev: any) =>
      prev.map((f: any) =>
        f.id === fileId
          ? {
            ...f,
            extractedData: {
              ...data,
              id: savedId,
              blobUrl: permanentBlobResult.url,
              blobPath: permanentBlobResult.blobPath,
            },
            tempBlobPath: undefined, // Clear temp path since it's moved
            permanentBlobPath: permanentBlobResult.blobPath,
          }
          : f,
      ),
    )

    showToast("success", "Resume Saved", "Resume saved successfully to database!")
    setMessage({ type: "success", text: "Resume saved successfully!" })
    setTimeout(() => setMessage(null), 3000)

    return true

  } catch (error) {
    console.error("Save error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to save resume. Please try again."

    showToast("error", "Save Failed", errorMessage)
    setMessage({ type: "error", text: errorMessage })
    setTimeout(() => setMessage(null), 5000)

    throw error
  }
}

  const handleSaveAll = async () => {
    try {
      const completedResumes = uploadedFiles.filter(
        (f) => f.status === "completed" && f.extractedData && !f.permanentBlobPath
      )

      if (completedResumes.length === 0) {
        showToast("error", "No Resumes to Save", "No completed resumes found that are ready to save to database.")
        return
      }

      setMessage({ type: "success", text: `Saving ${completedResumes.length} resumes...` })

      const savedResumes: ResumeMetadata[] = []
      const failedResumes: { name: string; error: string }[] = []

      for (const uploadedFile of completedResumes) {
        if (uploadedFile.extractedData) {
          try {
            const success = await handleSaveResume(uploadedFile.id, uploadedFile.extractedData)
            if (success) {
              savedResumes.push(uploadedFile.extractedData)
            }
          } catch (error) {
            console.error(`Failed to save resume ${uploadedFile.id}:`, error)
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
            failedResumes.push({
              name: uploadedFile.file.name,
              error: errorMessage
            })
          }
        }
      }

    // Only clean up temp files if ALL saves were successful
    if (failedResumes.length === 0) {
      try {
        await blobService.cleanupTempFiles(jobPosting.id,accessToken)
      } catch (cleanupError) {
        console.error("Failed to cleanup temp files:", cleanupError)
      }
    }

    // Handle results based on success/failure counts
    if (savedResumes.length === 0) {
      // All saves failed
      const errorDetails = failedResumes.map(f => `${f.name}: ${f.error}`).join("; ")
      showToast(
        "error",
        "Save Failed",
        `Failed to save all ${completedResumes.length} resumes. ${errorDetails}`
      )
      setMessage({ type: "error", text: "Failed to save all resumes to database." })

    } else if (failedResumes.length > 0) {
      // Partial success
      const failedNames = failedResumes.map(f => f.name).join(", ")
      const firstError = failedResumes[0]?.error || "Unknown error"

      showToast(
        "error",
        "Partial Save Success",
        `Saved ${savedResumes.length} resumes successfully, but ${failedResumes.length} failed. First error: ${firstError}`
      )
      setMessage({
        type: "error",
        text: `Saved ${savedResumes.length} resumes, but ${failedResumes.length} failed. Check for duplicate emails.`
      })

      // Call onSaveComplete with successfully saved resumes only
      onSaveComplete?.(savedResumes)

    } else {
      // Complete success
      showToast(
        "success",
        "Save Successful",
        `Successfully saved all ${savedResumes.length} resumes to the database!`
      )
      setMessage({ type: "success", text: `Successfully saved ${savedResumes.length} resumes to database!` })
      onSaveComplete?.(savedResumes)
    }

    } catch (error) {
      console.error("Save all error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while saving resumes."

      showToast(
        "error",
        "Save Operation Failed",
        `Failed to complete save operation: ${errorMessage}`
      )
      setMessage({ type: "error", text: "Failed to save resumes. Please try again." })
    }
  }

  const handleDeleteResume = async (fileId: string) => {
    try {
      const uploadedFile = uploadedFiles.find((f) => f.id === fileId)
      if (!uploadedFile) return

      // Delete from permanent storage if it exists
      if (uploadedFile.permanentBlobPath) {
        await blobService.deleteFromBlob(uploadedFile.permanentBlobPath, false,accessToken)
      }

      // Delete from temp storage if it exists
      if (uploadedFile.tempBlobPath) {
        await blobService.deleteFromBlob(uploadedFile.tempBlobPath, true,accessToken)
      }

      // Delete from SQL database if it was saved
      // if (uploadedFile.extractedData?.id) {
      //   await deleteApplicant(uploadedFile.extractedData.id)
      // }

      removeFile(fileId)
      setMessage({ type: "success", text: "Resume deleted successfully!" })
    } catch (error) {
      console.error("Delete error:", error)
      setMessage({ type: "error", text: "Failed to delete resume. Please try again." })
    }
  }



  const toggleEdit = (fileId: string) => {
    setEditingStates((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }))
  }

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
      case "uploading":
      case "processing":
        return <Spinner size="tiny" className={styles.statusIcon} />
      case "completed":
        return <CheckmarkCircleRegular className={styles.statusIcon} style={{ color: tokens.colorPaletteGreenForeground1 }} />
      case "error":
        return <ErrorCircleRegular className={styles.statusIcon} style={{ color: tokens.colorPaletteRedForeground1 }} />
    }
  }

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "uploading":
        return "Uploading to temp storage..."
      case "processing":
        return "Processing with AI..."
      case "completed":
        return "Ready to save"
      case "error":
        return "Error"
    }
  }

  const clearAll = async () => {
    // Clean up temp files before clearing
    for (const file of uploadedFiles) {
      if (file.tempBlobPath) {
        try {
          await blobService.deleteFromBlob(file.tempBlobPath, true,accessToken)
        } catch (error) {
          console.error("Failed to cleanup temp file:", error)
        }
      }
    }

    // Clean up temp files by job ID
    try {
      await blobService.cleanupTempFiles(jobPosting.id,accessToken)
    } catch (error) {
      console.error("Failed to cleanup temp files by job ID:", error)
    }

    setUploadedFiles([])
    setSelectedTabValue("")
    setEditingStates({})
    setMessage({ type: "success", text: "All files cleared and temp storage cleaned up." })
    setTimeout(() => setMessage(null), 2000)
  }

  const completedCount = uploadedFiles.filter((f) => f.status === "completed").length
  const totalCount = uploadedFiles.length
  const unsavedCount = uploadedFiles.filter((f) => f.status === "completed" && !f.permanentBlobPath).length

  return (
    <div className={`${styles.container} min-h-screen `} style={{ alignItems: 'flex-end' }}>
      <Toaster toasterId={toasterId} />

      {/* Enhanced Message Bar */}
      {message && (
        <MessageBar
          intent={message.type === "success" ? "success" : "error"}
          className={styles.messageBarEnhanced}
        >
          <MessageBarBody>
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckmarkCircleRegular className="text-lg" />
              ) : (
                <ErrorCircleRegular className="text-lg" />
              )}
              {message.text}
            </div>
          </MessageBarBody>
        </MessageBar>
      )}

      {/* File Upload Area - Enhanced */}
      <div style={{ width: '100%' }}>
        <FileUploadArea onFilesSelected={setSelectedFiles} selectedFiles={selectedFiles} maxFiles={10} />
      </div>

      {/* Enhanced Process Files Button */}
      {selectedFiles.length > 0 && (
        <Card style={{ boxShadow: `${!isProcessing && 'none'}`, width: '100%' }}>
          <CardPreview>
            <div className="text-center p-4 !flex justify-end">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-8 h-full">
                                                            <Spinner />
                                                            <Body1Strong className="mt-2">Processing...</Body1Strong>
                                                          </div>
                
              ) : (
                <button
                  onClick={processFiles}
                  disabled={isProcessing}
                  className="group/name relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium cursor-pointer"
                >
                  <span className="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-[30px] text-white border-none" style={{ background: "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)", padding: '14px 20px' }}>
                    <div className="text-[#ffffff]">
                      {`Process ${selectedFiles.length} Resume with AI`}
                    </div>
                  </span>
                </button>

              )}

              {batchProgress && (
                <div className={styles.batchProgressContainer}>
                  <div className="flex items-center gap-3">
                    <Spinner size="small" />
                    <Text size={400} weight="medium">
                      Processing file {batchProgress.current} of {batchProgress.total}
                    </Text>
                  </div>
                  <ProgressBar
                    value={batchProgress.current / batchProgress.total}
                    className="w-80"
                  />
                  <Text size={200} className="opacity-70">
                    Uploading to temp storage → AI extraction → Data validation
                  </Text>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
      )}

      {/* Enhanced Resume Tabs */}
      {/* Enhanced Resume Dropdown Selection */}
      {uploadedFiles.length > 0 && (
        <Card style={{ boxShadow: 'none', width: '100%' }}>
          <CardHeader
            header={
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <DocumentRegular className="text-xl" />
                  <Text weight="semibold" size={300}>
                    Resume Management
                  </Text>
                  <Badge color="brand">
                    {totalCount} Files
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Badge size="large" color="brand">
                    <CheckmarkCircleRegular />&nbsp;
                    <Text size={200}>
                      Processed: {completedCount} / {totalCount}
                    </Text>
                  </Badge>
                  {unsavedCount > 0 && (
                    <Badge size="large" color="warning">
                      <SaveRegular />&nbsp;
                      <Text size={200}>
                        Unsaved: {unsavedCount}
                      </Text>
                    </Badge>
                  )}
                </div>
              </div>
            }
          />
          <CardPreview>
            {/* Dropdown for Resume Selection */}
            <div className="flex items-center gap-3">
              <Dropdown
                placeholder="Select a resume to view"
                value={
                  uploadedFiles.find((f) => f.id === selectedTabValue)?.file.name ||
                  "Select a resume"
                }
                selectedOptions={[selectedTabValue as string]}
                onOptionSelect={(_, data) => {
                  setSelectedTabValue(data.optionValue as TabValue)
                }}
                className="flex-1"
                style={{ minWidth: "300px" }}
              >
                {uploadedFiles.map((uploadedFile) => (
                  <Option
                    key={uploadedFile.id}
                    value={uploadedFile.id}
                    text={uploadedFile.file.name}
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DocumentRegular className="text-lg flex-shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <Caption1Strong className="truncate">
                            {uploadedFile.file.name}
                          </Caption1Strong>
                          <Caption1 className="text-gray-500">
                            {(uploadedFile.file.size / 1024).toFixed(2)} KB
                          </Caption1>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          size="small"
                          color={
                            uploadedFile.status === "completed"
                              ? "success"
                              : uploadedFile.status === "error"
                                ? "danger"
                                : "informative"
                          }
                        >
                          {getStatusText(uploadedFile.status)}
                        </Badge>
                        {uploadedFile.status !== "completed" &&
                          uploadedFile.status !== "error" && (
                            <Text size={100} className="text-gray-500">
                              {uploadedFile.progress}%
                            </Text>
                          )}
                      </div>
                    </div>
                  </Option>
                ))}
              </Dropdown>

              {/* {selectedTabValue && (
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => {
              const fileId = selectedTabValue as string
              removeFile(fileId)
            }}
            className={styles.subtleButton}
          >
            Remove
          </Button>
        )} */}
            </div>

            {/* Progress bar for currently processing files */}
            {/* {uploadedFiles.some(
              (f) => f.status !== "completed" && f.status !== "error"
            ) && (
                <div className="mb-4 mt-4">
                  {uploadedFiles
                    .filter((f) => f.status !== "completed" && f.status !== "error")
                    .map((uploadedFile) => (
                      <div key={uploadedFile.id} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <Caption1Strong className="flex items-center gap-2">
                            {getStatusIcon(uploadedFile.status)}
                            {uploadedFile.file.name}
                          </Caption1Strong>
                          <Caption1 className="text-gray-500">
                            {uploadedFile.progress}%
                          </Caption1>
                        </div>
                        <ProgressBar
                          value={uploadedFile.progress / 100}
                          className="w-full"
                        />
                      </div>
                    ))}
                </div>
              )} */}

            {/* Resume Form Display */}
            <div>
              {uploadedFiles.map(
                (uploadedFile) =>
                  selectedTabValue === uploadedFile.id && (
                    <div key={uploadedFile.id}>
                      {uploadedFile.extractedData ? (
                        <ResumeForm
                          resumeData={uploadedFile.extractedData}
                          onSave={(data: any) => handleLocalSave(uploadedFile.id, data)}
                          onDelete={() => handleDeleteResume(uploadedFile.id)}
                          isEditing={editingStates[uploadedFile.id] || false}
                          onToggleEdit={() => toggleEdit(uploadedFile.id)}
                          mode="portal"
                        />
                      ) : uploadedFile.status === "error" ? (
                        <div className={`${styles.loadingContainer} ${styles.errorContainer}`}>
                          <ErrorCircleRegular className="text-5xl" />
                          <Text size={500} weight="semibold">
                            Processing Failed
                          </Text>
                          <Text size={400} className="text-center max-w-md">
                            {uploadedFile.errorMessage || "An error occurred while processing this resume. Please try uploading again."}
                          </Text>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => removeFile(uploadedFile.id)}
                              icon={<DeleteRegular />}
                            >
                              Remove File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.loadingContainer}>
                          <div className="flex flex-col items-center justify-center py-8 h-full">
                                                            <Spinner />
                                                            <Body1Strong className="mt-2"> {uploadedFile.status === "uploading"
                              ? "Uploading to Temp Storage..."
                              : "AI Processing in Progress..."}</Body1Strong>
                               <Caption1 className="text-center max-w-md opacity-70">
                            {uploadedFile.status === "uploading"
                              ? "Securely uploading your file to temporary cloud storage..."
                              : "Our AI is analyzing the resume and extracting key information..."}
                          </Caption1>
                                                          </div>
                          
                         
                          <ProgressBar
                            value={uploadedFile.progress / 100}
                            className="w-96"
                          />
                          <Text size={200} className="opacity-50">
                            {uploadedFile.progress}% Complete
                          </Text>
                        </div>
                      )}
                    </div>
                  ),
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className={styles.actionButtons} style={{ padding: '0', margin: '0', display: 'flex', justifyContent: 'flex-end', height: '1px' }}>
                {/* <Card className="flex flex-col items-center" style={{ boxShadow: 'none' }}>
            <CardHeader
              image={<CheckmarkCircleRegular className="text-green-500" />}
              action={
                <Button
                  appearance="subtle"
                  onClick={clearAll}
                  className={styles.subtleButton}
                  icon={<DismissRegular />}
                >
                  Clear All
                </Button>
              }
              header={
                <Body1Strong>
                  {unsavedCount} resume{unsavedCount !== 1 ? "s" : ""} ready to save to database
                </Body1Strong>
              }
            />
          </Card> */}

                
                  <Button
                    appearance="primary"
                    icon={<SaveRegular />}
                    onClick={handleSaveAll}
                    className={styles.primaryActionButton}
                    disabled={Object.values(editingStates).filter((item)=>item === true).length>0}
                    style={{ minWidth: '30%', padding: '12px', borderRadius: '30px', margin: '0', position: 'relative', bottom: '25px', color:Object.values(editingStates).filter((item)=>item === true).length>0?"gray":"#FFF" ,background:Object.values(editingStates).filter((item)=>item === true).length>0?"#d9dbda" : "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)" }}
                  >
                    Save All to Database ({unsavedCount})
                  </Button>
                
              </div>
            )}
          </CardPreview>
        </Card>
      )}
    </div>
  )
}
import { useState, useMemo, createContext, useEffect, useRef } from "react";
import {
  Button,
  FluentProvider,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  ToastBody,
  ToastIntent,
  Subtitle2,
  Spinner,
  Text,
  SearchBox,
  Body1Strong,
  Caption1,
} from "@fluentui/react-components";
import { CreateJobModal } from "../Components/JobPosting/CreateJobModal";
import { EmptyState } from "../Components/JobPosting/EmptyState";
import { JobPostingTable } from "../Components/JobPosting/JobPostingCard";

import { ToneModal } from "../Components/JobPosting/ToneModal";
import { getActiveJobPrompt } from "../../Services/JobPrompt";
import {
  approveSuggestion,
  getAllJobPostings,
  rejectSuggestion,
} from "../../Services/JobPosting";

import { useAuth } from "../../Auth/AuthProvider";
import {
  Add12Filled,
  PersonRegular,
  StarSettings24Regular,
} from "@fluentui/react-icons";

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  department?: string;
  departmentCode?: string;
  skills: string[];
  additionalResponsibilities: string[];
  status: "active" | "draft";
  createdAt: Date;
  modifiedAt: Date;
  createdBy?: string;
  createdByUserId?: string;
  modifiedByUserId?: string;
  jobCode?: string;
  modifiedBy?: string;
  hasPendingSuggestions?: boolean;
  optionalUser?:string,
  optionalUserId?:string,
  departmentId?:string | null,
  pendingSuggestions?: Array<{
    ID: string;
    SuggestedDescription: string;
    SuggestedByUserID: string;
    SuggestedAt: string;
    SuggestedBy?: string;
    Status: "pending" | "approved" | "rejected";
  }>;
  preparationMaterial?: {id:string, name:string, url:string}[];
}

export interface ChangeLog {
  id: string;
  jobPostingId: string;
  type:
    | "description_change"
    | "skills_change"
    | "status_change"
    | "suggestion_approved";
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedByUserId: string;
  suggestedBy?: string;
  suggestedByUserId?: string;
  changedAt: Date;
}

export interface Filters {
  status?: string;
  search?: string;
}

export let toneContext = createContext("");

const JobPosting = () => {
  const { currentUser, accessToken }: any = useAuth();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTone, setCurrentTone] = useState("");
  const [toneMode, setToneMode] = useState<"add" | "edit">("edit");
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof JobPosting;
    direction: "asc" | "desc";
  } | null>(null);

  const { dispatchToast } = useToastController();

  // Refs for debouncing
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Toast helper functions
  const showSuccessToast = (title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent: "success" as ToastIntent }
    );
  };

  const showErrorToast = (title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent: "error" as ToastIntent }
    );
  };

  const showInfoToast = (title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent: "info" as ToastIntent }
    );
  };

  const handleSort = (key: keyof JobPosting, direction: "asc" | "desc") => {
    setSortConfig({ key, direction });
  };

  // Apply sorting to filtered jobs
  const sortedAndFilteredJobs = useMemo(() => {
    let filtered = jobPostings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.skills.some((skill) => skill.toLowerCase().includes(query)) ||
          (job.createdBy && job.createdBy.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;

        if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        }

        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [jobPostings, statusFilter, searchQuery, sortConfig]);

  // Transform API data to match component interface
  const transformApiDataToJobPosting = (apiData: any): JobPosting => {
    return {
      id: apiData.id,
      title: apiData.title,
      description: apiData.description,
      department: apiData.department || "", 
      skills: apiData.skills || [],
      jobCode: apiData.jobCode || "",
      additionalResponsibilities: apiData.additionalResponsibilities || [],
      status: apiData.status,
      createdBy: apiData.createdBy || "",
      modifiedBy: apiData.modifiedBy || "",
      createdAt: new Date(apiData.createdAt),
      modifiedAt: new Date(apiData.modifiedAt),
      createdByUserId: apiData.createdByUserId,
      modifiedByUserId: apiData.modifiedByUserId,
      optionalUser: apiData.optionalUser || null,
      optionalUserId:apiData.optionalUserId || null,
      hasPendingSuggestions: apiData.hasPendingSuggestions || false,
      pendingSuggestions: apiData.pendingSuggestions || [],
      preparationMaterial: apiData.preparationMaterial || [],
    };
  };

  // Fetch job description from API
  const fetchJobPostings = async (filters: Filters = {}, showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getAllJobPostings(filters, accessToken);

      if (response.success && response.data) {
        const transformedData = response.data.map(transformApiDataToJobPosting);
        setJobPostings(transformedData);
      } else {
        setError(response.error || "Failed to fetch job descriptions");
        setJobPostings([]);
        showErrorToast(
          "Error",
          response.error || "Failed to fetch job description"
        );
      }
    } catch (err) {
      console.error("Error fetching job descriptions:", err);
      setError("An unexpected error occurred while fetching job descriptions");
      setJobPostings([]);
      showErrorToast(
        "Error",
        "An unexpected error occurred while fetching job descriptions"
      );
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  // Handle search with transition effect
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setIsTransitioning(true);

    // Clear existing timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Set transition timeout
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      const filters: Filters = {};

      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      if (value.trim()) {
        filters.search = value.trim();
      }

      fetchJobPostings(filters, false);
    }, 300);
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Load tone/prompt
      try {
        if (!currentTone) {
          const storedTone = await getActiveJobPrompt(accessToken).then(
            (res) => res.data.Prompt
          );
          if (storedTone) {
            setCurrentTone(storedTone);
          }
        }
      } catch (err) {
        console.error("Error loading tone:", err);
      }

      // Load job descriptions
      await fetchJobPostings();
    };

    loadInitialData();
  }, []);

  // Refetch when status filter changes
  useEffect(() => {
    const filters: Filters = {};

    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }

    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }

    fetchJobPostings(filters, false);
  }, [statusFilter]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateJob = (
    newJob: Omit<JobPosting, "id" | "createdAt" | "modifiedAt">
  ) => {
    console.log("Job creation handled by modal");
  };

  // Add new job to the list when created via API
  const handleJobCreated = async (newJob: JobPosting) => {
    showSuccessToast(
      "Job Created",
      `"${newJob.title}" has been created successfully.`
    );
    // Refresh the data to ensure consistency
    await fetchJobPostings(
      {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      },
      false
    );
  };

  const handleUpdateJob = async (updatedJob: JobPosting) => {
    showSuccessToast(
      "Job Updated",
      `"${updatedJob.title}" has been updated successfully.`
    );
    // Refresh the data to ensure consistency
    await fetchJobPostings(
      {
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      },
      false
    );
  };

  const handleApproveSuggestion = async (
    jobId: string,
    suggestionId: string,
    approvedBy: string
  ) => {
    try {
      const job = jobPostings.find((j) => j.id === jobId);
      const jobTitle = job?.title || "Job";
      const response = await approveSuggestion(
        suggestionId,
        currentUser.userID,
        accessToken
      );
      if (!response.success) {
        showErrorToast("Error", "Failed to approve suggestion");
        return;
      }
      showSuccessToast(
        "Suggestion Approved",
        `Suggestion for "${jobTitle}" has been approved.`
      );
      await fetchJobPostings(
        {
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        },
        false
      );
    } catch (error) {
      showErrorToast(
        "Error",
        "Failed to approve suggestion. Please try again."
      );
      console.error("Error approving suggestion:", error);
    }
  };

  const handleRefresh = () => {
    fetchJobPostings({
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery.trim() || undefined,
    });
  };

  const handleRejectSuggestion = async (
    jobId: string,
    suggestionId: string
  ) => {
    try {
      const job = jobPostings.find((j) => j.id === jobId);
      const jobTitle = job?.title || "Job";
      const response = await rejectSuggestion(
        suggestionId,
        currentUser.userID,
        accessToken
      );
      if (!response.success) {
        showErrorToast("Error", "Failed to reject suggestion");
        return;
      }
      showInfoToast(
        "Suggestion Rejected",
        `Suggestion for "${jobTitle}" has been rejected.`
      );
      await fetchJobPostings(
        {
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
        },
        false
      );
    } catch (error) {
      showErrorToast("Error", "Failed to reject suggestion. Please try again.");
      console.error("Error rejecting suggestion:", error);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    // The useEffect for statusFilter will trigger a refetch
  };

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <Toaster />
      <div className="min-h-screen">
        <toneContext.Provider value={currentTone}>
          <div className="mx-auto">
            {/* Header controls */}
            <div className="flex justify-between items-center pb-4">
              <div>
                <Subtitle2 className="text-[#063762]">
                  Job Role Library
                  <div>
                    <Caption1 className="text-gray-600">
                      Define and maintain standard position templates
                    </Caption1>
                  </div>
                </Subtitle2>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
              <div className="flex items-center gap-4 w-full md:w-1/4">
                <div className="relative w-full">
                  <SearchBox
                    className={`w-full transition-all duration-200 ${
                      isTransitioning
                        ? "opacity-70 scale-[0.99]"
                        : "opacity-100 scale-100"
                    } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                    disabled={isLoading}
                    placeholder="Search by title, skill or creator..."
                    value={searchQuery}
                    onChange={(_, data) => handleSearchChange(data.value)}
                  />
                  {isTransitioning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none rounded" />
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  appearance="primary"
                  onClick={() => setIsCreateModalOpen(true)}
                  shape="circular"
                  icon={
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                      <Add12Filled />
                    </div>
                  }
                  className=" hover:bg-indigo-700 shadow  !bg-white/50 !text-[#626262] border-1 !border-white"
                  disabled={isLoading}
                >
                  Create Job Role
                </Button>
                <Button
                  appearance="secondary"
                  onClick={() => setIsToneModalOpen(true)}
                  disabled={isLoading}
                  shape="circular"
                  icon={
                    <div className="w-5 h-5 flex items-center justify-center">
                      <StarSettings24Regular style={{ color: "#0153A5" }} />
                    </div>
                  }
                >
                  Manage Prompt
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
                <Button
                  appearance="secondary"
                  onClick={handleRefresh}
                  className="mt-2"
                  shape="circular"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="mt-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 h-full">
                  <Spinner />
                  <Body1Strong className="mt-2">
                    Loading Job Role Library...
                  </Body1Strong>
                </div>
              ) : error ? (
                <EmptyState
                  type="no-results"
                  onAction={handleRefresh}
                  searchQuery="Error occurred"
                />
              ) : sortedAndFilteredJobs.length > 0 ? (
                <JobPostingTable
                  jobs={sortedAndFilteredJobs}
                  onUpdate={handleUpdateJob}
                  onApproveSuggestion={handleApproveSuggestion}
                  onRejectSuggestion={handleRejectSuggestion}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                />
              ) : (
                <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                    <PersonRegular className="w-10 h-10 text-blue-600" />
                  </div>
                  <Subtitle2 className="mb-3 text-gray-700">
                    No job Description found
                  </Subtitle2>
                  <div className="text-center">
                    <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                      {searchQuery || statusFilter !== "all"
                        ? "We couldn't find any job descriptions matching your criteria. Try adjusting your search or filters."
                        : "There are no job descriptions to display yet. Create your first one to get started."}
                    </Text>
                  </div>

                  {(searchQuery || statusFilter !== "all") && (
                    <Button
                      appearance="primary"
                      onClick={clearFilters}
                      className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 !mt-2"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            <CreateJobModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={handleCreateJob}
              onJobCreated={handleJobCreated} // Pass the callback to update the list
            />
            <ToneModal
              isOpen={isToneModalOpen}
              onClose={() => setIsToneModalOpen(false)}
              mode={toneMode}
            />
          </div>
        </toneContext.Provider>
      </div>
    </FluentProvider>
  );
};

export default JobPosting;

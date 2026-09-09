import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export interface InductionFormData {
  employeeName: string;
  group: string;
  designation: string;
  location: string;
  mailId: string;
  doj: string;
  status: string;
  userId:string
}

export interface AssignedUser {
  id: string;
  name: string;
  email: string;
}

export interface InductionTask {
  id: string;
  taskDescription: string;
  isQuantity: boolean;
  quantity: number;
  isRequired: boolean;
  completed: boolean;
  remarks: string;
  assignedTo: string;
  emailID: string;
  isConfiguration: boolean,
  configurationType: string | null,
  remainderDate: Date | null;
  remainderCount: number;
  isConfigured: boolean;
  assignedUsers?: AssignedUser[];
  completedByName?: string;

  completedByEmailID?: string;
  completedByUserID?: string;
  completedAt?: Date | null;
}

export interface InductionTaskDetail extends InductionTask {
  taskDetailId?: string;
  completedAt?: Date | null;
  InductionTaskID?: string;
  TaskDescription?: string;
  Quantity?: number;
  IsRequired?: boolean;
  IsCompleted?: boolean;
  CompletedByName?: string;
  CompletedByEmail?: string;
  CompletedAt?: string;
  Remarks?: string;
  ReminderDate?: string;
  ReminderCount?: number;
}

export interface InductionListItem {
  id: string;
  inductionCode: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  designation: string;
  location: string;
  dateOfJoining: string;
  status: string;
  createdByName: string;
  createdAt: string;
}

export interface InductionDetail {
  induction: {
    ID: string;
    InductionCode: string;
    EmployeeName: string;
    EmployeeEmail: string;
    Department: string;
    Designation: string;
    Location: string;
    DateOfJoining: string;
    Status: string;
    CreatedByUserID?: string;
    CreatedByName?: string;
    CreatedByEmail?: string;
    CreatedAt: string;
    ModifiedAt?: string;
    ModifiedByUserID?: string;
    WorkEmail?:string;
    EmployeeId?:string
  };
  tasks: Array<{
    ID: string;
    InductionID: string;
    InductionTaskID: string;
    TaskDescription: string;
    Quantity: number;
    IsRequired: boolean;
    IsCompleted: boolean;
    CompletedByUserID?: string;
    CompletedByName?: string;
    CompletedByEmail?: string;
    CompletedAt?: string;
    Remarks?: string;
    ReminderDate?: string;
    ReminderCount: number;
    TaskCode?: string;
    Days?: number;
    AssignedUsers?: string;
    AssignedTo?: string;
    EmailID?: string;
    assignedUsers?: AssignedUser[];
  }>;
}

export interface HiredEmployee {
  CandidateID:string,
  CandidateName:string,
  CandidateEmail:string,
  CandidatePhone:string,
  Department:string,
  Desination:string,
  Location:string,
  DateOfJoining:Date,
  JobRole: string
}

// A partial success the caller must act on — the request succeeded and committed,
// but a side effect did not (e.g. the AD user was created without its licences).
export interface ApiWarning {
  code?: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  warnings?: ApiWarning[];
}

class InductionAPI {
  private getAuthHeaders(accessToken: string) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    };
  }

  // Get active induction tasks for form
  async getInductionTasks(accessToken: string): Promise<InductionTask[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Induction/induction-tasks`,
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching induction tasks:", error);
      throw error;
    }
  }

  async getHiredUsers(
    query:string,
    accessToken:string
  ):Promise<ApiResponse<HiredEmployee[]>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Induction/getApplicantList/${query}`,
        
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error validating induction details:", error);
      throw error;
    }
  }

  async validateInductionDetails(
    userId: string,
    accessToken: string,

  ): Promise<any[]> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/Induction/validate-induction-details`,
        { userId },
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error validating induction details:", error);
      throw error;
    }
  }

  // Submit new induction
  async submitInduction(
    formData: InductionFormData,
    filteredTasks: InductionTask[],
    createdByUserId: string,
    accessToken: string
  ): Promise<ApiResponse<{ inductionId: string; inductionCode: string }>> {
    try {
      // Transform tasks to ensure assignedUsers is properly formatted
      const transformedTasks = filteredTasks.map((task) => ({
        ...task,
        assignedUsers:
          task.assignedUsers ||
          task.assignedTo
            .split(";")
            .filter((name) => name.trim())
            .map((name, index) => {
              const emails = task.emailID.split(";");
              return {
                id: `${task.id}-user-${index}`,
                name: name.trim(),
                email: emails[index]?.trim() || "",
              };
            }),
      }));

      const submitData = {
        userId:formData.userId,
        designation:formData.designation,
        doj:formData.doj,
        status:formData.status,
        filteredtask: transformedTasks,
        createdByUserId,
      };

      // console.log('submitted data', submitData);      

      const response = await axios.post(
        `${API_BASE_URL}/Induction/submit-induction`,
        submitData,
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting induction:", error);
      throw error;
    }
  }

  // Get inductions list with pagination and filtering
  async getInductions(
    params: {
      status?: string;
      searchTerm?: string;
      pageNumber?: number;
      pageSize?: number;
      sortBy?: string;
      sortDirection?: string;
    },
    accessToken: string
  ): Promise<{
    inductions: InductionListItem[];
    pagination: {
      totalCount: number;
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await axios.get(
        `${API_BASE_URL}/Induction/inductions?${queryParams.toString()}`,
        this.getAuthHeaders(accessToken)
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching inductions:", error);
      throw error;
    }
  }

  // Get single induction details by ID
  async getInductionById(
    inductionId: string,
    accessToken: string
  ): Promise<ApiResponse<InductionDetail>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Induction/induction/${inductionId}`,
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching induction by ID:", error);
      throw error;
    }
  }

  // Get single induction details (alias for backward compatibility)
  async getInductionDetails(
    inductionId: string,
    accessToken: string
  ): Promise<InductionDetail> {
    try {
      const response = await this.getInductionById(inductionId, accessToken);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to fetch induction details");
    } catch (error) {
      console.error("Error fetching induction details:", error);
      throw error;
    }
  }

  // Update induction task status.
  // adminToken (optional): delegated token from the admin app (User.ReadWrite.All) —
  // required when completing an email-configuration task that creates an Entra AD user.
  async updateTaskStatus(
    taskId: string,
    statusData: {
      isCompleted: boolean;
      completedByUserID?: string;
      completedByName?: string;
      completedByEmail?: string;
      remarks?: string;
      configurationKey?:string;
      configurationValue?: any;
      isConfiguration?:boolean;
    },
    accessToken: string,
    adminToken?: string
  ): Promise<ApiResponse<any>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      if (adminToken) {
        headers["x-admin-token"] = adminToken;
      }
      const response = await axios.put(
        `${API_BASE_URL}/Induction/induction-task/${taskId}/status`,
        statusData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }

  // Get current details of the AD user created for an email-configuration task (edit prefill)
  async getConfiguredADUserDetails(
    taskId: string,
    accessToken: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Induction/induction-task/${taskId}/ad-user-details`,
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching configured AD user details:", error);
      throw error;
    }
  }

  // Update the details of the AD user created for an email-configuration task.
  // adminToken: delegated token from the admin app (User.ReadWrite.All) — required
  // for the Entra AD writes, same as AD user creation in the Recruit flow.
  async updateConfiguredADUser(
    taskId: string,
    data: {
      configurationValue: any;
      modifiedByUserID?: string;
    },
    accessToken: string,
    adminToken?: string
  ): Promise<ApiResponse<any>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
      if (adminToken) {
        headers["x-admin-token"] = adminToken;
      }
      const response = await axios.put(
        `${API_BASE_URL}/Induction/induction-task/${taskId}/update-ad-user`,
        data,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating configured AD user:", error);
      throw error;
    }
  }

  // Update induction
  async updateInduction(
    inductionId: string,
    updateData: {
      employeeName: string;
      department: string;
      designation: string;
      location: string;
      dateOfJoining: string;
      status: string;
      modifiedByUserId: string;
    },
    accessToken: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/Induction/induction/${inductionId}`,
        updateData,
        this.getAuthHeaders(accessToken)
      );
      return response.data;
    } catch (error) {
      console.error("Error updating induction:", error);
      throw error;
    }
  }

  // Delete induction
  async deleteInduction(
    inductionId: string,
    deletedByUserId: string,
    accessToken: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/Induction/induction/${inductionId}`,
        {
          ...this.getAuthHeaders(accessToken),
          data: { deletedByUserId },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting induction:", error);
      throw error;
    }
  }

  // Helper method to transform task data from API to frontend format
  transformTaskData(apiTask: any): InductionTaskDetail {
    let assignedUsers: AssignedUser[] = [];

    // Parse assigned users if it's a string
    if (apiTask.AssignedUsers && typeof apiTask.AssignedUsers === "string") {
      try {
        assignedUsers = JSON.parse(apiTask.AssignedUsers);
      } catch (e) {
        console.error("Error parsing assigned users:", e);
      }
    } else if (apiTask.assignedUsers) {
      assignedUsers = apiTask.assignedUsers;
    }

    return {
      id: apiTask.InductionTaskID || apiTask.id,
      taskDetailId: apiTask.ID,
      taskDescription: apiTask.TaskDescription || apiTask.taskDescription,
      isQuantity: (apiTask.Quantity || apiTask.quantity) > 0,
      quantity: apiTask.Quantity || apiTask.quantity || 0,
      isRequired:
        apiTask.IsRequired !== undefined
          ? apiTask.IsRequired
          : apiTask.isRequired,
      isConfiguration: apiTask.IsConfiguration?apiTask.IsConfiguration:false,
      configurationType:  apiTask.ConfigurationTask?apiTask.ConfigurationTask:"",
      completed:
        apiTask.IsCompleted !== undefined
          ? apiTask.IsCompleted
          : apiTask.completed,
      remarks: apiTask.Remarks || apiTask.remarks || "",
      assignedTo: apiTask.AssignedTo || apiTask.assignedTo || "",
      emailID: apiTask.EmailID || apiTask.emailID || "",
      assignedUsers,
      remainderDate: apiTask.ReminderDate
        ? new Date(apiTask.ReminderDate)
        : null,
      remainderCount: apiTask.ReminderCount || apiTask.remainderCount || 0,
      completedByName: apiTask.CompletedByName || apiTask.completedByName || "",
      completedByEmailID:
        apiTask.CompletedByEmail || apiTask.completedByEmailID || "",
      completedAt: apiTask.CompletedAt || apiTask.completedAt,
      completedByUserID:
        apiTask.completedByUserID || apiTask.CompletedByUserID || "",
      isConfigured: apiTask.isConfigured || apiTask.IsConfigured || ""
    };
  }
}

export const createInductionNotification = async (
  formData: any,
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!formData || !UserDetails || !accessToken) {
      return {
        success: false,
        message:
          "Missing required parameters: formData, UserDetails, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/Induction/created-notification`,
      {
        formData: formData,
        UserDetails: UserDetails,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending induction notification:", error);
    return {
      success: false,
      message: "Failed to send induction notification",
      error: "error",
    };
  }
};

// Create and export a singleton instance
const inductionAPI = new InductionAPI();
export default inductionAPI;

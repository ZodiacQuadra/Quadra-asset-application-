import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "./UserAssignments";
import { InductionTask } from "./EmployeeInduction";
interface ADUserData {
  firstName: string;
  lastName: string;
  displayName: string;
  department: string;
  jobTitle: string;
  personalEmail: string;      // Applicant's personal email
  organizationEmail: string;  // Organization email (userPrincipalName)
  faxNumber?: string;
  subDepartmentId?: string  | null;
  managerId?: string;
  officeLocation?: string;    // Office location name (written to Entra officeLocation and EntraADUsers)
  mobilePhone?: string;       // Mobile number (written to Entra mobilePhone)
}
// test
export const fetchApplicantDetailByID = async (
  id: string,
  accessToken: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicant/${id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch applicant ${id}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Failed to fetch applicant ${id}`);
    }
    return result.data;
  } catch (error) {
    console.error("Error fetching applicant details:", error);
    throw error;
  }
};

export const markCandidateAsHired = async (
  applicantID: string,
  accessToken: string,
  dateOfJoining: Date,
  filteredTasks: InductionTask[],
  designation: string,
  adUserData?: ADUserData,
  assignLicense?: boolean,
  selectedLiscense?: string[],
  currentUserId?: string,
  adminToken?: string   // delegated token from admin app with User.ReadWrite.All
): Promise<ApiResponse<null>> => {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      userid: currentUserId ?? "",
    };
    if (adminToken) {
      headers["x-admin-token"] = adminToken;
    }
    const response: ApiResponse<any> = await axios.put(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/confirm-joining/${applicantID}`,
      {
        dateOfJoining,
        filteredtask: filteredTasks,
        designation,
        adUserData,
        shouldAssignLicense: assignLicense ?? false,
        selectedLiscense,
      },
      { headers }
    );
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

export const markCandidateAsHiredWithoutAd = async (
  applicantID: string,
  accessToken: string,
  dateOfJoining: Date,
  filteredTasks: InductionTask[],
  designation: string,
  adUserData?: ADUserData,
  currentUserId?: string 
): Promise<ApiResponse<null>> => {
   try{
    const response :ApiResponse<any> = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/applicant/confirm-joining-withoutad/${applicantID}`,
      {
      dateOfJoining:dateOfJoining,
      filteredtask:filteredTasks,
      designation:designation,
      adUserData:adUserData
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "userid": currentUserId, 
        },
      }
  )
    return response
  }
 catch(error: unknown) {
  if (axios.isAxiosError(error)) {
    // Now TypeScript knows it's an AxiosError
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
  throw error;
}
}

export const getApplicantDetails = async (applicantId: string, accessToken: string) =>  {
  try{
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicantDetails/${applicantId}`,{
      headers:{
        Authorization: `Bearer ${accessToken}`
      }
    });

    return await response.json();
  }
  catch(error){
    console.error("Error fetching applicant details:", error);
    throw error;
  }
}


export const fetchSkipInterviewStatus = async (
  applicantId: string,
  accessToken: string,
  jobId: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicantStageStatus/${applicantId}/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch skip interview status for applicant ${applicantId}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || `Failed to fetch skip interview status for applicant ${applicantId}`);
    }
    return result;
  }
  catch (error) {
    console.error("Error fetching skip interview status:", error);
    throw error;
  }
}

export const triggerMaterialSendEmail = async(accessToken:string,jobId:string,applicantId:string, email: string):Promise<ApiResponse<{success:boolean,message:string}>>=>{
  try{
    const response:ApiResponse<{success:boolean,message:string}> = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/applicant/sharePrepMaterials`,{
      applicantId:applicantId,
      jobPostingId:jobId,
      email:email,
      accessToken:accessToken
    },{
      headers:{
        Authorization: `Bearer ${accessToken}`
      }
    })

    
    return response
  }
  catch(error){
    console.error("Error saving skip interview status:", error);
    throw error;
  }
}

export const getFaxNumbers =async (accessToken:string) =>{
  try{
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/applicant/faxNumbers`,{
      headers: {
          Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.data.success) {
      throw new Error(response.data.message || `Failed to fetch Role Categories`);
    }
    return response.data.data;  
  }
  catch(error){
    // console.log("error",error)
    throw error
  }
}
export const saveSkipInterviewStatus = async (applicantId: string, accessToken: string, jobId: string, currentUserId: string, currentPipelineId:string,skippedStages: {stageId:string, isActive:boolean}[]) => {
  // console.log("Saving skip interview status with data:", {applicantId, jobId, currentPipelineId, skippedStages, createdById: currentUserId});
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applicant/skipApplicantPipelineStage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        applicantId,
        jobPostingId: jobId,
        currentPipelineId,
        skippedStageIds:skippedStages,
        createdById: currentUserId,
      }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error saving skip interview status:", error);
    throw error;
  }
}
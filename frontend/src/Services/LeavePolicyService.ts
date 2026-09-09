import axios, { AxiosError, AxiosResponse } from "axios";
import { ApiResponse } from "./UserAssignments";
import { LeavePolicy } from "../Types/LeavePolicyTypes";



export interface UpdateShiftData {
  id: string;
  name: string;
  days: number;
}

export interface CreateShiftData {
  name: string;
  days: number;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/LeavePolicy`;

const handleAxiosError = (error: unknown, defaultMessage: string): ApiResponse<any> => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      success: false,
      message: axiosError.response?.data?.message || axiosError.message || defaultMessage,
      error: axiosError.response?.data || axiosError.message,
    };
  }
  if (error instanceof Error) {
    return { success: false, message: error.message, error: error.message };
  }
  return { success: false, message: defaultMessage, error: String(error) };
};

export const GetPolicies = async(accessToken:string) :Promise<AxiosResponse<{data:LeavePolicy[]}>> =>{
    try{
        const response = await axios.get(`${API_BASE_URL}/get`,{
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        })
        return response

    }
    catch(error){
        // console.log(error,"Failed to fetch policy")
        throw handleAxiosError(error,"Failed to fetch polies")
    }
}

export const CreatePolicy = async(payload:CreateShiftData,currentUser:string,accessToken:string)=>{
  try{
        const response = await axios.post(`${API_BASE_URL}/create`,{
          days:payload.days,
          name:payload.name,
          createdBy:currentUser
        },{
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        })

        if(!response.status){
          return {
            success: false,
            message: response.data?.message || "Failed to create leave policy"
          }
        }

        return {
          success : true,
          message: response?.data?.message || "Data updated successfully"
        }

    }
  catch(error){
    //  console.log(error,"Failed to crate leave policy")
      throw handleAxiosError(error,"Failed to crate leave policy")
  }
}

export const UpdatePolicies = async(payload:UpdateShiftData,currentUser:string,accessToken:string) =>{
  try{
    try{
        const response = await axios.put(`${API_BASE_URL}/update/${payload.id}`,{
          days:payload.days,
          name:payload.name,
          modifiedBy:currentUser
        },{
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        })

        if(!response.status){
          return {
            success: false,
            message: response.data?.message || "Failed to update data"
          }
        }

        return {
          success : true,
          message: response?.data?.message || "Data updated successfully"
        }

    }
    catch(error){
        // console.log(error,"Failed to fetch policy")
        throw handleAxiosError(error,"Failed to fetch polies")
    }
  }
  catch(error){
    // console.log(error,"Failed to update policy")
    throw handleAxiosError(error,"Failed to update polies")
  }
}


export const DeletePolicies = async(id:string,modifiedBy:string,accessToken:string) =>{
  try{
    try{
        const response = await axios.put(`${API_BASE_URL}/delete/${id}`,{modifiedBy},{
            headers:{
                Authorization: `Bearer ${accessToken}`
            }
        })

        if(!response.status){
          return {
            success: false,
            message: response.data?.message || "Failed to update data"
          }
        }

        return {
          success : true,
          message: response?.data?.message || "Data updated successfully"
        }

    }
    catch(error){
        // console.log(error,"Failed to fetch policy")
        throw handleAxiosError(error,"Failed to fetch polies")
    }
  }
  catch(error){
    // console.log(error,"Failed to update policy")
    throw handleAxiosError(error,"Failed to update polies")
  }
}
import axios, { AxiosError } from "axios";
import { ApiResponse } from "./UserAssignments";

export interface EmpLeavePolicyItem {
  id: string;
  empRoleID: string;
  employeeRole: string;
  leaveTypeID: string;
  leaveTypeName: string;
  days: number;
  createdAt: string;
}

export interface CreateEmpLeavePolicyPayload {
  empRoleID: string;
  employeeRole: string;
  leaveTypeID: string;
  createdBy: string;
}

export interface UpdateEmpLeavePolicyPayload {
  id: string;
  leaveTypeID: string;
  modifiedBy: string;
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

export const GetEmployeeLeavePolicies = async (
  accessToken: string
): Promise<ApiResponse<EmpLeavePolicyItem[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/employeeLeavePolicy/get`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to fetch employee leave policies");
  }
};

export const CreateEmployeeLeavePolicy = async (
  payload: CreateEmpLeavePolicyPayload,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/employeeLeavePolicy/create`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to create employee leave policy");
  }
};

export const UpdateEmployeeLeavePolicy = async (
  payload: UpdateEmpLeavePolicyPayload,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/employeeLeavePolicy/update/${payload.id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to update employee leave policy");
  }
};

export const DeleteEmployeeLeavePolicy = async (
  id: string,
  modifiedBy: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/employeeLeavePolicy/delete/${id}`,
      { modifiedBy },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to delete employee leave policy");
  }
};

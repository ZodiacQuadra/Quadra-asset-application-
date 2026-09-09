import axios, { AxiosError } from "axios";
import { UserDetails } from "./Offboarding";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/hrMapping`;



export interface HrMapping {
    id: string;
    name: string;
    userId: string;
    department: string;
    departmentId: string;
    createdByUserName: string;
    createdAt: string;
    createdBy: string;
    isActive: boolean;
    modifiedByUserName: string;
    modifiedBy: string;
    modifiedAt: Date;
    email?: string;
    type: string
}

interface DataType {
    user: UserDetails,
    department: string,
    departmentName: string,
    accessType: string,
    isActive: boolean
}


export const createHrDepartmentMapping = async (data: DataType, accessToken: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/create-mapping`, {
            departmentId: data.department,
            departmentName: data.departmentName,
            userId: data.user.id,
            isActive: data.isActive,
            accessType: data.accessType
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || "Failed to map department");
        }
    } catch (error)  {
        if (error instanceof AxiosError) {

            throw Error(error && error.response?.data.error)
        }
        else {
            throw Error("Unable to update data")
        }
    }
}

export const getMappingData = async (page: number, limit: number, accessToken: string, status:string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/mapping/${page}/${limit}/${status}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || "Failed to fetch data");
        }
    }
    catch (error) {
        throw new Error("Failed to fetch data")
    }
}

export const updateData = async (data: HrMapping, accessToken: string) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/mapping/${data.id}`, {
            isActive:data.isActive
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (response.data.success) {
            return response.data;
        } else {
            throw new Error(response.data.message || "Failed to fetch data");
        }
    }
    catch (error) {
        if (error instanceof AxiosError) {

            throw Error(error && error.response?.data.error)
        }
        else {
            throw Error("Unable to update data")
        }
    }
}
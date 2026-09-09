// api/attendanceInsights.ts
import axios from "axios";
import { AttendanceInsightsResponse } from "../Types/aiInsights";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface InsightsParams {
  managerId?: string;      
  department?: string;     
  startDate?: string;      
  endDate?: string;        
}

export async function getAttendanceInsights(
  token: string,
  params: InsightsParams = {}
): Promise<AttendanceInsightsResponse> {
  const response = await axios.post<AttendanceInsightsResponse>(
    `${API_BASE_URL}/attendanceInsights/insights`,
    params,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

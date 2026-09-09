import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/attendanceConfig`;

export interface AttendanceConfigSetting {
  ID: string;
  ConfigurationName: string;
  ConfigurationKey: string;
  Value: string;
  ModifiedAt: string | null;
}

const getAuthHeaders = (accessToken: string, userId?: string) => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
  ...(userId ? { userid: userId } : {}),
});

export const getAttendanceConfigSettings = async (
  accessToken: string
): Promise<AttendanceConfigSetting[]> => {
  const response = await axios.get(`${API_BASE_URL}/getAll`, {
    headers: getAuthHeaders(accessToken),
  });
  return response.data.data;
};

export const updateAttendanceConfigValue = async (
  id: string,
  value: string,
  accessToken: string,
  userId?: string
): Promise<void> => {
  await axios.put(
    `${API_BASE_URL}/update/${id}`,
    { value },
    { headers: getAuthHeaders(accessToken, userId) }
  );
};

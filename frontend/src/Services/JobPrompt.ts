// ExternalAPI/JobPrompt.ts
// API client functions to be used in your React component

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/jobprompt`;

// Helper function to make API requests
const apiRequest = async (
  endpoint: string,
  options: { headers?: Record<string, string>; [key: string]: any } = {}
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      // Add any authentication headers here if needed
      // 'Authorization': `Bearer ${token}`
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    return {
      success: false,
      message:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Network error occurred",
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
};

/**
 * Create a new job prompt
 * @param {string} prompt - The job prompt content
 * @param {string} createdBy - The user who created the prompt
 * @returns {Promise<Object>} API response
 */
export const createJobPrompt = async (
  prompt: string,
  createdBy: string,
  accessToken: string
) => {
  return await apiRequest("/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      prompt,
      createdBy,
    }),
  });
};

/**
 * Update an existing job prompt
 * @param {number} version - The version number to update
 * @param {string} prompt - The updated job prompt content
 * @param {string} modifiedBy - The user who modified the prompt
 * @returns {Promise<Object>} API response
 */
export const updateJobPrompt = async (
  version: number,
  prompt: string,
  modifiedBy: string,
  accessToken: string
) => {
  return await apiRequest(`/update/${version}`, {
    method: "PUT",
    body: JSON.stringify({
      prompt,
      modifiedBy,
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Get the latest job prompt and all logs
 * @returns {Promise<Object>} API response with jobPrompt and logs
 */
export const getLatestJobPromptAndLogs = async (accessToken: string) => {
  return await apiRequest("/latest-with-logs", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Restore a job prompt from a specific log entry
 * @param {number} logId - The log ID to restore from
 * @param {string} restoredBy - The user who is restoring the prompt
 * @returns {Promise<Object>} API response
 */
export const restoreJobPromptFromLog = async (
  logId: number,
  restoredBy: string,
  accessToken: string
) => {
  return await apiRequest(`/restore/${logId}`, {
    method: "POST",
    body: JSON.stringify({
      restoredBy,
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Get a specific job prompt by version
 * @param {number} version - The version number to retrieve
 * @returns {Promise<Object>} API response
 */
export const getJobPromptByVersion = async (
  version: string,
  accessToken: string
) => {
  return await apiRequest(`/version/${version}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Get all job prompt versions
 * @returns {Promise<Object>} API response with all versions
 */
export const getAllJobPromptVersions = async (accessToken: string) => {
  return await apiRequest("/all-versions", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Check API health
 * @returns {Promise<Object>} API response
 */
export const checkApiHealth = async (accessToken: string) => {
  return await apiRequest("/health", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

/**
 * Check API health
 * @returns {Promise<Object>} API response
 */
export const getActiveJobPrompt = async (accessToken: string) => {
  return await apiRequest("/getActiveJobPrompt", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

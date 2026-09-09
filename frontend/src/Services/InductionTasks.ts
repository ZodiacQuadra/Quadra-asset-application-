import axios from "axios";

// Base configuration
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
const INDUCTION_TASKS_ENDPOINT = `${API_BASE_URL}/inductiontasks`;

// ========================================
// INDUCTION TASK API FUNCTIONS
// ========================================

/**
 * Create a new induction task
 * @param {Object} taskData - Task data
 * @param {string} taskData.taskDescription - Task description
 * @param {number} taskData.days - Number of days (default: 0)
 * @param {boolean} taskData.quantity - Quantity flag (default: false)
 * @param {string} taskData.status - Status: 'Active', 'Inactive', 'Draft' (default: 'Active')
 * @param {string} taskData.createdByUserId - Creator user ID (GUID)
 * @param {Array} taskData.assignedUsers - Array of assigned users [{id: 'guid'}]
 * @returns {Promise} API response
 */
export const createInductionTask = async (taskData: any, accessToken: any) => {
  try {
    const response = await axios.post(
      `${INDUCTION_TASKS_ENDPOINT}/createinductiontask`,
      taskData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing induction task
 * @param {string} taskId - Task ID (GUID)
 * @param {Object} taskData - Updated task data
 * @param {string} taskData.taskDescription - Task description
 * @param {number} taskData.days - Number of days
 * @param {boolean} taskData.quantity - Quantity flag
 * @param {string} taskData.status - Status: 'Active', 'Inactive', 'Draft'
 * @param {string} taskData.modifiedByUserId - Modifier user ID (GUID)
 * @param {Array} taskData.assignedUsers - Array of assigned users [{id: 'guid'}]
 * @returns {Promise} API response
 */
export const updateInductionTask = async (
  taskId: any,
  taskData: any,
  accessToken: any
) => {
  try {
    const response = await axios.put(
      `${INDUCTION_TASKS_ENDPOINT}/updateinductiontask/${taskId}`,
      taskData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Partial update of an induction task (PATCH)
 * @param {string} taskId - Task ID (GUID)
 * @param {Object} partialData - Partial task data to update
 * @param {string} partialData.modifiedByUserId - Modifier user ID (GUID) - required
 * @returns {Promise} API response
 */
export const patchInductionTask = async (
  taskId: any,
  partialData: any,
  accessToken: any
) => {
  try {
    const response = await axios.patch(
      `${INDUCTION_TASKS_ENDPOINT}/updateinductiontask/${taskId}`,
      partialData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all induction tasks with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (optional)
 * @param {string} params.createdByUserId - Filter by creator (optional)
 * @param {number} params.pageNumber - Page number (default: 1)
 * @param {number} params.pageSize - Page size (default: 50)
 * @param {string} params.sortBy - Sort field (default: 'CreatedAt')
 * @param {string} params.sortDirection - Sort direction: 'ASC' or 'DESC' (default: 'DESC')
 * @returns {Promise} API response with tasks and pagination info
 */
export const getInductionTasks = async (params = {}, accessToken: any) => {
  try {
    const response = await axios.get(
      `${INDUCTION_TASKS_ENDPOINT}/getinductiontasks`,
      { params, headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single induction task by ID
 * @param {string} taskId - Task ID (GUID)
 * @returns {Promise} API response with task details
 */
export const getInductionTaskById = async (taskId: any, accessToken: any) => {
  try {
    const response = await axios.get(
      `${INDUCTION_TASKS_ENDPOINT}/getinductiontask/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete (soft delete) an induction task
 * @param {string} taskId - Task ID (GUID)
 * @param {string} deletedByUserId - User ID who is deleting (GUID)
 * @returns {Promise} API response
 */
export const deleteInductionTask = async (
  taskId: any,
  deletedByUserId: any,
  accessToken: any
) => {
  try {
    const response = await axios.delete(
      `${INDUCTION_TASKS_ENDPOINT}/deleteinductiontask/${taskId}`,
      {
        data: { deletedByUserId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * Get active induction tasks only
 * @param {Object} params - Additional query parameters
 * @returns {Promise} API response with active tasks
 */
export const getActiveInductionTasks = async (
  params = {},
  accessToken: any
) => {
  return getInductionTasks({ ...params, status: "Active" }, accessToken);
};

/**
 * Get inactive induction tasks only
 * @param {Object} params - Additional query parameters
 * @returns {Promise} API response with inactive tasks
 */
export const getInactiveInductionTasks = async (
  params = {},
  accessToken: any
) => {
  return getInductionTasks({ ...params, status: "Inactive" }, accessToken);
};

/**
 * Get draft induction tasks only
 * @param {Object} params - Additional query parameters
 * @returns {Promise} API response with draft tasks
 */
export const getDraftInductionTasks = async (params = {}, accessToken: any) => {
  return getInductionTasks({ ...params, status: "Draft" }, accessToken);
};

/**
 * Get induction tasks created by specific user
 * @param {string} userId - User ID (GUID)
 * @param {Object} params - Additional query parameters
 * @returns {Promise} API response with user's tasks
 */
export const getInductionTasksByCreator = async (
  userId: any,
  params = {},
  accessToken: any
) => {
  return getInductionTasks({ ...params, createdByUserId: userId }, accessToken);
};

/**
 * Search induction tasks by description (client-side filtering)
 * @param {string} searchTerm - Search term
 * @param {Object} params - Additional query parameters
 * @returns {Promise} API response with filtered tasks
 */
export const searchInductionTasks = async (
  searchTerm: any,
  params = {},
  accessToken: any
) => {
  const response = await getInductionTasks(params, accessToken);
  if (response.success && searchTerm) {
    const filteredTasks = response.data.tasks.filter(
      (task: any) =>
        task.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.taskCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      ...response,
      data: {
        ...response.data,
        tasks: filteredTasks,
      },
    };
  }
  return response;
};

/**
 * Update only the status of an induction task
 * @param {string} taskId - Task ID (GUID)
 * @param {string} newStatus - New status: 'Active', 'Inactive', 'Draft'
 * @param {string} modifiedByUserId - Modifier user ID (GUID)
 * @returns {Promise} API response
 */
export const updateInductionTaskStatus = async (
  taskId: any,
  newStatus: any,
  modifiedByUserId: any,
  accessToken: any
) => {
  // First get the current task data
  const currentTask = await getInductionTaskById(taskId, accessToken);
  if (!currentTask.success) {
    throw currentTask;
  }

  // Update with new status
  const updateData = {
    taskDescription: currentTask.data.taskDescription,
    days: currentTask.data.days,
    quantity: currentTask.data.quantity,
    status: newStatus,
    modifiedByUserId,
    assignedUsers: currentTask.data.assignedUsers.map((user: any) => ({
      id: user.id,
    })),
  };

  return updateInductionTask(taskId, updateData, accessToken);
};

/**
 * Assign users to an induction task
 * @param {string} taskId - Task ID (GUID)
 * @param {Array} userIds - Array of user IDs (GUIDs) ['guid1', 'guid2']
 * @param {string} modifiedByUserId - Modifier user ID (GUID)
 * @returns {Promise} API response
 */
export const assignUsersToTask = async (
  taskId: any,
  userIds: any,
  modifiedByUserId: any,
  accessToken: any
) => {
  // First get the current task data
  const currentTask = await getInductionTaskById(taskId, accessToken);
  if (!currentTask.success) {
    throw currentTask;
  }

  // Update with new assigned users
  const updateData = {
    taskDescription: currentTask.data.taskDescription,
    days: currentTask.data.days,
    quantity: currentTask.data.quantity,
    status: currentTask.data.status,
    modifiedByUserId,
    assignedUsers: userIds.map((userId: any) => ({ id: userId })),
  };

  return updateInductionTask(taskId, updateData, accessToken);
};

/**
 * Remove users from an induction task
 * @param {string} taskId - Task ID (GUID)
 * @param {Array} userIdsToRemove - Array of user IDs to remove (GUIDs)
 * @param {string} modifiedByUserId - Modifier user ID (GUID)
 * @returns {Promise} API response
 */
export const removeUsersFromTask = async (
  taskId: any,
  userIdsToRemove: any,
  modifiedByUserId: any,
  accessToken: any
) => {
  // First get the current task data
  const currentTask = await getInductionTaskById(taskId, accessToken);
  if (!currentTask.success) {
    throw currentTask;
  }

  // Filter out users to remove
  const remainingUsers = currentTask.data.assignedUsers
    .filter((user: any) => !userIdsToRemove.includes(user.id))
    .map((user: any) => ({ id: user.id }));

  // Update with remaining users
  const updateData = {
    taskDescription: currentTask.data.taskDescription,
    days: currentTask.data.days,
    quantity: currentTask.data.quantity,
    status: currentTask.data.status,
    modifiedByUserId,
    assignedUsers: remainingUsers,
  };

  return updateInductionTask(taskId, updateData, accessToken);
};

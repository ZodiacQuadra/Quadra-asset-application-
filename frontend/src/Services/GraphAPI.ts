import axios from "axios";

interface InterviewerInfo {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  position?: string;
  profilePicture?: string;
}

export async function fetchProfilePicture(userId: string, accessToken: string) {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/profile-picture/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Create a local URL for the image blob
    if (response.data.success && response.data.data.dataUrl) {
      return response.data.data.dataUrl; // Returns data:image/jpeg;base64,... format
    } else {
      throw new Error("Invalid response format from profile picture API");
    }
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    throw error;
  }
}

export const fetchAllActiveLiscense=async(accessToken:string)=>{
  try{
    const response =await axios.get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/activeLicense`,{
      headers:{
        Authorization: `Bearer ${accessToken}`
      }
    })

    if(!response.data.success){
      return {
        success: false,
        error: "Unable to fetch data"
      }
    }

    return response.data
  }
  catch(error){
    console.log(error)
  }
}

export async function fetchProfilePicture1(userId: string, accessToken: string): Promise<InterviewerInfo> {
  try {
    // Fetch user details from your backend (which has the proper permissions)
    const userResponse = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = userResponse.data;

    // Fetch profile picture from your backend
    let profilePictureUrl = '';
    try {
      const pictureResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/graphapi/profile-picture/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (pictureResponse.data.success && pictureResponse.data.data.dataUrl) {
        profilePictureUrl = pictureResponse.data.data.dataUrl;
      }
    } catch (pictureError) {
      // console.log(`No profile picture found for user ${userId}`);
    }

    return {
      id: userId,
      displayName: userData.displayName || userData.userPrincipalName || 'Unknown User',
      email: userData.mail || userData.userPrincipalName || userData.email || 'No email available',
      department: userData.department,
      position: userData.jobTitle,
      profilePicture: profilePictureUrl,
    };
  } catch (error) {
    console.error(`Error fetching profile for ${userId}:`, error);
    // Return a fallback object instead of throwing
    return {
      id: userId,
      displayName: 'Unknown User',
      email: 'No email available',
      profilePicture: '',
    };
  }
}


export const fetchDesignation = async (accessToken: string) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/designations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching designations:", error);

    return [];
  }
};

export async function fetchDesignations(accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/office-locations/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function fetchDepartments(accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/departments/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function fetchUsers(query: string, accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/searchUsers`, {
        params: {
          query: query,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function fetchUsersByID(query: string, accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/searchUsersByID`, {
        params: {
          query: query,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function getUserByID(userId: string, accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/userDetails/${userId}`, { // Add userId to the URL
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function fetchUserPermissions(
  userId: string,
  accessToken: string
) {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/User/users/${userId}/permissions/simple`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // console.log("Permissions API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return {
      success: false,
      data: {
        userId: userId,
        permissionSource: "None",
        roleName: null,
        baseRoleName: null,
        permissions: {},
      },
    };
  }
}

export const fetchUserGroupsByUserID = async (
  userId: string,
  accessToken: string
) => {
  if (!userId || userId.trim() === "") {
    throw new Error("User ID is required");
  }

  try {
    // console.log(`Fetching groups for user: ${userId}`);

    const sanitizedUserId = userId.trim();

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/User/groups/user/${encodeURIComponent(
        sanitizedUserId
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error response from server:", errorData);
      return {
        success: true,
        data: [], // Return empty array instead of throwing an error
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.warn("API returned unsuccessful response:", data.message);
      return {
        success: true,
        data: [], // Return empty array for unsuccessful responses
      };
    }

    // console.log(
    //   `Successfully fetched ${
    //     data.data?.length || 0
    //   } groups for user ${sanitizedUserId}`
    // );
    return data;
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error);
    // Return empty array on error
    return {
      success: true,
      data: [],
    };
  }
};

export async function fetchRecruitCalendar(accessToken: string) {
  try {
    return await axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/graphapi/getRecruitCalendar`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => response.data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

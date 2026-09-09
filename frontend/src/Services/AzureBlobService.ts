import axios from "axios";

export class AzureBlobService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/resumeblob`;

  // Upload to temporary storage during processing
  async uploadToTemp(
    file: File,
    jobId: string,
    tempId: string,
    accessToken: string
  ): Promise<{ url: string; blobPath: string }> {
    // Debug logging
    // console.log("Upload parameters:", {
    //   fileName: file?.name,
    //   fileSize: file?.size,
    //   fileType: file?.type,
    //   jobId,
    //   tempId,
    //   fileConstructor: file?.constructor?.name,
    //   isFileInstance: file instanceof File,
    // });

    // Validate inputs
    if (!file) {
      throw new Error("File is required");
    }

    if (!(file instanceof File)) {
      throw new Error("Invalid file object provided");
    }

    if (!jobId || !tempId) {
      throw new Error("JobId and tempId are required");
    }

    const formData = new FormData();

    // Append file with explicit field name
    formData.append("file", file, file.name);
    formData.append("jobId", jobId);
    formData.append("tempId", tempId);

    // Debug FormData contents
    // console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type,
        });
      } else {
        console.log(`${key}:`, value);
      }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/upload-temp`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
          // Add timeout to prevent hanging
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Upload error details:", {
        error,
        status: axios.isAxiosError(error) ? error.response?.status : "N/A",
        statusText: axios.isAxiosError(error)
          ? error.response?.statusText
          : "N/A",
        data: axios.isAxiosError(error) ? error.response?.data : "N/A",
      });

      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message ||
            `Failed to upload to temp storage: ${error.response.status}`
        );
      } else if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        throw new Error("Upload timeout - please try again");
      } else {
        throw new Error("Failed to upload to temp storage");
      }
    }
  }

  // Move from temp to permanent storage
  async moveToPermStorage(
    tempBlobPath: string,
    jobId: string,
    fileName: string,
    accessToken: string
  ): Promise<{ url: string; blobPath: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/move-to-permanent`,
        {
          tempBlobPath,
          jobId,
          fileName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to move to permanent storage"
        );
      } else {
        throw new Error("Failed to move to permanent storage");
      }
    }
  }

  // Delete from blob storage
  async deleteFromBlob(
    blobPath: string,
    isTemp: boolean = false,
    accessToken: string
  ): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/delete`, {
        data: {
          blobPath,
          isTemp,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Failed to delete file");
      } else {
        throw new Error("Failed to delete file");
      }
    }
  }

  // Clean up temp files (optional - for cleanup tasks)
  async cleanupTempFiles(jobId: string, accessToken: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/cleanup-temp/${jobId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to cleanup temp files"
        );
      } else {
        throw new Error("Failed to cleanup temp files");
      }
    }
  }
}

import axios from "axios";
import { ResumeMetadata } from "../Types/resume";

export class AzureAIService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/aiprocessor`; 

  // Extract resume data using Azure AI
  async extractResumeData(
    blobUrl: string,
    fileName: string,
    accessToken: string
  ): Promise<ResumeMetadata> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/extract-resume`,
        {
          blobUrl: `${blobUrl}`,
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
          error.response.data.message || "Failed to extract resume data"
        );
      } else {
        throw new Error("Failed to extract resume data");
      }
    }
  }

  // Validate and enhance extracted data
  async validateResumeData(
    extractedData: any,
    accessToken: string
  ): Promise<ResumeMetadata> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/validate-resume`,
        extractedData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      // console.log(response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Failed to validate resume data"
        );
      } else {
        throw new Error("Failed to validate resume data");
      }
    }
  }
}

export interface ResumeMetadata {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  address?: string;
  education?: string;
  skills: string[];
  experienced?: boolean;
  experienceDetails?: string;
  jobPostingId: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  blobUrl?: string;
  blobPath?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  extractedData?: ResumeMetadata;
  errorMessage?: string;
  permanentBlobPath?: string;
  tempBlobPath?: string;
}

export interface ResumeUploadProps {
  jobPosting: any;
  onSaveComplete?: (savedResumes: ResumeMetadata[]) => void;
}

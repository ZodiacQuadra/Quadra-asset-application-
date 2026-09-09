// types/interview.ts
export interface InterviewStage {
  ID: string;
  InterviewName: string;
  Description: string;
  isDefault: boolean;
  Order: number;
  Show: boolean;
  color: string;
  IsManual: boolean;
  JobPostingID: string;
  StageSequence: number;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  notify: boolean
  notifyUser: Person[]
}

export interface DynamicInterviewPipelineProps {
  jobId: string;
  applicants: Applicant[];
}

export interface ScheduleFormData {
  date: string;
  time: string;
  interviewer: string;
  type: string;
  stage: string;
  applicants: string[];
}

export type ViewMode = "kanban" | "stepper";

// Component prop interfaces
export interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkSchedule: () => void;
}

export interface PipelineStepperProps {
  stages: InterviewStage[];
  getApplicantsByStage: (stageId: string) => Applicant[];
}

export interface ApplicantCardProps {
  applicant: Applicant;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onSchedule: () => void;
  onNavigate: () => void;
  onDragStart?: () => void;
  isDraggable?: boolean;
}

export interface KanbanStageProps {
  stage: InterviewStage;
  applicants: Applicant[];
  selectedApplicants: Set<string>;
  onApplicantSelect: (applicantId: string, checked: boolean) => void;
  onSelectAllInStage: () => void;
  onRemoveStage: () => void;
  onScheduleApplicant: (applicantId: string) => void;
  onNavigateToApplicant: (applicantId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragStart: (applicantId: string) => void;
}

export interface StepperViewProps {
  stages: InterviewStage[];
  selectedApplicants: Set<string>;
  onApplicantSelect: (applicantId: string, checked: boolean) => void;
  onSelectAllInStage: (stageId: string) => void;
  onRemoveStage: (stageId: string) => void;
  onScheduleApplicant: (applicantId: string) => void;
  onNavigateToApplicant: (applicantId: string) => void;
  getApplicantsByStage: (stageId: string) => Applicant[];
}

// Type definitions for interview scheduling components

// export interface Applicant {
//   ID: string;
//   ApplicantCode: string;
//   jobPostingId: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone: string;
//   address?: string;
//   education: string;
//   experienced: boolean;
//   experienceDetails?: string;
//   fileName: string;
//   fileSize: string;
//   uploadDate: string;
//   blobUrl: string;
//   blobPath: string;
//   Status: string;
//   CreatedAt: string;
//   ModifiedAt: string;
//   skills: Array<{ value: string }>;
// }

export interface Person {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
}

export interface InterviewSlot {
  id: string;
  applicantId: string;
  date: string;
  time: string;
  duration: number;
  interviewType: string;
  stage: string;
  interviewers: Person[];
  location: string;
  meetingLink: string;
  isTeamsMeeting: boolean;
  notes: string;
  timeZone: string;
}

export interface Skill {
  value: string;
}

export interface Stage {
  stageId: string;
  stageName: string;
  stageDescription: string;
  stageOrder: number;
  stageSequence: number;
}

export interface Applicant {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  applicantStatus: string;
  CreatedAt: string;
  ModifiedAt: string;
  currentPipelineId: string | null;
  currentPipeline: CurrentPipeline | null;
  scheduledInterviews: Interview[];
  completedInterviews: Interview[];
  cancelledInterviews: Interview[];
  overallStatusDescription: string;
  currentStagePosition: number;
  totalStages: number;
  skills: Skill[];
  DateOfJoining?: Date
}

export interface ApplicantsResponse {
  success: boolean;
  message: string;
  data: Applicant[];
  count: number;
}

export interface CurrentPipeline {
  pipelineId: string;
  status: string;
  holdReason: string | null;
  rejectedReason: string | null;
  createdAt: string;
  modifiedAt: string;
  stage: {
    stageId: string;
    stageName: string;
    stageDescription: string;
    stageOrder: number;
    stageSequence: number;
  };
}

export interface Interview {
  interviewId: string;
  title: string;
  type?: string;
  scheduledDateTime: string;
  duration?: number;
  location?: string;
  meetingLink?: string;
  status: string;
  notes?: string;
  teamsMeeting?: boolean;
  outlookEventId?: string;
  // Added for backward compatibility with the component
  date?: string;
  scheduledDate?: string;
  interviewers?: Array<{
    id: string;
    displayName: string;
    email: string;
    role?: string;
    isPrimary?: boolean;
  }>;
}

export interface Skill {
  value: string;
}

// Updated Applicant interface to match stored procedure output
export interface Applicant {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string; // matches [jobPostingId] from SP
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  applicantStatus: string;
  CreatedAt: string;
  ModifiedAt: string;
  currentPipelineId: string | null;
  currentPipeline: CurrentPipeline | null;
  scheduledInterviews: Interview[];
  completedInterviews: Interview[];
  cancelledInterviews: Interview[];
  overallStatusDescription: string;
  currentStagePosition: number;
  totalStages: number;
  skills: Skill[];
  DateOfJoining?:Date
}

// Raw data interface from stored procedure (before parsing)
export interface RawApplicantData {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  applicantStatus: string;
  CreatedAt: string;
  ModifiedAt: string;
  currentPipelineId: string | null;
  currentPipeline: string | null; // JSON string
  scheduledInterviews: string | null; // JSON string
  completedInterviews: string | null; // JSON string
  cancelledInterviews: string | null; // JSON string
  overallStatusDescription: string;
  currentStagePosition: number;
  totalStages: number;
  skills: string | null; // JSON string
}

// Data transformation function

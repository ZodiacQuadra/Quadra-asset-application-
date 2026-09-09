import * as React from "react";
import DOMPurify from "dompurify";
import {
  Button,
  Field,
  FluentProvider,
  Spinner,
  Body1Strong,
  SkeletonItem,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Badge,
  Divider,
  Text,
  Subtitle2Stronger,
  Title2,
  Body1,
  Caption1,
  Persona,
  Avatar,
  Subtitle1,
  Subtitle2,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowExportRtlRegular,
  CalendarRegular,
  PersonRegular,
  LocationRegular,
  MoneyRegular,
  BriefcaseRegular,
  TimerRegular,
  BuildingRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  GlobeRegular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJDRequestById } from "../../Services/JDRequests";
import { useAuth } from "../../Auth/AuthProvider";
import JobDescriptionRenderer from "../Components/JobDescriptionRenderer";

// Define interface for job posting data
interface JobPosting {
  id: string;
  title: string;
  description: string;
  status: string;
  skills: string[];
  additionalResponsibilities: string[];
}

// Updated interface for form data
interface FormData {
  jobId: string;
  jobSequence: string;
  jobRole: string;
  jobNature: string;
  department: string;
  targetDate: Date | null | undefined;
  numPositions: number;
  workExperience: number;
  MinSalaryRange?: number;
  MaxSalaryRange?: number;
  salaryRange?: number;
  jobLocation: string;
  status: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  isActive?: boolean;
  isPublished?: boolean;
  inActiveReason?: string;
}

// Define interface for person
interface Person {
  id: string;
  displayName: string;
  email: string;
}

const useStyles = makeStyles({
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
  },
  header: {
    background: "url('/home-banner.jpg')", // Assuming home-banner is in the public folder
    backgroundPosition: "20% 30%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "24px"),
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
  },
  companyLogo: {
    width: "120px",
    height: "40px",
    objectFit: "contain",
  },
  mainContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    ...shorthands.padding("24px"),
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    ...shorthands.gap("24px"),
    "@media (max-width: 968px)": {
      gridTemplateColumns: "1fr",
    },
  },
  contentSection: {
    backgroundColor: "#ffffff",
    ...shorthands.borderRadius("8px"),
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    ...shorthands.padding("32px"),
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
    position: "sticky",
    top: "100px",
    height: "fit-content",
  },
  sidebarCard: {
    backgroundColor: "#ffffff",
    ...shorthands.borderRadius("8px"),
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    ...shorthands.padding("24px"),
  },
  jobHeader: {
    ...shorthands.borderBottom("1px", "solid", "#e9ecef"),
    ...shorthands.padding("0", "0", "24px", "0"),
    ...shorthands.margin("0", "0", "24px", "0"),
  },
  jobTitle: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#212529",
    ...shorthands.margin("0", "0", "12px", "0"),
    "&:first-letter": { textTransform: "uppercase" },
  },
  jobMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    ...shorthands.gap("24px"),
    ...shorthands.margin("16px", "0", "0", "0"),
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    color: "#6c757d",
  },
  metaIcon: {
    color: "#6c757d",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#212529",
    ...shorthands.margin("0", "0", "16px", "0"),
  },
  subSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#212529",
    ...shorthands.margin("0", "0", "16px", "0"),
  },

  sectionContent: {
    color: "#495057",
    lineHeight: "1.6",
  },
  section: {
    ...shorthands.margin("0", "0", "32px", "0"),
  },
  infoGrid: {
    display: "grid",
    ...shorthands.gap("20px"),
  },
  infoItem: {
    display: "flex",
    alignItems: "flex-start",
    ...shorthands.gap("12px"),
  },
  infoIcon: {
    color: "#6c757d",
    marginTop: "2px",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: "14px",
    color: "#6c757d",
    ...shorthands.margin("0", "0", "4px", "0"),
  },
  infoValue: {
    fontSize: "16px",
    color: "#212529",
    fontWeight: "500",
  },
  applyButton: {
    width: "100%",
    height: "48px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#ff6600",
    color: "#ffffff",
    ...shorthands.borderRadius("25px"),
    ...shorthands.border("none"),
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "rgb(245 98 0)",
    },
    ":disabled": {
      backgroundColor: "#ccc",
      cursor: "not-allowed",
    },
  },
  shareButton: {
    width: "100%",
    height: "40px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: "transparent",
    color: "#ff6600",
    ...shorthands.border("1px", "solid", "#ff6600"),
    ...shorthands.borderRadius("25px"),
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "rgb(255 248 243)",
    },
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  bulletList: {
    ...shorthands.margin("0"),
    ...shorthands.padding("0", "0", "0", "20px"),
    "& li": {
      ...shorthands.margin("0", "0", "8px", "0"),
      color: "#495057",
      lineHeight: "1.6",
      listStyleType: "disc",
    },
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorCard: {
    width: "100%",
    maxWidth: "400px",
    ...shorthands.padding("32px"),
    textAlign: "center",
    backgroundColor: "#ffffff",
    ...shorthands.borderRadius("8px"),
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
    ...shorthands.margin("0", "0", "16px", "0"),
  },
  companySection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("16px"),
    ...shorthands.margin("0", "0", "8px", "0"),
  },
  companyAvatar: {
    width: "56px",
    height: "56px",
    objectFit: "contain",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#ffffff",
    ...shorthands.margin("0", "0", "4px", "0"),
    "&:first-letter": { textTransform: "uppercase" },
  },
  companyWebsite: {
    fontSize: "14px",
    color: "#0066cc",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline",
    },
  },
  dialogSurface: {
    maxWidth: "600px",
    width: "100%",
  },
  dialogHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formField: {
    marginBottom: "20px",
  },
  uploadArea: {
    ...shorthands.border("2px", "dashed", "#d1d5db"),
    ...shorthands.borderRadius("8px"),
    ...shorthands.padding("32px"),
    textAlign: "center",
    backgroundColor: "rgb(255 255 255)",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      ...shorthands.borderColor("#ff6600"),
      backgroundColor: "rgb(255 244 237)",
    },
  },
  uploadAreaActive: {
    ...shorthands.borderColor("#e65c00"),
    backgroundColor: "rgb(255 244 237)",
  },
  uploadIcon: {
    color: "#e65c00",
    marginBottom: "12px",
  },
  uploadedFile: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    ...shorthands.padding("12px"),
    ...shorthands.border("1px", "solid", "#e5e7eb"),
    ...shorthands.borderRadius("6px"),
    backgroundColor: "#f9fafb",
    marginTop: "12px",
  },
  fileIcon: {
    color: "#dc2626",
  },
  fileName: {
    flex: 1,
    fontSize: "14px",
    color: "#374151",
  },
  removeFileButton: {
    color: "#6b7280",
    cursor: "pointer",
    ":hover": {
      color: "#374151",
    },
  },
  recaptchaNotice: {
    fontSize: "12px",
    color: "#6c757d",
    textAlign: "center",
    ...shorthands.margin("16px", "0", "0", "0"),
    lineHeight: "1.4",
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

// Component props interface
interface JDPreviewPageProps {
  id?: string;
  isNeedControls?: boolean; // Optional prop for ID
}

// Skeleton components
const PreviewSkeleton = () => (
  <div className="flex flex-col items-center justify-center py-8 h-full">
    <Spinner />
    <Body1Strong className="mt-2">Loading Requests...</Body1Strong>
  </div>
);

export default function JDPreviewPage({
  id: propId,
  isNeedControls = true,
}: JDPreviewPageProps) {
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const styles = useStyles();
  const { Id: paramId } = useParams();
  const navigate = useNavigate();

  // Use prop ID if provided, otherwise fall back to URL param
  const effectiveId = propId || paramId;

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const { accessToken }: any = useAuth();

  // Helper function to determine actual status
  const determineActualStatus = (data: any): string => {
    if (data.isActive === false) return "Inactive";
    if (data.isPublished === true) return "Published";
    return "Active";
  };

  // Helper function to detect if the description has the special format
  const hasSpecialFormatting = (description: string): boolean => {
    // Check for patterns that indicate the special formatting
    const specialPatterns = [
      /\*\*.*\*\*/, // Contains double asterisks for bold
      /\*[^*\s].*[^*\s]\*/, // Contains single asterisks around text
      /^\*[^*].*[^*]\*$/, // Starts and ends with single asterisks
      /---\s*Refined Changes:/, // Contains the Refined Changes section
    ];

    return specialPatterns.some(pattern => pattern.test(description));
  };


  const formatSpecialJobDescription = (description: string) => {
    // Remove HTML tags first
    const cleanDescription = description
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<div>/gi, "\n")
      .replace(/<\/div>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/^-{3,}$/gm, ''); // Remove separator lines like ---

    // Split by "Refined Changes:" and take only the first part (if needed)
    const mainContent = cleanDescription.split('Refined Changes:')[0].trim();

    const lines = mainContent.split("\n");
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let key = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join("\n").trim();
        if (text) {
          // Check if paragraph contains HTML formatting
          const hasHtml = text.includes('<strong>') || text.includes('<em>');
          elements.push(
            <p
              key={`p-${key++}`}
              style={{ marginBottom: "16px", lineHeight: "1.6" }}
              {...(hasHtml ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(text) } } : { children: text })}
            />
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Skip empty lines and separator lines
      if (!trimmedLine || trimmedLine === '---') {
        if (currentParagraph.length > 0) {
          flushParagraph();
        }
        return;
      }

      // Handle markdown headers (### or ####)
      const headerMatch = trimmedLine.match(/^(#{3,4})\s+(.+)$/);
      if (headerMatch) {
        flushParagraph();
        const headerLevel = headerMatch[1].length;
        let headerText = headerMatch[2].trim();

        // Remove bold markers from header text
        headerText = headerText.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

        if (headerLevel === 4) {
          // #### is a sub-header (h4)
          elements.push(
            <h4
              key={`h4-${key++}`}
              style={{
                marginTop: "20px",
                marginBottom: "12px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#495057"
              }}
            >
              {headerText}
            </h4>
          );
        } else {
          // ### is a main section header (h3)
          elements.push(
            <h3
              key={`h3-${key++}`}
              className={styles.subSectionTitle}
              style={{
                marginTop: "28px",
                marginBottom: "16px",
                fontSize: "20px",
                fontWeight: "600",
                color: "#212529"
              }}
            >
              {headerText}
            </h3>
          );
        }
        return;
      }

      // Handle bold text that acts as headers (**Header Text**)
      // This must be on its own line and not part of a bullet point
      const boldHeaderMatch = trimmedLine.match(/^\*\*(.+?)\*\*$/);
      if (boldHeaderMatch && !trimmedLine.startsWith('* ') && !trimmedLine.startsWith('- ')) {
        flushParagraph();
        const headerText = boldHeaderMatch[1].trim();

        elements.push(
          <h3
            key={`h3-${key++}`}
            className={styles.subSectionTitle}
            style={{
              marginTop: "28px",
              marginBottom: "16px",
              fontSize: "20px",
              fontWeight: "600",
              color: "#212529"
            }}
          >
            {headerText}
          </h3>
        );
        return;
      }

      // Handle bullet points (starting with *, -, or • followed by space)
      if (
        trimmedLine.startsWith("* ") ||
        trimmedLine.startsWith("- ") ||
        trimmedLine.startsWith("• ")
      ) {
        flushParagraph();

        // Create new list if needed
        if (
          elements.length === 0 ||
          elements[elements.length - 1]?.type !== 'ul'
        ) {
          elements.push(
            <ul key={`ul-${key++}`} className={styles.bulletList}>
              {[]}
            </ul>
          );
        }

        const lastElement = elements[elements.length - 1];
        const bulletText = trimmedLine.replace(/^[-•*]\s*/, "").trim();
        const bulletWithBold = bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const updatedChildren = [
          ...(Array.isArray(lastElement.props.children) ? lastElement.props.children : []),
          <li
            key={`li-${key++}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bulletWithBold) }}
          />,
        ];

        elements[elements.length - 1] = (
          <ul key={lastElement.key} className={styles.bulletList}>
            {updatedChildren}
          </ul>
        );
      }
      // Handle lines with inline bold formatting (**text**)
      else if (trimmedLine.includes('**')) {
        const formattedLine = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        currentParagraph.push(formattedLine);
      }
      else {
        currentParagraph.push(trimmedLine);
      }
    });

    flushParagraph();

    return (
      <div>
        {elements}
      </div>
    );
  };

  // Second function - for regular descriptions (your existing function)
  const formatRegularJobDescription = (description: string) => {
    // Remove HTML tags first
    const cleanDescription = description
      .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to newlines
      .replace(/<div>/gi, "\n") // Convert <div> to newlines
      .replace(/<\/div>/gi, "") // Remove closing </div>
      .replace(/<[^>]*>/g, ""); // Remove any other HTML tags

    // Handle inline bullet points - split by spaces followed by dash
    // This handles cases like: "Text   - Item 1   - Item 2"
    const normalizedDescription = cleanDescription
      .replace(/\s{2,}-\s+/g, "\n- ") // Multiple spaces before dash
      .replace(/\s+-\s+/g, "\n- "); // Single space variations

    const lines = normalizedDescription.split("\n");
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let key = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join("\n").trim();
        if (text) {
          elements.push(
            <p
              key={`p-${key++}`}
              style={{ marginBottom: "16px", lineHeight: "1.6" }}
            >
              {text}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        if (currentParagraph.length > 0) {
          flushParagraph();
        }
        return;
      }

      // Check if line looks like a section header
      const isSectionHeader =
        trimmedLine &&
        !trimmedLine.endsWith(".") &&
        !trimmedLine.endsWith(",") &&
        !trimmedLine.startsWith("-") &&
        !trimmedLine.startsWith("•") &&
        !trimmedLine.startsWith("*") &&
        trimmedLine.length < 80 &&
        (trimmedLine === trimmedLine.toUpperCase() ||
          /^[A-Z][a-zA-Z\s&/]+$/.test(trimmedLine));

      if (isSectionHeader) {
        flushParagraph();
        elements.push(
          <h3
            key={`h-${key++}`}
            className={styles.subSectionTitle}
            style={{ marginTop: "24px", marginBottom: "12px" }}
          >
            {trimmedLine}
          </h3>
        );
      } else if (
        trimmedLine.startsWith("-") ||
        trimmedLine.startsWith("•") ||
        trimmedLine.startsWith("*")
      ) {
        // Handle bullet points
        flushParagraph();
        if (
          elements.length === 0 ||
          !Array.isArray(elements[elements.length - 1]?.props?.children)
        ) {
          elements.push(
            <ul key={`ul-${key++}`} className={styles.bulletList}>
              {[]}
            </ul>
          );
        }
        const lastElement = elements[elements.length - 1];
        const bulletText = trimmedLine.replace(/^[-•*]\s*/, "");
        const updatedChildren = [
          ...(Array.isArray(lastElement.props.children)
            ? lastElement.props.children
            : []),
          <li key={`li-${key++}`}>{bulletText}</li>,
        ];
        elements[elements.length - 1] = (
          <ul key={lastElement.key} className={styles.bulletList}>
            {updatedChildren}
          </ul>
        );
      } else {
        currentParagraph.push(line);
      }
    });

    flushParagraph();

    return <div>{elements}</div>;
  };

  // Main function that decides which formatter to use
  const formatJobDescription = (description: string) => {
    if (hasSpecialFormatting(description)) {
      return formatSpecialJobDescription(description);
    } else {
      return formatRegularJobDescription(description);
    }
  };

  React.useEffect(() => {
    const loadJDRequestData = async () => {
      if (!effectiveId) {
        setError("No JD Request ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await getJDRequestById(effectiveId, accessToken);

        if (result.success && result.data) {
          const data = result.data;

          // Determine the actual status based on flags
          const actualStatus = determineActualStatus(data);

          setFormData({
            jobId: data.JobID || "",
            jobSequence: data.JDCode || "",
            jobRole: data.JobRole || "",
            jobNature: data.JobNature || "",
            department: data.Department || "",
            targetDate: data.TargetDate ? new Date(data.TargetDate) : null,
            numPositions: data.NumPositions || 1,
            workExperience: data.WorkExperience || data.minWorkExperience || 0,
            MinSalaryRange: data.MinSalaryRange || 10,
            MaxSalaryRange: data.MaxSalaryRange || 20,
            salaryRange: data.SalaryRange || 10,
            jobLocation: data.JobLocation || "",
            jobDescription: data.JobDescription || "",
            status: actualStatus,
            skills: Array.isArray(data.Skills)
              ? data.Skills.map((skill: any) => ({
                name: skill.Name || "",
                rating: skill.Rating || 0,
              }))
              : [],
            reportingManager: data.reportingManager
              ? {
                id: data.reportingManager.id,
                displayName: data.reportingManager.displayName,
                email: data.reportingManager.email,
              }
              : null,
            isActive: data.isActive ?? true,
            isPublished: data.isPublished ?? false,
            inActiveReason: data.InActiveReason || "",
          });
        } else {
          setError("Failed to load JD request data");
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
        setError("Failed to load JD request data");
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load JD request data</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadJDRequestData();
  }, [effectiveId, dispatchToast]);

  // Updated helper function to get status badge appearance
  const getStatusBadgeAppearance = (status: string) => {
    switch (status) {
      case "Active":
        return { appearance: "filled" as const, color: "success" as const };
      case "Inactive":
        return { appearance: "filled" as const, color: "warning" as const };
      case "Published":
        return { appearance: "filled" as const, color: "brand" as const };
      default:
        return {
          appearance: "outline" as const,
          color: "informative" as const,
        };
    }
  };

  // Get status icon
  const isHtmlContent = (content: string): boolean =>
    /<\/?(?:p|ul|ol|li|strong|b|em|i|br|h[1-6]|div|span)\b[^>]*>/i.test(content);

  // Helper function to format date
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "Not specified";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Helper function to render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  // Helper function to strip HTML tags from job description
  const stripHtmlTags = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // Helper function to format salary range
  const formatSalaryRange = (formData: FormData): string => {
    if (formData.MinSalaryRange && formData.MaxSalaryRange) {
      return `${formData.MinSalaryRange} - ${formData.MaxSalaryRange} LPA`;
    } else if (formData.salaryRange) {
      return `${formData.salaryRange} LPA`;
    }
    return "Not specified";
  };

  if (isLoading) {
    return (
      <>
        <PreviewSkeleton />
      </>
    );
  }

  if (error || !formData) {
    return (
      <div className="mx-auto max-w-2xl">
        <Divider alignContent="start">Error</Divider>
        <div className="p-4 text-center">
          <Subtitle2Stronger className="text-red-600 mb-2">
            Error
          </Subtitle2Stronger>
          <Body1>{error || "JD Request not found"}</Body1>
          <div className="mt-4">
            <Button
              appearance="primary"
              onClick={() => navigate("/dashboard")}
              icon={<ArrowExportRtlRegular />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadgeProps = getStatusBadgeAppearance(formData.status);

  return (
    <div className="mx-auto space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <Subtitle1 className="mb-2">
              {formData.jobRole} &nbsp;
              <Body1>({formData.jobSequence})</Body1>
            </Subtitle1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BuildingRegular className="w-4 h-4" />
                {formData.department}
              </span>
              <span className="flex items-center gap-1">
                <LocationRegular className="w-4 h-4" />
                {formData.jobLocation}
              </span>
              <span className="flex items-center gap-1">
                <BriefcaseRegular className="w-4 h-4" />
                {formData.jobNature}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <Badge {...statusBadgeProps} size="large">
                {formData.status}
              </Badge>
            </div>
            {/* <div className="text-sm text-gray-500">
              <strong style={{ color: "000000" }}>Job ID: </strong>
              {formData.jobId}
            </div> */}
          </div>
        </div>

        {/* Status Reason Display for Inactive */}
        {formData.status === "Inactive" && formData.inActiveReason && (
          <div className="my-4">
            <MessageBar intent="warning">
              <MessageBarBody>
                <MessageBarTitle>Job Request Inactive</MessageBarTitle>
                Reason: {formData.inActiveReason}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Published Status Indicator */}
        {/* {formData.status === "Published" && (
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>Published & Live</MessageBarTitle>
              This job posting is live and accepting applications from
              candidates.
            </MessageBarBody>
          </MessageBar>
        )} */}
      </div>

      {/* Basic Information */}
      <div className="space-y-4 flex flex-col">
        {/* <Divider alignContent="start"> */}
        <Subtitle2>Basic Information</Subtitle2>
        {/* </Divider> */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Caption1 className="text-gray-600 mb-1">
                Target Hire Date
              </Caption1>
              <div className="flex items-center gap-2">
                <CalendarRegular className="w-4 h-4 text-gray-500" />
                <Body1 style={{ color: "#111827", fontWeight: "500" }}>
                  {formatDate(formData.targetDate)}
                </Body1>
              </div>
            </div>
            <div>
              <Caption1 className="text-gray-600 mb-1">
                Number of Positions
              </Caption1>
              <div className="flex items-center gap-2">
                <PersonRegular className="w-4 h-4 text-gray-500" />
                <Body1 style={{ color: "#111827", fontWeight: "500" }}>
                  {formData.numPositions}{" "}
                  {formData.numPositions === 1 ? "position" : "positions"}
                </Body1>
              </div>
            </div>
            <div>
              <Caption1 className="text-gray-600 mb-1">
                Required Experience
              </Caption1>
              <div className="flex items-center gap-2">
                <TimerRegular className="w-4 h-4 text-gray-500" />
                <Body1 style={{ color: "#111827", fontWeight: "500" }}>
                  {formData.workExperience}{" "}
                  {formData.workExperience === 1 ? "year" : "years"}
                </Body1>
              </div>
            </div>
            <div>
              <Caption1 className="text-gray-600 mb-1">Salary Range</Caption1>
              <div className="flex items-center gap-2">
                <MoneyRegular className="w-4 h-4 text-gray-500" />
                <Body1 style={{ color: "#111827", fontWeight: "500" }}>
                  {formatSalaryRange(formData)}
                </Body1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reporting Manager with Persona */}
      {formData.reportingManager && (
        <div className="space-y-4 flex flex-col">
          {/* <Divider alignContent="start"> */}
          <Subtitle2>Reporting Manager</Subtitle2>
          {/* </Divider> */}
          <div>
            <Persona
              name={formData.reportingManager.displayName}
              secondaryText={formData.reportingManager.email}
              avatar={{
                name: formData.reportingManager.displayName,
                color: "brand",
              }}
              size="large"
            />
          </div>
        </div>
      )}

      {/* Skills & Ratings */}
      <div className="space-y-4 flex flex-col">
        {/* <Divider alignContent="start"> */}
        <Subtitle1>Required Skills & Ratings</Subtitle1>
        {/* </Divider> */}
        <div>
          {formData.skills.length > 0 ? (
            <div className="space-y-4 flex flex-col">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Body1 className="font-medium">{skill.name}</Body1>
                  {renderStarRating(skill.rating)}
                </div>
              ))}
            </div>
          ) : (
            <Body1 className="text-gray-600">No skills specified</Body1>
          )}
        </div>
      </div>

      {/* Job Description with proper whitespace handling */}
      <div className="space-y-4">
        <Subtitle2>Job Description</Subtitle2>
        <div>
          {formData.jobDescription ? (
            isHtmlContent(formData.jobDescription) ? (
              <JobDescriptionRenderer content={formData.jobDescription} />
            ) : (
              <div className="prose max-w-none">
                {formatJobDescription(formData.jobDescription)}
              </div>
            )
          ) : (
            <Body1 className="text-gray-600">No job description provided</Body1>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isNeedControls && (
        <div className="flex gap-4 justify-center pt-4">
          <Button
            appearance="secondary"
            onClick={() => navigate("/recruit")}
            icon={<ArrowExportRtlRegular />}
          >
            Back to Dashboard
          </Button>
          {effectiveId && (
            <Button
              appearance="primary"
              onClick={() => navigate(`/recruit/editJD/${effectiveId}`)}
            >
              Edit JD Request
            </Button>
          )}
        </div>
      )}

      <Toaster toasterId={toasterId} />
    </div>
  );
}

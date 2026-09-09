import React, { useState } from "react";
import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Persona,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  Button,
  Subtitle2,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
  Circle24Regular,
  CommentRegular,
  DismissCircle24Filled,
} from "@fluentui/react-icons";

interface BGVRequestData {
  BGVRequestID: string;
  Status: string;
  SubmittedDate?: string;
  ApprovedDate?: string;
  RejectedDate?: string;
  CompletedDate?: string;
  ApprovedBy?: string;
  RejectedBy?: string;
  CompletedBy?: string;
  RejectionReason?: string;
  ApprovedByDetails?: UserDetails;
  RejectedByDetails?: UserDetails;
  CompletedByDetails?: UserDetails;
  ModifiedByDetails?: UserDetails;
}

interface UserDetails {
  id: string;
  displayName: string;
  email: string;
  givenName?: string;
  surname?: string;
}

interface ApprovalHistoryItem {
  ApprovalHistoryID: string;
  BGVRequestID: string;
  Action: string;
  ActionBy: string;
  ActionDate: string;
  Comments: string;
  ActionByDetails?: UserDetails;
}

const useStyles = makeStyles({
  stepperContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    overflowX: "auto",
    ...shorthands.padding("20px"),
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "8px",
    position: "relative",
  },
  stepWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    position: "relative",
    minWidth: "200px",
  },
  iconContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: "12px",
    justifyContent:"center"
  },
  iconWrapper: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  icon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  completed: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: tokens.colorNeutralBackground1,
  },
  rejected: {
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralBackground1,
  },
  pending: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground3,
    ...shorthands.border("2px", "solid", tokens.colorNeutralStroke2),
  },
  line: {
    position: "absolute",
    top: "50%",
    left: "50%",
    right: "-50%",
    height: "2px",
    backgroundColor: tokens.colorNeutralStroke1,
    zIndex: 1,
    transform: "translateY(-50%)",
  },
  lineCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  lineRejected: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("8px"),
    textAlign: "center",
    width: "100%",
  },
  date: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  yetToPerform: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: "italic",
  },
  commentsButton: {
    marginTop: "4px",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  statusBadge: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
    alignItems: "center",
  },
});

interface StepperItemProps {
  title: string;
  name?: string;
  email?: string;
  status: "Completed" | "Pending" | "Rejected" | "Approved";
  date?: string | null;
  comments?: string;
  showLine: boolean;
  lineStatus?: "Completed" | "Pending" | "Rejected";
}

const StepperItem: React.FC<StepperItemProps> = ({
  title,
  name,
  email,
  status,
  date,
  comments,
  showLine,
  lineStatus = "Pending",
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getIconClassName = () => {
    if (status === "Completed" || status === "Approved")
      return styles.completed;
    if (status === "Rejected") return styles.rejected;
    return styles.pending;
  };

  const getLineClassName = () => {
    let baseClass = styles.line;
    if (lineStatus === "Completed")
      return `${baseClass} ${styles.lineCompleted}`;
    if (lineStatus === "Rejected") return `${baseClass} ${styles.lineRejected}`;
    return baseClass;
  };

  const getBadgeColor = (): "success" | "danger" | "important" => {
    if (status === "Approved") return "success";
    if (status === "Rejected") return "danger";
    if (status === "Completed") return "important";
    return "important";
  };

  const renderIcon = () => {
    if (status === "Completed" || status === "Approved") {
      return <CheckmarkCircle24Filled />;
    }
    if (status === "Rejected") {
      return <DismissCircle24Filled />;
    }
    return <Circle24Regular />;
  };

  return (
    <div className={styles.stepWrapper}>
      <Text weight="semibold" size={300} style={{ marginBottom: "10px" }}>
        {title}
      </Text>
      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          <div className={`${styles.icon} ${getIconClassName()}`}>
            {renderIcon()}
          </div>
        </div>
        {showLine && <div className={getLineClassName()} />}
      </div>
      <div className={styles.content}>
        <div className="flex gap-2 flex-row items-center justify-center">
          {status !== "Pending" && (
            <div className={styles.statusBadge}>
              <Badge appearance="filled" color={getBadgeColor()}>
                {status}
              </Badge>
            </div>
          )}
          {comments && (
            <Dialog
              open={dialogOpen}
              modalType="non-modal"
              onOpenChange={(e, data) => setDialogOpen(data.open)}
            >
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  icon={<CommentRegular />}
                  size="small"
                  className={styles.commentsButton}
                ></Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>
                    <Subtitle2>{title} - Comments</Subtitle2>
                  </DialogTitle>
                  <DialogContent className={styles.dialogContent}>
                    {name && (
                      <Persona
                        name={name}
                        avatar={{ color: "colorful" }}
                        secondaryText={email}
                      />
                    )}
                    {date && (
                      <div>
                        <Text weight="semibold">Date : </Text>
                        <Text>
                          {new Date(date).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </div>
                    )}
                    <div>
                      <Text weight="semibold">Comments :</Text>
                      <Text style={{ marginTop: "8px", display: "block" }}>
                        {comments}
                      </Text>
                    </div>
                  </DialogContent>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}
        </div>

        {status === "Pending" && (
          <Text className={styles.yetToPerform} size={200}>
            Yet to be performed
          </Text>
        )}
        {email && name ? (
          <Persona
            name={name}
            secondaryText={
              date ? (
                <Text className={styles.date} size={200}>
                  {new Date(date).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              ) : undefined
            }
            size="small"
          />
        ) : status !== "Pending" ? (
          <Text className={styles.date} size={200}>
            {date
              ? new Date(date).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        ) : null}
      </div>
    </div>
  );
};

interface BGVHorizontalStepperProps {
  bgvRequest: BGVRequestData;
  approvalHistory?: ApprovalHistoryItem[];
}

const BGVHorizontalStepper: React.FC<BGVHorizontalStepperProps> = ({
  bgvRequest,
  approvalHistory = [],
}) => {
  const styles = useStyles();

  // Determine step statuses
  const isSubmitted = bgvRequest.Status !== "Draft";
  const isApproved =
    bgvRequest.Status === "Approved" || bgvRequest.Status === "Completed";
  const isRejected = bgvRequest.Status === "Rejected";
  const isCompleted = bgvRequest.Status === "Completed";

  // Find approval/rejection action from history
  const approvalAction = approvalHistory.find(
    (item) => item.Action === "Approve" || item.Action === "Reject"
  );

  const steps = [
    {
      title: "Submitted",
      name: bgvRequest.ModifiedByDetails?.displayName,
      email: bgvRequest.ModifiedByDetails?.email,
      status: isSubmitted ? "Completed" : "Pending",
      date: bgvRequest.SubmittedDate,
      comments: undefined,
    },
    {
      title: "Approval",
      name: isApproved
        ? bgvRequest.ApprovedByDetails?.displayName
        : isRejected
        ? approvalAction?.ActionByDetails?.displayName
        : undefined,
      email: isApproved
        ? bgvRequest.ApprovedByDetails?.email
        : isRejected
        ? approvalAction?.ActionByDetails?.email
        : undefined,
      status: isApproved ? "Approved" : isRejected ? "Rejected" : "Pending",
      date: isApproved
        ? bgvRequest.ApprovedDate
        : isRejected
        ? bgvRequest.RejectedDate
        : null,
      comments: isRejected
        ? bgvRequest.RejectionReason || approvalAction?.Comments
        : approvalAction?.Comments,
    },
    {
      title: "Completed",
      name: bgvRequest.CompletedByDetails?.displayName,
      email: bgvRequest.CompletedByDetails?.email,
      status: isCompleted ? "Completed" : "Pending",
      date: bgvRequest.CompletedDate,
      comments: undefined,
    },
  ];

  // Determine line statuses
  const getLineStatus = (index: number) => {
    if (index === 0) {
      // Line between Submitted and Approval
      if (isApproved || isRejected)
        return isRejected ? "Rejected" : "Completed";
    }
    if (index === 1) {
      // Line between Approval and Completed
      if (isCompleted) return "Completed";
      if (isRejected) return "Rejected";
    }
    return "Pending";
  };

  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, index) => (
        <StepperItem
          key={index}
          {...step}
          status={
            step.status as "Completed" | "Pending" | "Rejected" | "Approved"
          }
          showLine={index < steps.length - 1}
          lineStatus={
            getLineStatus(index) as "Completed" | "Pending" | "Rejected"
          }
        />
      ))}
    </div>
  );
};

export default BGVHorizontalStepper;

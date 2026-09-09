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
  Briefcase24Regular,
  ChannelAdd24Regular,
  CommentRegular,
  Database24Regular,
  DismissCircle24Filled,
  PersonBriefcase24Regular,
  PersonShield24Regular,
} from "@fluentui/react-icons";

export interface EmployeeExit {
  ID: string;
  ExitSequence: string;
  ExitID: string;
  Name: string;
  Email: string;
  Phone: string;
  Designation: string;
  WorkLocation: string;
  GroupName: string;
  ManagerUserID: string;
  JoiningDate: string;
  ResignationDate: string;
  RelievingDate: string;
  NoticePeriod: number;
  PersonalMailID?: string;
  Status: string;
  IsCompleted: boolean;
  HeadStatus: string;
  HeadUserID?: string;
  HeadDate?: string | null;
  HeadRemainder?: string | null;
  HRStatus: string;
  HRUserID?: string | null;
  HRDate?: string | null;
  ITStatus: string;
  ITUserID?: string | null;
  ITDate?: string | null;
  ITRemainder?: string | null;
  AdminStatus: string;
  AdminUserID?: string | null;
  AdminDate?: string | null;
  AdminRemarks?: string | null;
  AdminDraftStatus?: string | null;
  AdminRemainder?: string | null;
  AddDeduction?: string | null;
  DeductionAmount?: number | null;
  FinanceStatus: string;
  FinanceUserID?: string | null;
  FinanceDate?: string | null;
  FinanceRemarks?: string | null;
  FinanceDraftStatus?: string | null;
  FinanceRemainder?: string | null;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  IsDeleted?: boolean;
  DeletedAt?: string | null;
  DeletedByUserID?: string | null;
  ROWVERSION?: {
    type: string;
    data: number[];
  };
  ManagerUserIDDetails?: UserDetails;
  CreatedByUserIDDetails?: UserDetails;
  HeadUserIDDetails?: UserDetails;
  ITUserIDDetails?: UserDetails;
  AdminUserIDDetails?: UserDetails;
  HrUserIDDetails?: UserDetails;
  FinanceUserIDDetails?: UserDetails;
  ActivitiesCount?: number;
}

export interface UserDetails {
  id: string;
  displayName: string;
  email: string;
}

const useStyles = makeStyles({
  stepperContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    overflowX: "auto",
    ...shorthands.padding("5px"),
    boxShadow: tokens.shadow2,
    borderRadius: "16px",
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
  },
  iconWrapper: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    width: "100%",
  },
  icon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  completed: {
    backgroundColor: '#21A251',
    color: tokens.colorNeutralBackground1,
  },
  active: {
    backgroundColor: "#0153A5",
    color: "#FFF",
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
  status: "Completed" | "Pending" | "In Progress";
  date?: string | null;
  comments?: string;
  showLine: boolean;
  lineStatus?: "Completed" | "Pending";
  activeStep?: number;
  currentStepIndex?: number;
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
  activeStep,
  currentStepIndex,
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getIconClassName = () => {
    if (status === "Completed") return styles.completed;
    if (currentStepIndex === activeStep) return styles.active;
    return styles.pending;
  };

  const getLineClassName = () => {
    let baseClass = styles.line;
    if (lineStatus === "Completed")
      return `${baseClass} ${styles.lineCompleted}`;
    return baseClass;
  };

  // const getBadgeColor = (): "success" | "warning" | "important" => {
  //   if (status === "Completed") return "success";
  //   if (status === "In Progress") return "warning";
  //   return "important";
  // };

  // const renderIcon = () => {
  //   if (status === "Completed") {
  //     return <CheckmarkCircle24Filled />;
  //   }
  //   return <Circle24Regular />;
  // };

  const getBadgeColor = (): "!text-green-600/80 bg-green-100/60" | "!text-yellow-600/80 bg-yellow-100/60" | "!text-gray-600/80 bg-gray-100/60" => {
    if (status === "Completed") return "!text-green-600/80 bg-green-100/60";
    if (status === "In Progress") return "!text-yellow-600/80 bg-yellow-100/60";
    return "!text-gray-600/80 bg-gray-100/60";
  };

  const renderIcon = (stage: string) => {
    switch (stage) {
      case "Manager Clearance":
        return <ChannelAdd24Regular />
      case "IT Head Clearance":
        return <PersonShield24Regular />
      case "Admin Clearance":
        return <Briefcase24Regular />
      case "HR Clearance":
        return <PersonBriefcase24Regular />
      case "Finance Clearance":
        return <Database24Regular />
      case "KT Clearence":
        return <PersonShield24Regular />
      default:
        return <DismissCircle24Filled />;
    }
  };

  return (
    <div className={styles.stepWrapper}>
      <Text weight="semibold" size={300} style={{ marginBottom: "10px" }}>
        {title}
      </Text>

      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          <div className={`${styles.icon} ${getIconClassName()}`}>
            {renderIcon(title)}
          </div>
        </div>
        {showLine && <div className={getLineClassName()} />}
      </div>
      <div className={styles.content}>
        {status !== "Pending" && (
          <div className={styles.statusBadge}>
            <Badge appearance="ghost" className={`${getBadgeColor()} px-2 py-1 rounded-md font-semibold`}>
              {status?status:"Pending"}
            </Badge>
          </div>
        )}
        <div className="flex gap-2 flex-row items-center justify-center">
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

        {status === "Pending" ||status ===null && (
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

const HorizontalCustomStepper: React.FC<{ data: any, activeStep: number }> = ({ data, activeStep }) => {
  const styles = useStyles();

  const steps = [
    {
      title: "Manager Clearance",
      name: data?.HeadUserIDDetails?.displayName,
      email: data?.HeadUserIDDetails?.email,
      status: data?.HeadStatus,
      date: data?.HeadDate,
      comments: data?.HeadRemainder,
    },
    {
      title: "IT Clearance",
      name: data?.ITUserIDDetails?.displayName,
      email: data?.ITUserIDDetails?.email,
      status: data?.ITStatus,
      date: data?.ITDate,
      comments: data?.ITRemainder,
    },
    {
      title: "Admin Clearance",
      name: data?.AdminUserIDDetails?.displayName,
      email: data?.AdminUserIDDetails?.email,
      status: data?.AdminStatus,
      date: data?.AdminDate,
      comments: data?.AdminRemarks,
    },

    {
      title: "HR Clearance",
      name: data?.HRUserIDDetails?.displayName,
      email: data?.HRUserIDDetails?.email,
      status: data?.HRStatus,
      date: data?.HRDate,
      comments: undefined,
    },

    {
      title: "Finance Clearance",
      name: data?.FinanceUserIDDetails?.displayName,
      email: data?.FinanceUserIDDetails?.email,
      status: data?.FinanceStatus,
      date: data?.FinanceDate,
      comments: data?.FinanceRemarks,
    },
    {
      title: "KT Clearence",
      name: data?.HeadKtUserIdDetails?.displayName,
      email: data?.HeadKtUserIdDetails?.email,
      status: data?.HeadKtStatus,
      date: data?.HeadKtDate,
      comments: undefined,
    },
  ];

  // Determine line statuses
  const getLineStatus = (index: number): "Completed" | "Pending" => {
    if (steps[index + 1]?.status === "Completed") {
      return "Completed";
    }
    return "Pending";
  };

  const getActiveStepIndex = (): number => {
    if (data?.HeadStatus === "Pending") return 0;
    else if (data?.ITStatus === "Pending") return 1;
    else if (data?.AdminStatus === "Pending") return 2;
    else if (data?.HRStatus === "Pending") return 3;
    else if (data?.FinanceStatus === "Pending") return 4;
    else return 5;

  }

  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, index) => (
        <StepperItem
          key={index}
          title={step.title}
          name={step.name}
          email={step.email}
          status={step.status as "Completed" | "Pending" | "In Progress"}
          date={step.date}
          showLine={index < steps.length - 1}
          lineStatus={getLineStatus(index)}
          activeStep={getActiveStepIndex()}
          currentStepIndex={index}
        />
      ))}
    </div>
  );
};

export default HorizontalCustomStepper;

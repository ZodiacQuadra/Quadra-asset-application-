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
  Field,
  Input,
  Checkbox,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
  CheckmarkCircle24Regular,
  CheckmarkCircle32Regular,
  Circle24Regular,
  CommentRegular,
  Info24Regular,
  Person20Regular,
} from "@fluentui/react-icons";
import { title } from "process";

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
  HRUserIDDetails?: UserDetails;
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
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    ...shorthands.padding("20px"),

    borderRadius: "8px",
    position: "relative",
    gap: "30px"
  },
  stepWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "relative",
  },
  iconContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginRight: "20px",
  },
  iconWrapper: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
  },
  icon: {
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "#16A34A",
    overflow: "hidden",
  },
  completed: {
    backgroundColor: "#16A34A",
    color: "#FFFF",
  },
  pending: {
    backgroundColor: "#FACC1530 !important",
    color: "#FA8715",
  },
  line: {
    position: "absolute",
    top: "50px",
    left: "50%",
    width: "2px",
    height: "calc(100% + 10%)",
    backgroundColor: tokens.colorNeutralStroke1,
    zIndex: 1,
    transform: "translateX(-50%)",
  },
  lineCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  content: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.gap("8px"),
    width: "100%",
    paddingBottom: "6px",
    padding: "10px",
    border: `1px solid #E1E1E1 !important`,
    borderRadius: "12px",
    justifyContent: "space-between",
    minHeight: "80px",
    alignItems: "center"
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
    flexDirection: "row",
    ...shorthands.gap("8px"),
    alignItems: "center",
    marginTop: "4px",
  },
  headerRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    ...shorthands.gap("8px"),
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
  updateRemainderNotifications: (title: string) => void;
  checked: boolean;
  checkBox: boolean;
  disabled: boolean;
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
  updateRemainderNotifications,
  checked,
  checkBox,
  disabled
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const getIconClassName = () => {
    if (status === "Completed") return styles.completed;
    return styles.pending;
  };

  const getLineClassName = () => {
    let baseClass = styles.line;
    if (lineStatus === "Completed")
      return `${baseClass} ${styles.lineCompleted}`;
    return baseClass;
  };

  const getBadgeColor = (): "success" | "warning" | "important" => {
    if (status === "Completed") return "success";
    if (status === "In Progress") return "warning";
    return "important";
  };

  const renderIcon = () => {
    if (status === "Completed") {
      return <CheckmarkCircle24Regular />;
    }
    return <Info24Regular />;
  };

  return (
    <div className={styles.stepWrapper}>
      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          <div className={`${styles.icon} ${getIconClassName()}`}>
            {renderIcon()}
          </div>
        </div>
        {showLine && <div className={getLineClassName()} />}
      </div>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <Text weight="semibold" size={300}>
            {
              status === "Completed" ? (
                <div className="flex gap-3 items-center">
                  <Person20Regular />
                  {title}
                </div>
              )

                :
                (
                  <div className="flex gap-3 items-center">
                    {checkBox && <Field color="brand" onChange={() => updateRemainderNotifications(title)}>
                      <Checkbox disabled={disabled} checked={checked} />
                    </Field>}
                    {title}
                  </div>
                )

            }

          </Text>

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
                />
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
                        <Text weight="semibold">Date: </Text>
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
                      <Text weight="semibold">Comments:</Text>
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
        <div className="w-[25%]">
          {status === "Pending" && (
            <Text className={styles.yetToPerform} size={200}>
              Yet to be performed
            </Text>
          )}
          {email && name ? (
            <Persona
              name={name}
              color="colorful"
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
    </div>
  );
};

const VerticalCustomStepper: React.FC<{ data: any, remainderNotifications?: string[], setRemainderNotifications?: React.Dispatch<React.SetStateAction<string[]>> }> = ({ data, remainderNotifications, setRemainderNotifications }) => {

  const styles = useStyles();

  const steps = [
    {
      title: "Manager Clearance",
      name: data?.HeadUserIDDetails?.displayName,
      email: data?.HeadUserIDDetails?.email,
      status: data?.HeadStatus,
      date: data?.HeadDate,
      comments: data?.HeadRemainder,
      disabled: data?.Status !== "Pending" || data?.HeadStatus !== "Pending"

    },
    {
      title: "IT Clearance",
      name: data?.ITUserIDDetails?.displayName,
      email: data?.ITUserIDDetails?.email,
      status: data?.ITStatus,
      date: data?.ITDate,
      comments: data?.ITRemainder,
      disabled: data?.Status !== "Pending" || data?.ITStatus !== "Pending" || data?.HeadStatus === "Pending"
    },
    {
      title: "Admin Clearance",
      name: data?.AdminUserIDDetails?.displayName,
      email: data?.AdminUserIDDetails?.email,
      status: data?.AdminStatus,
      date: data?.AdminDate,
      comments: data?.AdminRemarks,
      disabled: data?.Status !== "Pending" || data?.ITStatus === "Pending" || data?.AdminStatus !== "Pending"

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
      disabled: data?.Status !== "Pending" || data?.FinanceStatus !== "Pending" || data?.HRStatus === "Pending"
    },
    {
      title: "Knowledge Transfer Clearance",
      name: data?.HeadKtUserIdDetails?.displayName,
      email: data?.HeadKtUserIdDetails?.email,
      status: data?.HeadKtStatus,
      date: data?.HeadKtDate,
      comments: data?.HeadKtRemainder,
      disabled: data?.Status !== "Pending" || data?.HeadKtStatus !== "Pending" || data?.FinanceStatus === "Pending"

    }
  ];

  const getLineStatus = (index: number): "Completed" | "Pending" => {
    if (steps[index + 1]?.status === "Completed") {
      return "Completed";
    }
    return "Pending";
  };

  const updateRemainderNotifications = (title: string) => {
    if (!setRemainderNotifications || !remainderNotifications) return;
    setRemainderNotifications(remainderNotifications.includes(title) ? remainderNotifications.filter(item => item !== title) : [...remainderNotifications, title]);
  };

  // console.log("data",data)

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
          updateRemainderNotifications={updateRemainderNotifications}
          checked={remainderNotifications ? remainderNotifications.includes(step.title) : false}
          checkBox={remainderNotifications !== undefined && setRemainderNotifications !== undefined}
          disabled={typeof step.disabled === "boolean" ? step.disabled : true }
        />
      ))}
    </div>
  );
};

export default VerticalCustomStepper;

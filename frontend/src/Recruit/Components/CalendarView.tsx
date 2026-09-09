import { useState } from "react";
import {
  Button,
  Badge,
  Select,
  makeStyles,
  tokens,
  mergeClasses,
  Dialog,
  DialogSurface,
  DialogContent,
  DialogBody,
  DialogActions,
  FluentProvider,
} from "@fluentui/react-components";
import {
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Calendar20Regular,
  Video20Regular,
  Call20Regular,
  Location20Regular,
} from "@fluentui/react-icons";

interface Interview {
  ID: string;
  InterviewTitle: string;
  InterviewType: string;
  ScheduledDateTime: string;
  Duration: number;
  Status: string;
  Location?: string;
  MeetingLink?: string;
  ApplicantName: string;
  JobRole: string;
  Notes?: string;
}

interface CalendarViewProps {
  interviews: Interview[];
}

type ViewMode = "day" | "week" | "month";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "auto",
    marginBottom: "10px",
  },
  calendarCard: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  cardHeader: {
    paddingBottom: tokens.spacingVerticalS,
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  controlsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    // borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    marginBottom: "18px",
  },
  dateControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dateHeader: {
    color: "#0078D4",
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  viewSelect: {
    width: "128px",
  },
  dayView: {
    flex: 1,
    overflow: "auto",
    position: "relative",
    borderRadius: "8px",
  },
  dayGrid: {
    display: "grid",
    gridTemplateColumns: "80px 1fr",
    minHeight: "100%",
    position: "relative",
  },
  timeColumn: {
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    // backgroundColor: tokens.colorBrandBackground2Hover,
    backgroundColor: "#EFF6FF",
    position: "sticky",
    left: 0,
    zIndex: 1,
  },
  timeSlot: {
    height: "60px",
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
    // color: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "flex-start",
    color: "#374151",
    backgroundColor: "#EFF6FF",
  },
  eventColumn: {
    position: "relative",
    minHeight: "1440px", // 24 hours * 60px
  },
  eventSlot: {
    height: "60px",
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    position: "relative",
  },
  interviewEvent: {
    position: "absolute",
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalXS,
    cursor: "pointer",
    ":hover": {
      boxShadow: tokens.shadow64,
    },
    boxShadow: tokens.shadow8,
    transitionProperty: "box-shadow",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    overflow: "hidden",
    zIndex: 2,
  },
  weekView: {
    flex: 1,
    overflow: "auto",
    borderRadius: "8px",
  },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "80px repeat(7, 1fr)",
    minHeight: "100%",
  },
  dayHeader: {
    height: "48px",
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalXS,
    textAlign: "center",
    // backgroundColor: tokens.colorBrandBackground2Hover,
    backgroundColor: "#EFF6FF",
  },
  todayHeader: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  todayBadge: {
    // backgroundColor: tokens.colorBrandBackground,
    background: "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
    color: "#ffffff",
    fontSize: tokens.fontSizeBase200,
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  monthView: {
    flex: 1,
    overflow: "auto",
    borderRadius: "8px",
  },
  monthGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
  monthDayHeader: {
    padding: tokens.spacingHorizontalS,
    textAlign: "center",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
    // color: tokens.colorBrandBackground,
    color: "#374151",
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    borderLeft: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    // backgroundColor: tokens.colorBrandBackground2Hover,
    backgroundColor: "#EFF6FF",
  },
  monthDay: {
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalXS,
    minHeight: "120px",
    position: "relative",
  },
  otherMonthDay: {
    color: tokens.colorNeutralForeground4,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  dialogHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalL,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    marginBottom: tokens.spacingVerticalL,
  },
  dialogColorBar: {
    width: "4px",
    height: "48px",
    borderRadius: tokens.borderRadiusMedium,
    flexShrink: 0,
    marginTop: "4px",
  },
  dialogTitleSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    flex: 1,
  },
  dialogTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground1,
  },
  dialogSubtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  detailRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
  },
  detailIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
    marginTop: "2px",
  },
  detailContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    flex: 1,
  },
  detailLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: tokens.fontWeightSemibold,
  },
  detailValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  badgeContainer: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
  detailSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0px",
  },
  notesSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalM,
  },
  notesText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  meetingLink: {
    color: tokens.colorBrandForeground1,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  eventText: {
    fontSize: "11px",
    lineHeight: "14px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  eventTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: "2px",
  },
  eventSubtitle: {
    opacity: 0.8,
  },
  eventTime: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    marginTop: "2px",
  },
});

export default function CalendarView({ interviews }: any) {
  const styles = useStyles();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const today = new Date();

  // Helper function to parse UTC time as local time (IST)
  // Treats UTC time values as if they were local time
  const parseAsLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    // Create a new date using UTC components but treating them as local
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }

    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case "day":
        return { start, end };
      case "week":
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        return { start, end };
      case "month":
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        return { start, end };
    }
  };

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter((interview: any) => {
      const interviewDate = parseAsLocalTime(interview.ScheduledDateTime);
      return (
        interviewDate.getFullYear() === date.getFullYear() &&
        interviewDate.getMonth() === date.getMonth() &&
        interviewDate.getDate() === date.getDate()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "#deebf8ff";
      case "completed":
        return "#d5f9d5ff";
      case "cancelled":
        return "#fad9d9ff";
      case "rescheduled":
        return "#faf1d4ff";
      default:
        return "#dddbdaff";
    }
  };

  const getInterviewIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "virtual":
        return <Video20Regular className={styles.detailIcon} />;
      case "phone":
        return <Call20Regular className={styles.detailIcon} />;
      case "in-person":
        return <Location20Regular className={styles.detailIcon} />;
      default:
        return <Calendar20Regular className={styles.detailIcon} />;
    }
  };

  const handleInterviewClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedInterview(null);
  };

  const formatDateHeader = () => {
    const { start, end } = getDateRange();

    switch (viewMode) {
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      case "week":
        if (start.getMonth() === end.getMonth()) {
          return `${start.toLocaleDateString("en-US", {
            month: "long",
          })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else {
          return `${start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })} - ${end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}, ${start.getFullYear()}`;
        }
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
    }
  };

  // Helper function to calculate overlapping events positioning
  const calculateEventPositions = (interviews: any[]) => {
    const sortedInterviews = [...interviews].sort(
      (a, b) =>
        parseAsLocalTime(a.ScheduledDateTime).getTime() -
        parseAsLocalTime(b.ScheduledDateTime).getTime()
    );

    const eventColumns: any[][] = [];

    sortedInterviews.forEach((interview) => {
      const startTime = parseAsLocalTime(interview.ScheduledDateTime);
      const endTime = new Date(
        startTime.getTime() + interview.Duration * 60000
      );

      let columnIndex = 0;
      let placed = false;

      // Find the first column where this event doesn't overlap
      while (!placed) {
        if (!eventColumns[columnIndex]) {
          eventColumns[columnIndex] = [];
        }

        const hasOverlap = eventColumns[columnIndex].some((existingEvent) => {
          const existingStart = parseAsLocalTime(
            existingEvent.ScheduledDateTime
          );
          const existingEnd = new Date(
            existingStart.getTime() + existingEvent.Duration * 60000
          );

          return startTime < existingEnd && endTime > existingStart;
        });

        if (!hasOverlap) {
          eventColumns[columnIndex].push(interview);
          interview._columnIndex = columnIndex;
          placed = true;
        } else {
          columnIndex++;
        }
      }
    });

    // Calculate max concurrent events for width calculation
    const maxColumns = eventColumns.length;
    sortedInterviews.forEach((interview) => {
      interview._maxColumns = maxColumns;
    });

    return sortedInterviews;
  };

  const renderDayView = () => {
    const dayInterviews = getInterviewsForDate(currentDate);
    const positionedInterviews = calculateEventPositions(dayInterviews);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className={styles.dayView}>
        <div className={styles.dayGrid}>
          {/* Time column */}
          <div className={styles.timeColumn}>
            {hours.map((hour) => (
              <div key={hour} className={styles.timeSlot}>
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className={styles.eventColumn}>
            {hours.map((hour) => (
              <div key={hour} className={styles.eventSlot} />
            ))}

            {/* Interview events */}
            {positionedInterviews.map((interview: any) => {
              const interviewDate = parseAsLocalTime(
                interview.ScheduledDateTime
              );
              const hour = interviewDate.getHours();
              const minute = interviewDate.getMinutes();
              const top = hour * 60 + minute;
              const height = Math.max(interview.Duration, 40);

              const columnIndex = interview._columnIndex || 0;
              const maxColumns = interview._maxColumns || 1;
              const width = `${95 / maxColumns}%`;
              const left = `${(columnIndex * 95) / maxColumns + 2}%`;

              return (
                <div
                  key={interview.ID}
                  className={styles.interviewEvent}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    width: width,
                    left: left,
                    backgroundColor: `${getStatusColor(interview.Status)}`,
                    // borderLeft: `4px solid ${getStatusColor(interview.Status)}`,
                  }}
                  onClick={() => handleInterviewClick(interview)}
                >
                  <div className={`${styles.eventText} ${styles.eventTitle}`}>
                    {interview.InterviewTitle}
                  </div>
                  <div
                    className={`${styles.eventText} ${styles.eventSubtitle}`}
                  >
                    {interview.ApplicantName}
                  </div>
                  <div className={`${styles.eventText} ${styles.eventTime}`}>
                    {getInterviewIcon(interview.InterviewType)}
                    <span>
                      {interviewDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const { start } = getDateRange();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className={styles.weekView}>
        <div className={styles.weekGrid}>
          {/* Time column */}
          <div className={styles.timeColumn}>
            <div className={styles.eventSlot} /> {/* Header spacer */}
            {hours.map((hour) => (
              <div key={hour} className={styles.timeSlot}>
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? "12 PM"
                  : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const dayInterviews = getInterviewsForDate(day);
            const positionedInterviews = calculateEventPositions(dayInterviews);
            const isToday = day.toDateString() === today.toDateString();

            return (
              <div
                key={dayIndex}
                className="relative"
                style={{
                  borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
                }}
              >
                {/* Day header */}
                <div
                  className={mergeClasses(
                    styles.dayHeader,
                    isToday && styles.todayHeader
                  )}
                >
                  <div className="text-xs">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className={isToday ? styles.todayBadge : "text-sm"}>
                    {day.getDate()}
                  </div>
                </div>

                {/* Hour grid */}
                {hours.map((hour) => (
                  <div key={hour} className={styles.eventSlot} />
                ))}

                {/* Interview events */}
                {positionedInterviews.map((interview: any) => {
                  const interviewDate = parseAsLocalTime(
                    interview.ScheduledDateTime
                  );
                  const hour = interviewDate.getHours();
                  const minute = interviewDate.getMinutes();
                  const top = 48 + hour * 60 + minute;
                  const height = Math.max(interview.Duration, 30);

                  const columnIndex = interview._columnIndex || 0;
                  const maxColumns = interview._maxColumns || 1;
                  const width = `${95 / maxColumns}%`;
                  const left = `${(columnIndex * 95) / maxColumns + 2}%`;

                  return (
                    <div
                      key={interview.ID}
                      className={styles.interviewEvent}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        width: width,
                        left: left,
                        backgroundColor: `${getStatusColor(
                          interview.Status
                        )}`,
                       
                      }}
                      onClick={() => handleInterviewClick(interview)}
                    >
                      <div
                        className={`${styles.eventText} ${styles.eventTitle}`}
                      >
                        {interview.InterviewTitle}
                      </div>
                      <div
                        className={`${styles.eventText} ${styles.eventSubtitle}`}
                      >
                        {interview.ApplicantName}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const { start } = getDateRange();
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    // Get first day of the week for the month
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());

    // Get last day of the week for the month
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const weeks = [];
    const currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentWeekStart);
        day.setDate(currentWeekStart.getDate() + i);
        week.push(day);
      }
      weeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return (
      <div className={styles.monthView}>
        <div className={styles.monthGrid}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className={styles.monthDayHeader}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-rows-6 flex-1">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7"
              style={{
                borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
                borderLeft: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
              }}
            >
              {week.map((day, dayIndex) => {
                const dayInterviews = getInterviewsForDate(day);
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === today.toDateString();

                return (
                  <div
                    key={dayIndex}
                    className={mergeClasses(
                      styles.monthDay,
                      !isCurrentMonth && styles.otherMonthDay
                    )}
                  >
                    <div
                      className={mergeClasses(
                        "text-sm mb-1",
                        isToday && styles.todayBadge
                      )}
                    >
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayInterviews.slice(0, 3).map((interview: any) => {
                        const interviewDate = parseAsLocalTime(
                          interview.ScheduledDateTime
                        );
                        return (
                          <div
                            key={interview.ID}
                            className="text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow truncate"
                            style={{
                              backgroundColor: `${getStatusColor(
                                interview.Status
                              )}`,
                              // borderLeft: `2px solid ${getStatusColor(
                              //   interview.Status
                              // )}`,
                            }}
                            onClick={() => handleInterviewClick(interview)}
                          >
                            <div className="font-medium truncate">
                              {interviewDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              {interview.InterviewTitle}
                            </div>
                            <div className="text-gray-600 truncate">
                              {interview.ApplicantName}
                            </div>
                          </div>
                        );
                      })}

                      {dayInterviews.length > 3 && (
                        <div role="button" onClick={()=>{
                          setCurrentDate(day);
                          setViewMode("day")
                          }} className="text-xs text-gray-500 p-1 cursor-pointer hover:underline">
                          +{dayInterviews.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.root}>
      {/* Calendar Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.dateControls}>
          <div className={styles.dateHeader}>{formatDateHeader()}</div>
          <Button
            appearance="subtle"
            size="small"
            icon={<ChevronLeft20Regular style={{ color: "#374151" }} />}
            onClick={() => navigateDate("prev")}
          />
          <Button
            appearance="subtle"
            size="small"
            icon={<ChevronRight20Regular style={{ color: "#374151" }} />}
            onClick={() => navigateDate("next")}
          />
          <Button
            appearance="subtle"
            size="small"
            onClick={goToToday}
            style={{ color: "#374151" }}
          >
            Today
          </Button>
        </div>

        <Select
          value={viewMode}
          onChange={(_, data) => setViewMode(data.value as ViewMode)}
          className={styles.viewSelect}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </Select>
      </div>
      <FluentProvider style={{ background: "transparent" }}>
        <div style={{ flex: 1, overflow: "auto" }}>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </div>
      </FluentProvider>

      <FluentProvider style={{ background: "transparent" }}>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(_event, data) => {
            setIsDialogOpen(data.open);
            if (!data.open) {
              setSelectedInterview(null);
            }
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogContent className={styles.dialogContent}>
                {selectedInterview && (
                  <>
                    {/* Header with color bar and title */}
                    <div className={styles.dialogHeader}>
                      <div
                        className={styles.dialogColorBar}
                        style={{
                          backgroundColor: getStatusColor(
                            selectedInterview.Status
                          ),
                        }}
                      />
                      <div className={styles.dialogTitleSection}>
                        <div className={styles.dialogTitle}>
                          {selectedInterview.InterviewTitle}
                        </div>
                        <div className={styles.dialogSubtitle}>
                          {parseAsLocalTime(
                            selectedInterview.ScheduledDateTime
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}{" "}
                          •{" "}
                          {parseAsLocalTime(
                            selectedInterview.ScheduledDateTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(
                            parseAsLocalTime(
                              selectedInterview.ScheduledDateTime
                            ).getTime() +
                              selectedInterview.Duration * 60000
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.detailSection}>
                      {/* Interview Type and Status */}
                      <div className={styles.detailRow}>
                        {getInterviewIcon(selectedInterview.InterviewType)}
                        <div className={styles.detailContent}>
                          <div className={styles.detailValue}>
                            {selectedInterview.InterviewType} Interview •{" "}
                            <Badge
                              color="brand"
                              shape="rounded"
                              size="small"
                              style={{
                                backgroundColor: `${getStatusColor(
                                  selectedInterview.Status
                                )}20`,
                                color: getStatusColor(selectedInterview.Status),
                                borderColor: getStatusColor(
                                  selectedInterview.Status
                                ),
                              }}
                            >
                              {selectedInterview.Status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Meeting Link or Location */}
                      {selectedInterview.MeetingLink && (
                        <div className={styles.detailRow}>
                          <Video20Regular className={styles.detailIcon} />
                          <div className={styles.detailContent}>
                            <div className={styles.detailLabel}>
                              Virtual Meeting
                            </div>
                            <a
                              href={selectedInterview.MeetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.meetingLink}
                            >
                              Join Interview
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedInterview.Location && (
                        <div className={styles.detailRow}>
                          <Location20Regular className={styles.detailIcon} />
                          <div className={styles.detailContent}>
                            <div className={styles.detailLabel}>Location</div>
                            <div className={styles.detailValue}>
                              {selectedInterview.Location}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Candidate Details */}
                      <div className={styles.detailRow}>
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: tokens.colorBrandBackground2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: tokens.fontWeightSemibold,
                            color: tokens.colorBrandForeground2,
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          {selectedInterview.ApplicantName.charAt(0)}
                        </div>
                        <div className={styles.detailContent}>
                          <div className={styles.detailLabel}>Candidate</div>
                          <div className={styles.detailValue}>
                            {selectedInterview.ApplicantName}
                          </div>
                          <div
                            style={{
                              fontSize: tokens.fontSizeBase200,
                              color: tokens.colorNeutralForeground3,
                            }}
                          >
                            {selectedInterview.JobRole}
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {selectedInterview.Notes && (
                        <div className={styles.notesSection}>
                          <div className={styles.detailLabel}>Notes</div>
                          <p className={styles.notesText}>
                            {selectedInterview.Notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={handleDialogClose}>
                  Close
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>

      {/* Interview Details Dialog */}
    </div>
  );
}

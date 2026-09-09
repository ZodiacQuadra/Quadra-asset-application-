import React from "react";
import { makeStyles, shorthands, tokens, Text, mergeClasses } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("20px"),
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
    width: "100%",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding("24px", "24px", "0", "24px"),
    marginBottom: "16px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    backgroundColor: tokens.colorNeutralStroke1,
    gap: "1px", // Border effect
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  dayHeader: {
    textAlign: "center",
    ...shorthands.padding("12px", "8px"),
    fontSize: "12px",
    color: tokens.colorNeutralForeground4,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: "#F8FAFC",
  },
  dayCell: {
    position: "relative",
    minHeight: "120px",
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    flexDirection: "column",
    ...shorthands.padding("8px"),
    gap: "4px",
    transitionProperty: "background-color",
    transitionDuration: "0.2s",
    ":hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  dateNumber: {
    fontSize: "14px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground3,
    marginBottom: "4px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayBadge: {
    backgroundColor: tokens.colorBrandBackground,
    color: "#ffffff",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },
  otherMonthDay: {
    backgroundColor: "#F1F5F9",
    color: tokens.colorNeutralForeground4,
  },
  
  // Event Pill Styles
  eventPill: {
    ...shorthands.padding("4px", "8px"),
    ...shorthands.borderRadius("6px"),
    fontSize: "11px",
    lineHeight: "1.2",
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    ...shorthands.overflow("hidden"),
    borderLeftWidth: "3px",
    borderLeftStyle: "solid",
  },
  eventTitle: {
    fontWeight: "700",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  eventSubtitle: {
    opacity: 0.8,
    fontSize: "10px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },

  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    ...shorthands.padding("20px", "24px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendColor: {
    width: "12px",
    height: "12px",
    borderRadius: "4px",
  }
});

export interface CalendarEvent {
  type: "attendance" | "leave" | "holiday" | "absent";
  title: string;
  subtitle?: string;
  color: string;
  textColor: string;
  borderColor?: string;
}

interface AttendanceCalendarProps {
  month: number;
  year: number;
  attendanceData?: Record<number, CalendarEvent[] |"present" | "absent" | "late" | "holiday" | "requested_leave" | "approved_leave">;
  isCompact?: boolean;
  onDateClick?: (date: Date) => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ month, year, attendanceData = {}, isCompact = false, onDateClick }) => {
  const styles = useStyles();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  // Grid calculation similar to recruitment calendar
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1));

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (endDate.getDay() === 0 ? 0 : 7 - endDate.getDay()));

  const today = new Date();
  // Use local date methods — toISOString() returns UTC which causes an off-by-one
  // day error for timezones ahead of UTC (e.g. IST = UTC+5:30)
  const toLocalYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayYMD = toLocalYMD(today);

  const days = [];
  const curr = new Date(startDate);
  
  while (curr <= endDate || days.length < 42) {
    const d = curr.getDate();
    const m = curr.getMonth();
    const y = curr.getFullYear();
    const ymd = toLocalYMD(curr);
    
    const isCurrentMonth = m === month;
    const isToday = ymd === todayYMD;
    const isWeekend = curr.getDay() === 0 || curr.getDay() === 6;
    const rawEvents = isCurrentMonth ? (attendanceData[d] || []) : [];
    const events: CalendarEvent[] = Array.isArray(rawEvents) ? rawEvents : [];

    const cellDate = new Date(y, m, d);
    days.push(
      <div 
        key={ymd} 
        className={mergeClasses(
          styles.dayCell, 
          !isCurrentMonth && styles.otherMonthDay
        )}
        style={{
          cursor: onDateClick && isCurrentMonth ? "pointer" : "default",
          ...(isCompact ? { minHeight: "80px" } : {})
        }}
        onClick={() => {
          if (onDateClick && isCurrentMonth) {
            onDateClick(cellDate);
          }
        }}
      >
        <div className={styles.dateNumber}>
          <span className={isToday ? styles.todayBadge : ""}>{d}</span>
          {!isCurrentMonth && m === (month + 1) % 12 && d === 1 && (
             <span style={{ fontSize: "10px", opacity: 0.6 }}>
               {curr.toLocaleDateString("en-US", { month: "short" })}
             </span>
          )}
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflow: "hidden" }}>
          {(events as CalendarEvent[]).map((event, idx) => (
            <div 
              key={idx} 
              className={styles.eventPill}
              style={{ 
                backgroundColor: event.color, 
                color: event.textColor,
                borderLeftColor: event.borderColor || event.textColor
              }}
            >
              <div className={styles.eventTitle}>{event.title}</div>
              {event.subtitle && <div className={styles.eventSubtitle}>{event.subtitle}</div>}
            </div>
          ))}
          {isCurrentMonth && events.length === 0 && isWeekend && !isToday && (
             <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.2 }}>
                <Text size={100} weight="semibold">WEEKEND</Text>
             </div>
          )}
        </div>
      </div>
    );
    curr.setDate(curr.getDate() + 1);
    if (days.length >= 42) break;
  }

  return (
    <div className={styles.container}>
      {!isCompact && (
        <div className={styles.header}>
          <Text weight="bold" size={400} style={{ color: tokens.colorNeutralForeground1 }}>Attendance Calendar</Text>
          <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1, backgroundColor: `${tokens.colorBrandBackground}11`, padding: "4px 12px", borderRadius: "20px" }}>
            {new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        </div>
      )}
      <div className={styles.grid}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
        {days}
      </div>

      {!isCompact && (
        <div className={styles.legend}>
          {[
            { color: "#ecfdf5", text: "Present", border: "#059669" },
            { color: "#fff1f2", text: "Absent", border: "#e11d48" },
            { color: "#fffbeb", text: "Late", border: "#d97706" },
            { color: "#eff6ff", text: "Holiday", border: "#2563eb" },
            { color: "#f5f3ff", text: "Approved Leave", border: "#7c3aed" },
            { color: "#f0fdfa", text: "Requested Leave", border: "#0d9488" },
          ].map((item) => (
            <div key={item.text} className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: item.color, border: `1px solid ${item.border}` }} />
              <Text size={100} weight="medium">{item.text}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;

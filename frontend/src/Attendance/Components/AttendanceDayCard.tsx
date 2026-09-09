import React from 'react';
import { makeStyles, Text, Button, shorthands } from '@fluentui/react-components';
import {
  Clock, MapPin, ArrowUpRight, ArrowDownRight, LogIn, LogOut,
  Calendar, Moon, Coffee, CheckCircle, AlertCircle, Bell, Heart,
  Shield, AlertTriangle
} from 'lucide-react';

export interface AttendanceDayCardProps {
  date: Date;
  status: 'present' | 'active' | 'absent' | 'weekend' | 'approved_leave' | 'pending_leave' | 'holiday' | 'future' | 'nodata';
  sessions?: {
    checkIn?: string;
    checkOut?: string;
    durationMinutes?: number | null;
    workLocationType?: string;
    violationType?: string;
  }[];
  permissions?: {
    startTime: string;
    endTime: string;
    reason: string;
    durationMinutes: number;
    effectiveMinutes: number;  // overlap with work window (what was actually deducted)
  }[];
  leaveTypeName?: string;
  leaveStart?: string;
  leaveEnd?: string;
  leaveAppliedOn?: string;
  leaveApprovalStatus?: string;
  holidayName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  weekSummary?: {
    totalMinutes: number;
    daysWorked: number;
    daysOff: number;
    weekLabel: string;
  };
  onFixAttendance?: () => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    ...shorthands.padding('24px'),
    backgroundColor: '#ffffff',
  },
  // Hero Sections
  heroActive: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius('16px'),
    backgroundColor: '#ecfdf5',
    ...shorthands.border('1px', 'solid', '#d1fae5'),
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroAbsent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius('16px'),
    backgroundColor: '#fef2f2',
    ...shorthands.border('1px', 'solid', '#fee2e2'),
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroWeekend: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius('16px'),
    backgroundColor: '#fffbeb',
    ...shorthands.border('1px', 'solid', '#fef3c7'),
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroLeave: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...shorthands.padding('24px', '20px'),
    ...shorthands.borderRadius('16px'),
    backgroundColor: '#f5f3ff',
    ...shorthands.border('1px', 'solid', '#e0e7ff'),
    gap: '16px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroTextSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: '20px',
    fontWeight: '800',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.4',
  },
  heroImageRight: {
    maxHeight: '120px',
    maxWidth: '140px',
    objectFit: 'contain',
    zIndex: 1,
  },
  heroImageCenter: {
    maxHeight: '160px',
    maxWidth: '100%',
    objectFit: 'contain',
    marginBottom: '8px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius('9999px'),
    fontSize: '12px',
    fontWeight: '600',
    width: 'fit-content',
    marginTop: '6px',
  },
  // Stat Grids & Cards
  sessionCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', '#f1f5f9'),
    backgroundColor: '#f8fafc',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...shorthands.padding('12px', '14px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e2e8f0'),
  },
  statIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  statText: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    marginTop: '2px',
  },
  // Section Headings
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '6px',
    marginTop: '8px',
    marginBottom: '4px',
  },
  // Banners & Warnings
  insightBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid'),
    gap: '10px',
  },
  noteBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#fee2e2'),
    backgroundColor: '#fef2f2',
    gap: '12px',
  },
  noteTextSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
  },
  fixBtn: {
    backgroundColor: '#ffffff',
    color: '#dc2626',
    ...shorthands.border('1.5px', 'solid', '#fca5a5'),
    fontWeight: '600',
    ...shorthands.borderRadius('9999px'),
    ...shorthands.padding('6px', '16px'),
    fontSize: '12px',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#fef2f2',
      ...shorthands.borderColor('#dc2626'),
    },
  },
  // Table layout for Leave
  leaveTable: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#e2e8f0'),
    backgroundColor: '#fcfbfe',
    overflow: 'hidden',
  },
  leaveRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('14px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', '#f1f5f9'),
    ':last-child': {
      ...shorthands.borderBottom('none'),
    },
  },
  leaveCellLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  leaveCellRight: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1e293b',
  },
  // Quotes & Callouts
  quoteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid'),
  },
  quoteText: {
    fontSize: '13px',
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: '1.4',
  },
  // Weekend ideas
  ideasGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '8px',
  },
  ideaCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    ...shorthands.padding('12px', '6px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#e2e8f0'),
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  },
  ideaText: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
  },
});

// Helper: Format Time Str to readable format
const formatTimeHHMM = (timeStr?: string | null) => {
  if (!timeStr) return '--:--';
  try {
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(0, 5);
    const [h, m] = timePart.split(':');
    const hours = parseInt(h);
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${m}${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

// Helper: Format Duration Minutes to h & m
const formatDuration = (totalMinutes?: number | null) => {
  if (totalMinutes === undefined || totalMinutes === null) return '--:--';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper: extract a Date (with calendar date) from an ISO timestamp. Returns null
// for time-only / sentinel values that carry no meaningful date.
const dateFromTimestamp = (s?: string | null): Date | null => {
  if (!s || !s.includes('T') || s.startsWith('1900-01-01')) return null;
  const d = new Date(s.replace(/Z$/, ''));
  return isNaN(d.getTime()) ? null : d;
};

// Helper: clock hours (0–24) for a timestamp, used to detect a midnight crossover.
const clockHours = (s?: string | null): number | null => {
  if (!s) return null;
  try {
    const t = s.includes('T') ? s.split('T')[1].slice(0, 5) : s.slice(0, 5);
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h + m / 60;
  } catch {
    return null;
  }
};

// Helper: short date label, e.g. "17 Jul 2026".
const formatDateShort = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const AttendanceDayCard: React.FC<AttendanceDayCardProps> = ({
  date,
  status,
  sessions = [],
  permissions = [],
  leaveTypeName,
  leaveStart,
  leaveEnd,
  leaveAppliedOn,
  leaveApprovalStatus,
  holidayName,
  shiftStart,
  shiftEnd,
  weekSummary,
  onFixAttendance,
}) => {
  const styles = useStyles();

  // 1. PRESENT / ACTIVE CARD VIEW
  if (status === 'present' || status === 'active') {
    // Determine the main session/first session details for insights
    const mainSession = sessions[0];
    const isLate = mainSession?.violationType === 'Late' || mainSession?.violationType === 'Both';
    const isEarly = mainSession?.violationType === 'Early';

    return (
      <div className={styles.container}>
        {/* Hero Banner */}
        <div className={styles.heroActive}>
          <div className={styles.heroTextSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '4px' }}>
              <CheckCircle size={24} style={{ color: '#059669', flexShrink: 0 }} />
            </div>
            <Text className={styles.heroTitle} style={{ color: '#059669' }}>
              {status === 'active' ? 'Active now!' : 'Great work today!'}
            </Text>
            <Text className={styles.heroSubtitle}>
              {status === 'active'
                ? 'You are currently checked in and working.'
                : 'You completed full working hours. ✨'}
            </Text>
          </div>
          <img src="/laptop_guy.png" alt="Present Illustration" className={styles.heroImageRight} />
        </div>

        {/* Sessions Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sessions.map((session, idx) => {
            const hasSentinelCheckout = session.checkOut?.startsWith("1900-01-01");
            const rawDur = hasSentinelCheckout
              ? null
              : (session.durationMinutes ?? null);
            const durationFormatted = rawDur !== null ? formatDuration(rawDur) : '--:--';

            // Dates for check-in / check-out. When the shift runs past midnight
            // (check-out clock is at/before check-in, or the stored dates differ),
            // the check-out lands on the next day (start date + 1).
            const checkInDate = dateFromTimestamp(session.checkIn) ?? date;
            const hasCheckOut = !!session.checkOut && !hasSentinelCheckout;
            const outDateRaw = dateFromTimestamp(session.checkOut);
            const inClock = clockHours(session.checkIn);
            const outClock = clockHours(session.checkOut);
            const overnight =
              (outDateRaw !== null && outDateRaw.toDateString() !== checkInDate.toDateString()) ||
              (inClock !== null && outClock !== null && outClock < inClock);
            const checkOutDate = overnight
              ? new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000)
              : checkInDate;

            return (
              <div key={idx} className={styles.sessionCard}>
                {sessions.length > 1 && (
                  <Text size={100} weight="semibold" style={{ color: '#6366f1', marginBottom: '4px', display: 'block' }}>
                    SESSION {idx + 1}
                  </Text>
                )}
                <div className={styles.statGrid}>
                  {/* Check-In */}
                  <div className={styles.statBox}>
                    <div className={styles.statIconWrapper} style={{ backgroundColor: '#ecfdf5' }}>
                      <LogIn size={18} style={{ color: '#059669' }} />
                    </div>
                    <div className={styles.statText}>
                      <span className={styles.statLabel}>Check-in</span>
                      <span className={styles.statValue}>{formatTimeHHMM(session.checkIn)}</span>
                      <span className={styles.statLabel} style={{ marginTop: '2px' }}>{formatDateShort(checkInDate)}</span>
                    </div>
                  </div>

                  {/* Check-Out */}
                  <div className={styles.statBox}>
                    <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff' }}>
                      <LogOut size={18} style={{ color: '#1d4ed8' }} />
                    </div>
                    <div className={styles.statText}>
                      <span className={styles.statLabel}>
                        Check-Out
                        {hasCheckOut && overnight && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '6px', color: '#6366f1', fontWeight: 700 }}>
                            <Moon size={11} /> +1 day
                          </span>
                        )}
                      </span>
                      <span className={styles.statValue}>
                        {hasCheckOut ? formatTimeHHMM(session.checkOut) : '—'}
                      </span>
                      {hasCheckOut && (
                        <span className={styles.statLabel} style={{ marginTop: '2px' }}>{formatDateShort(checkOutDate)}</span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className={styles.statBox}>
                    <div className={styles.statIconWrapper} style={{ backgroundColor: '#fff7ed' }}>
                      <Clock size={18} style={{ color: '#d97706' }} />
                    </div>
                    <div className={styles.statText}>
                      <span className={styles.statLabel}>Duration worked</span>
                      <span className={styles.statValue}>{durationFormatted}</span>
                      {sessions.length === 1 && session.checkOut && !hasSentinelCheckout && rawDur !== null && rawDur >= 180 && (
                        <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 500, marginTop: '2px' }}>Excl. 1 hr lunch break</span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className={styles.statBox}>
                    <div className={styles.statIconWrapper} style={{ backgroundColor: '#fef9c3' }}>
                      <MapPin size={18} style={{ color: '#ca8a04' }} />
                    </div>
                    <div className={styles.statText}>
                      <span className={styles.statLabel}>Work Location</span>
                      <span className={styles.statValue}>{session.workLocationType || 'Office'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Permission Section */}
        {permissions.length > 0 && (
          <div style={{ border: '1px solid #bae6fd', borderRadius: '12px', overflow: 'hidden', background: '#f0f9ff' }}>
            <div style={{ padding: '10px 16px', background: '#e0f2fe', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>Permission</span>
              {permissions.length > 1 && (
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', background: '#bae6fd', padding: '2px 8px', borderRadius: '10px' }}>{permissions.length} entries</span>
              )}
            </div>
            {permissions.map((p, idx) => {
              const fmtTime = (t: string): string => {
                if (!t) return '—';
                if (t.includes('T')) {
                  const normalized = t.replace(/Z$/, '');
                  const d = new Date(normalized);
                  if (isNaN(d.getTime())) return '—';
                  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                }
                const parts = t.split(':');
                const h = parseInt(parts[0] ?? '0', 10);
                const m = parseInt(parts[1] ?? '0', 10);
                if (isNaN(h) || isNaN(m)) return '—';
                return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
              };
              const deducted = p.effectiveMinutes > 0 ? p.effectiveMinutes : null;
              return (
                <div key={idx} style={{ borderBottom: idx < permissions.length - 1 ? '1px solid #e0f2fe' : 'none' }}>
                  <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '4px' }}>FROM</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>{fmtTime(p.startTime)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '4px' }}>TO</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7' }}>{fmtTime(p.endTime)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: '4px' }}>DEDUCTED</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: deducted ? '#0284c7' : '#9ca3af' }}>{deducted ? formatDuration(deducted) : '—'}</div>
                    </div>
                  </div>
                  <div style={{ padding: '6px 16px 10px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
                    <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 500 }}>
                      {deducted ? `${formatDuration(deducted)} deducted from your working hours` : 'Outside work window — not deducted'}
                    </span>
                  </div>
                  {p.reason && (
                    <div style={{ padding: '4px 16px 10px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{p.reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Insight Row */}
        {mainSession && (isEarly || isLate) && (
          <div
            className={styles.insightBar}
            style={{
              backgroundColor: isEarly ? '#f0fdf4' : '#fffbeb',
              borderColor: isEarly ? '#bbf7d0' : '#fef3c7',
              color: isEarly ? '#166534' : '#92400e',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEarly ? (
                <ArrowUpRight size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
              ) : (
                <ArrowDownRight size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
              )}
              <Text size={200} weight="semibold" style={{ color: 'inherit' }}>
                {isEarly
                  ? 'Good start! You checked in earlier today.'
                  : 'You arrived late today.'}
              </Text>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ABSENT CARD VIEW
  if (status === 'absent') {
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    return (
      <div className={styles.container}>
        {/* Hero Banner */}
        <div className={styles.heroAbsent}>
          <div className={styles.heroTextSection}>
            <Text className={styles.heroTitle} style={{ color: '#dc2626' }}>
              You were marked Absent 彡
            </Text>
            <Text className={styles.heroSubtitle}>
              No attendance activity was recorded for this day.
            </Text>
            <div className={styles.pill} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>
              <AlertCircle size={14} />
              <span>No Check-in / Check-out</span>
            </div>
          </div>
          <img src="/laptop_tired_guy.png" alt="Absent Illustration" className={styles.heroImageRight} />
        </div>

        {/* Absence Summary */}
        <div>
          <div className={styles.sectionHeader}>Absence Summary</div>
          <div className={styles.statGrid} style={{ marginTop: '8px' }}>
            <div className={styles.statBox}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#f1f5f9' }}>
                <Calendar size={18} style={{ color: '#475569' }} />
              </div>
              <div className={styles.statText}>
                <span className={styles.statLabel}>Date</span>
                <span className={styles.statValue}>{formattedDate}</span>
              </div>
            </div>

            <div className={styles.statBox}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#f1f5f9' }}>
                <Clock size={18} style={{ color: '#475569' }} />
              </div>
              <div className={styles.statText}>
                <span className={styles.statLabel}>Duration</span>
                <span className={styles.statValue}>Full Day</span>
              </div>
            </div>

            <div className={styles.statBox} style={{ gridColumn: 'span 2' }}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#fef2f2' }}>
                <AlertCircle size={18} style={{ color: '#dc2626' }} />
              </div>
              <div className={styles.statText}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue} style={{ color: '#dc2626' }}>Absent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Please Note */}
        <div>
          <div className={styles.sectionHeader}>Please Note</div>
          <div className={styles.noteBox} style={{ marginTop: '8px' }}>
            <div className={styles.noteTextSection}>
              <Bell size={20} style={{ color: '#dc2626', marginTop: '2px', flexShrink: 0 }} />
              <Text size={200} style={{ color: '#991b1b', lineHeight: '1.4' }}>
                If this was unintentional, please update your attendance or contact your manager/HR.
              </Text>
            </div>
            {onFixAttendance && (
              <button className={styles.fixBtn} onClick={onFixAttendance}>
                Fix My Attendance
              </button>
            )}
          </div>
        </div>

        {/* Motivation Quote */}
        <div className={styles.quoteBox} style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
          <Text className={styles.quoteText}>
            “ Every day is a chance to show up. Let's make tomorrow a great one! ”
          </Text>
        </div>
      </div>
    );
  }

  // 3. WEEKEND CARD VIEW
  if (status === 'weekend') {
    const totalHoursLabel = weekSummary
      ? `${Math.floor(weekSummary.totalMinutes / 60)}h ${(weekSummary.totalMinutes % 60)}m`
      : '0h 0m';

    return (
      <div className={styles.container}>
        {/* Hero Banner */}
        <div className={styles.heroWeekend}>
          <div className={styles.heroTextSection}>
            <Text className={styles.heroTitle} style={{ color: '#d97706' }}>
              It's the weekend! ✨
            </Text>
            <Text className={styles.heroSubtitle}>
              No attendance activity for this day. Enjoy your weekend and make the most of your time!
            </Text>
            <div className={styles.pill} style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d' }}>
              <Calendar size={14} />
              <span>No work scheduled</span>
            </div>
          </div>
          <img src="/coffee_guy.png" alt="Weekend Illustration" className={styles.heroImageRight} />
        </div>

        {/* Week Summary */}
        {weekSummary && (
          <div>
            <div className={styles.sectionHeader}>WEEK SUMMARY ({weekSummary.weekLabel})</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
              {/* Total Hours */}
              <div className={styles.ideaCard} style={{ backgroundColor: '#f8fafc' }}>
                <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', width: '32px', height: '32px' }}>
                  <Clock size={16} style={{ color: '#1d4ed8' }} />
                </div>
                <span className={styles.statValue} style={{ fontSize: '15px' }}>{totalHoursLabel}</span>
                <span className={styles.statLabel} style={{ fontSize: '10px', textAlign: 'center' }}>Total Hours worked</span>
              </div>

              {/* Days Worked */}
              <div className={styles.ideaCard} style={{ backgroundColor: '#f8fafc' }}>
                <div className={styles.statIconWrapper} style={{ backgroundColor: '#ecfdf5', width: '32px', height: '32px' }}>
                  <CheckCircle size={16} style={{ color: '#059669' }} />
                </div>
                <span className={styles.statValue} style={{ fontSize: '15px' }}>{weekSummary.daysWorked}</span>
                <span className={styles.statLabel} style={{ fontSize: '10px', textAlign: 'center' }}>Days worked</span>
              </div>

              {/* Days Off */}
              <div className={styles.ideaCard} style={{ backgroundColor: '#f8fafc' }}>
                <div className={styles.statIconWrapper} style={{ backgroundColor: '#f5f3ff', width: '32px', height: '32px' }}>
                  <Calendar size={16} style={{ color: '#7c3aed' }} />
                </div>
                <span className={styles.statValue} style={{ fontSize: '15px' }}>{weekSummary.daysOff}</span>
                <span className={styles.statLabel} style={{ fontSize: '10px', textAlign: 'center' }}>Days off</span>
              </div>
            </div>
          </div>
        )}

        {/* Weekend Ideas */}
        {/* <div>
          <div className={styles.sectionHeader}>Weekend Ideas</div>
          <div className={styles.ideasGrid} style={{ marginTop: '8px' }}>
            <div className={styles.ideaCard}>
              <span style={{ fontSize: '18px' }}>📚</span>
              <span className={styles.ideaText}>Read a book</span>
            </div>
            <div className={styles.ideaCard}>
              <span style={{ fontSize: '18px' }}>🚴</span>
              <span className={styles.ideaText}>Go for a ride</span>
            </div>
            <div className={styles.ideaCard}>
              <span style={{ fontSize: '18px' }}>🎵</span>
              <span className={styles.ideaText}>Listen to music</span>
            </div>
            <div className={styles.ideaCard}>
              <span style={{ fontSize: '18px' }}>❤️</span>
              <span className={styles.ideaText}>Time with family</span>
            </div>
          </div>
        </div> */}

        {/* Recharge Quote */}
        <div className={styles.quoteBox} style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
          <Heart size={18} style={{ color: '#d97706', flexShrink: 0 }} />
          <Text className={styles.quoteText} style={{ color: '#92400e' }}>
            Take time to relax, recharge, and come back stronger!
          </Text>
        </div>
      </div>
    );
  }

  // 4. LEAVE / HOLIDAY CARD VIEW
  if (status === 'approved_leave' || status === 'pending_leave' || status === 'holiday') {
    const isHoliday = status === 'holiday';
    const isApproved = status === 'approved_leave' || isHoliday;
    const themeColor = isHoliday ? '#0d9488' : '#7c3aed';
    const bgLight = isHoliday ? '#f0fdfa' : '#f5f3ff';
    const borderCol = isHoliday ? '#99f6e4' : '#e0e7ff';

    return (
      <div className={styles.container}>
        {/* Centered Illustration Hero */}
        <div className={styles.heroLeave} style={{ backgroundColor: bgLight, borderColor: borderCol }}>
          <img
            src={isHoliday ? '/coffee_guy.png' : '/sleepy_guy.png'}
            alt="Leave Illustration"
            className={styles.heroImageCenter}
          />
          <div className={styles.heroTextSection}>
            <Text className={styles.heroTitle} style={{ color: themeColor }}>
              {isHoliday ? 'It\'s a Holiday! 🎉' : 'It\'s your day off! 🌿'}
            </Text>
            <Text className={styles.heroSubtitle}>
              {isHoliday
                ? `Enjoy the ${holidayName || 'Public Holiday'} break!`
                : 'No attendance record found for this day. Enjoy your break and come back refreshed!'}
            </Text>
          </div>
        </div>

        {/* Leave / Holiday Details Table */}
        <div className={styles.leaveTable}>
          {isHoliday ? (
            <>
              <div className={styles.leaveRow}>
                <span className={styles.leaveCellLeft}><Calendar size={16} /> Holiday</span>
                <span className={styles.leaveCellRight} style={{ color: themeColor }}>{holidayName || 'Public Holiday'}</span>
              </div>
              <div className={styles.leaveRow}>
                <span className={styles.leaveCellLeft}><Shield size={16} /> Type</span>
                <span className={styles.leaveCellRight}>Gazetted Holiday</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.leaveRow}>
                <span className={styles.leaveCellLeft}><Calendar size={16} /> Leave Type</span>
                <span className={styles.leaveCellRight} style={{ color: themeColor }}>{leaveTypeName || 'Leave'}</span>
              </div>
              <div className={styles.leaveRow}>
                <span className={styles.leaveCellLeft}><Shield size={16} /> Status</span>
                <span
                  className={styles.leaveCellRight}
                  style={{ color: isApproved ? '#16a34a' : '#d97706' }}
                >
                  {leaveApprovalStatus || (status === 'approved_leave' ? 'Approved' : 'Pending')}
                </span>
              </div>
              {leaveAppliedOn && (
                <div className={styles.leaveRow}>
                  <span className={styles.leaveCellLeft}><Calendar size={16} /> Applied On</span>
                  <span className={styles.leaveCellRight}>
                    {new Date(leaveAppliedOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Motivational Quote */}
        <div className={styles.quoteBox} style={{ backgroundColor: bgLight, borderColor: borderCol, color: themeColor }}>
          <Text className={styles.quoteText}>
            {isHoliday
              ? '“ Holidays are opportunities to rest, reflect, and enjoy the moments. ”'
              : '“ Rest is part of productivity. — Take care! ”'}
          </Text>
        </div>
      </div>
    );
  }

  // 5. NO DATA CARD VIEW (day before attendance tracking began — nothing to show)
  if (status === 'nodata') {
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    return (
      <div className={styles.container}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '48px 20px',
            borderRadius: '16px',
            border: '1px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
            gap: '12px',
          }}
        >
          <Calendar size={36} style={{ color: '#94a3b8' }} />
          <Text weight="semibold" style={{ color: '#64748b' }}>
            No Record
          </Text>
          <Text size={200} style={{ color: '#94a3b8' }}>
            No attendance record is available for {formattedDate}.
          </Text>
        </div>
      </div>
    );
  }

  // 6. FUTURE CARD VIEW
  return (
    <div className={styles.container}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '48px 20px',
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          backgroundColor: '#f8fafc',
          gap: '12px',
        }}
      >
        <Calendar size={36} style={{ color: '#94a3b8' }} />
        <Text weight="semibold" style={{ color: '#64748b' }}>
          Upcoming Day
        </Text>
        <Text size={200} style={{ color: '#94a3b8' }}>
          No attendance activity can be recorded for this day yet.
        </Text>
      </div>
    </div>
  );
};

export default AttendanceDayCard;

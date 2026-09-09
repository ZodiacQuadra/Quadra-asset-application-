import React from "react";
import {
    makeStyles,
    tokens,
    Text,
    Badge,
    Button,
    Spinner,
    DataGrid,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridBody,
    DataGridRow,
    DataGridCell,
    TableColumnDefinition,
    createTableColumn,
} from "@fluentui/react-components";
import { ChevronLeftRegular, ChevronRightRegular } from "@fluentui/react-icons";
import { DepartmentAttendanceRecord } from "../../../Services/AttendanceService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GridRow {
    id: string;
    name: string;
    department: string;
    manager: string;
    checkIn: string | null;
    checkOut: string | null;
    attendanceDate: string | null;
    status: "Present" | "Checked Out" | "Absent";
    lateCheckIn: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatTime = (iso: string | null): string | null => {
    if (!iso) return null;
    try {
        const date = new Date(iso);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
        return null;
    }
};

export const formatDate = (value: string | null): string => {
    if (!value) return "—";
    const iso = value.replace(" ", "T");
    const date = new Date(iso);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

export const mapToGridRow = (r: DepartmentAttendanceRecord, idx: number): GridRow => {
    const checkedIn = !!r.checkIn;
    const checkedOut = !!r.checkOut;
    const status: GridRow["status"] = !checkedIn ? "Absent" : checkedOut ? "Checked Out" : "Present";
    return {
        id: `${r.name}_${idx}`,
        name: r.name ?? "—",
        department: r.department ?? "—",
        manager: r.managerName ?? "—",
        checkIn: formatTime(r.checkIn),
        checkOut: formatTime(r.checkOut),
        attendanceDate: formatDate(r.CreatedOn),
        status,
        lateCheckIn: r.violationType === "Late" || r.violationType === "Both",
    };
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    wrapper: {
        backgroundColor: tokens.colorNeutralBackground1,
        padding: "24px",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    headerCell: {
        fontWeight: "700",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: tokens.colorNeutralForeground3,
    },
    nameCell: {
        fontWeight: "600",
        color: tokens.colorNeutralForeground1,
    },
    timePresent: {
        color: "#059669",
        fontWeight: "600",
        fontSize: "13px",
    },
    timeAbsent: {
        color: tokens.colorNeutralForeground4,
        fontStyle: "italic",
        fontSize: "13px",
    },
    paginationWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
    },
    pagination: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    pageBtn: {
        minWidth: "32px",
        padding: "0 6px",
        height: "32px",
    },
    emptyState: {
        textAlign: "center",
        padding: "40px 0",
        color: tokens.colorNeutralForeground3,
    },
});

// ─── Column Definitions ───────────────────────────────────────────────────────

const columns: TableColumnDefinition<GridRow>[] = [
    createTableColumn<GridRow>({
        columnId: "name",
        renderHeaderCell: () => "Name",
        renderCell: (item) => item.name,
    }),
    createTableColumn<GridRow>({
        columnId: "department",
        renderHeaderCell: () => "Department",
        renderCell: (item) => item.department,
    }),
    createTableColumn<GridRow>({
        columnId: "manager",
        renderHeaderCell: () => "Manager",
        renderCell: (item) => item.manager,
    }),
    createTableColumn<GridRow>({
        columnId: "checkIn",
        renderHeaderCell: () => "Check In",
        renderCell: (item) => item.checkIn,
    }),

    createTableColumn<GridRow>({
        columnId: "checkOut",
        renderHeaderCell: () => "Check Out",
        renderCell: (item) => item.checkOut,
    }),
    createTableColumn<GridRow>({
        columnId: "recordedHours",
        renderHeaderCell: () => "Recorded Hours",
        renderCell: (item) => {
            const parseTime = (time: string): Date => {
                const [hours, minutes] = time.split(":").map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date;
            };

            const getWorkHours = (item: any): string => {
                if (!item.checkIn || !item.checkOut) return "N/A";

                const checkIn = parseTime(item.checkIn);
                const checkOut = parseTime(item.checkOut);

                const diffMs = checkOut.getTime() - checkIn.getTime();

                const hours = diffMs / (1000 * 60 * 60);

                return hours.toFixed(2);
            };

            return getWorkHours(item)
        }
    }),
    createTableColumn<GridRow>({
        columnId: "date",
        renderHeaderCell: () => "Date",
        renderCell: (item) => item.attendanceDate,
    }),
    createTableColumn<GridRow>({
        columnId: "status",
        renderHeaderCell: () => "Status",
        renderCell: (item) => item.status,
    }),
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttendanceDataGridProps {
    rows: GridRow[];
    loading: boolean;
    page: number;
    pageSize?: number;
    totalRecords: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
        pages.push(p);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AttendanceDataGrid: React.FC<AttendanceDataGridProps> = ({
    rows,
    loading,
    page,
    pageSize = 20,
    totalRecords,
    totalPages,
    onPageChange,
}) => {
    const styles = useStyles();
    const endRecord = page === totalPages ? totalRecords : page * pageSize;
    const startRecord = Math.max(1, endRecord - rows.length + 1);

    return (
        <div className={styles.wrapper}>
            <Text weight="semibold" size={500}>Attendance Records</Text>

            {/* ── Data Grid ── */}
            {loading ? (
                <div className={styles.emptyState}>
                    <Spinner label="Loading attendance data..." />
                </div>
            ) : rows.length === 0 ? (
                <div className={styles.emptyState}>
                    <Text>No attendance records found for the selected filters.</Text>
                </div>
            ) : (
                <DataGrid items={rows} columns={columns} getRowId={(item) => item.id} sortable>
                    <DataGridHeader>
                        <DataGridRow>
                            {({ renderHeaderCell }) => (
                                <DataGridHeaderCell>
                                    <span className={styles.headerCell}>{renderHeaderCell()}</span>
                                </DataGridHeaderCell>
                            )}
                        </DataGridRow>
                    </DataGridHeader>

                    <DataGridBody<GridRow>>
                        {({ item, rowId }) => (
                            <DataGridRow<GridRow> key={rowId}>
                                {({ renderCell, columnId }) => (
                                    <DataGridCell>
                                        {columnId === "name" ? (
                                            <span className={styles.nameCell}>{renderCell(item)}</span>
                                        ) : columnId === "checkIn" || columnId === "checkOut" ? (
                                            <span className={item[columnId as "checkIn" | "checkOut"] ? styles.timePresent : styles.timeAbsent}>
                                                {item[columnId as "checkIn" | "checkOut"] ?? "—"}
                                            </span>
                                        ) : columnId === "status" ? (
                                            <Badge
                                                appearance="tint"
                                                color={item.status === "Present" ? "success" : item.status === "Checked Out" ? "brand" : "danger"}
                                            >
                                                {item.status}
                                                {item.lateCheckIn && item.status !== "Absent" && (
                                                    <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>· Late</span>
                                                )}
                                            </Badge>
                                        ) : (
                                            renderCell(item)
                                        )}
                                    </DataGridCell>
                                )}
                            </DataGridRow>
                        )}
                    </DataGridBody>
                </DataGrid>
            )}

            {/* ── Pagination ── */}
            {!loading && rows.length > 0 && (
                <div className={styles.paginationWrapper}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Showing {startRecord}–{endRecord} of {totalRecords} records
                    </Text>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Button
                                appearance="subtle"
                                icon={<ChevronLeftRegular />}
                                disabled={page === 1}
                                onClick={() => onPageChange(page - 1)}
                            />
                            {getPageNumbers(page, totalPages).map((p, i) =>
                                p === "..." ? (
                                    <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: tokens.colorNeutralForeground3, lineHeight: "32px" }}>…</span>
                                ) : (
                                    <Button
                                        key={p}
                                        appearance={p === page ? "primary" : "subtle"}
                                        className={styles.pageBtn}
                                        onClick={() => onPageChange(p as number)}
                                    >
                                        {p}
                                    </Button>
                                )
                            )}
                            <Button
                                appearance="subtle"
                                icon={<ChevronRightRegular />}
                                disabled={page >= totalPages}
                                onClick={() => onPageChange(page + 1)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendanceDataGrid;

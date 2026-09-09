import React, { useRef, useState } from "react";
import {
    Dialog,
    DialogSurface,
    Spinner,
    Toast,
    ToastTitle,
    ToastBody,
    Toaster,
    useToastController,
    useId,
    makeStyles,
} from "@fluentui/react-components";
import {
    ArrowUpload20Regular,
    Document20Regular,
    Dismiss20Regular,
    DismissCircle20Regular,
} from "@fluentui/react-icons";
import * as XLSX from "xlsx";
import { bulkImportRegularization } from "../../Services/AdminAttendanceReportService";

interface PropTypes {
    open: boolean;
    handleClose: () => void;
}

const useStyles = makeStyles({
    surface: {
        borderRadius: "16px",
        padding: "0",
        width: "480px",
        maxWidth: "95vw",
        boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 24px 14px 24px",
        borderBottom: "1px solid #f0f0f0",
    },
    titleText: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#111827",
    },
    subText: {
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "2px",
    },
    body: {
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    row: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
    },
    fieldGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
    },
    label: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    },
    input: {
        padding: "9px 12px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "13px",
        color: "#111827",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
    },
    inputError: {
        border: "1.5px solid #ef4444 !important",
    },
    select: {
        padding: "9px 12px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "13px",
        color: "#111827",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
    },
    selectError: {
        border: "1.5px solid #ef4444 !important",
    },
    errorText: {
        fontSize: "11px",
        color: "#ef4444",
    },
    dropZone: {
        border: "2px dashed #d1d5db",
        borderRadius: "12px",
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        cursor: "pointer",
        background: "#f9fafb",
        transition: "border-color 0.2s, background 0.2s",
    },
    dropZoneActive: {
        border: "ipx solid #0078D4 !important",
        background: "#eff6ff !important",
    },
    dropZoneError: {
        border: "1px solid #ef4444 !important",
        background: "#fff5f5 !important",
    },
    dropText: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
    },
    dropHint: {
        fontSize: "11px",
        color: "#9ca3af",
    },
    filePreview: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        background: "#f0fdf4",
        border: "1.5px solid #bbf7d0",
        borderRadius: "10px",
    },
    fileName: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#166534",
        flex: "1",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    fileSize: {
        fontSize: "11px",
        color: "#6b7280",
        flexShrink: "0",
    },
    removeBtn: {
        cursor: "pointer",
        color: "#9ca3af",
        display: "flex",
        alignItems: "center",
        flexShrink: "0",
    },
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "10px",
        padding: "14px 24px 20px 24px",
        borderTop: "1px solid #f0f0f0",
    },
});

const RegularizeBulkUploadDialog = (props: PropTypes) => {
    const styles = useStyles();
    const toasterId = useId("bulk-upload-toast");
    const { dispatchToast } = useToastController(toasterId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = () => {
        setFile(null);
        setErrors({});
        setDragOver(false);
    };

    const handleClose = () => {
        if (loading) return;
        resetForm();
        props.handleClose();
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!file) newErrors.file = "Please upload an Excel file.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
            setErrors((prev) => ({ ...prev, file: "Only Excel files (.xlsx, .xls) are accepted." }));
            return;
        }
        setFile(selectedFile);
        setErrors((prev) => ({ ...prev, file: "" }));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) handleFileSelect(dropped);
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await bulkImportRegularization(file!);
            dispatchToast(
                <Toast>
                    <ToastTitle>Upload Successful</ToastTitle>
                    <ToastBody>Attendance records have been uploaded successfully.</ToastBody>
                </Toast>,
                { intent: "success", timeout: 4000 }
            );
            resetForm();
            props.handleClose();
        } catch (err: any) {
            const message =
                err?.response?.data?.message || err?.message || "Upload failed. Please try again.";
            dispatchToast(
                <Toast>
                    <ToastTitle>Upload Failed</ToastTitle>
                    <ToastBody>{message}</ToastBody>
                </Toast>,
                { intent: "error", timeout: 5000 }
            );
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const downloadSample = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Employee Email", "Dates", "Check In Time", "Check Out Time"],
            ["john@example.com", "06/01/2026, 08/01/2026", "09:30", "18:30"],
        ]);
        ws["!cols"] = [{ wch: 30 }, { wch: 30 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, "attendance_bulk_sample.xlsx");
    };

    return (
        <>
            <Toaster toasterId={toasterId} position="top-end" />
            <Dialog open={props.open} onOpenChange={handleClose}>
                <DialogSurface className={styles.surface}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {/* Header */}
                        <div className={styles.header}>
                            <div>
                                <div className={styles.titleText}>Bulk Upload Regularization Request</div>
                                <div className={styles.subText}>
                                    Upload an Excel file with regularization records.
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#6b7280",
                                    padding: "4px",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Dismiss20Regular />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className={styles.body}>
                            {/* Date row */}
                            {/* <div className={styles.row}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Start Date</label>
                                    <input
                                        type="date"
                                        className={`${styles.input} ${errors.startDate ? styles.inputError : ""}`}
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setErrors((prev) => ({ ...prev, startDate: "" }));
                                        }}
                                    />
                                    {errors.startDate && (
                                        <span className={styles.errorText}>{errors.startDate}</span>
                                    )}
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>End Date</label>
                                    <input
                                        type="date"
                                        className={`${styles.input} ${errors.endDate ? styles.inputError : ""}`}
                                        value={endDate}
                                        min={startDate || undefined}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setErrors((prev) => ({ ...prev, endDate: "" }));
                                        }}
                                    />
                                    {errors.endDate && (
                                        <span className={styles.errorText}>{errors.endDate}</span>
                                    )}
                                </div>
                            </div> */}

                            {/* Shift */}
                            {/* <div className={styles.fieldGroup}>
                                <label className={styles.label}>Shift</label>
                                <select
                                    className={`${styles.select} ${errors.shiftId ? styles.selectError : ""}`}
                                    value={shiftId}
                                    onChange={(e) => {
                                        setShiftId(e.target.value);
                                        setErrors((prev) => ({ ...prev, shiftId: "" }));
                                    }}
                                >
                                    <option value="">Select a shift...</option>
                                    {shifts
                                        .filter((s) => s.IsActive)
                                        .map((s) => (
                                            <option key={s.ID} value={String(s.ID)}>
                                                {s.ShiftName} ({String(new Date(s.StartTime).getUTCHours()).padStart(2,"0")+":"+String(new Date(s.StartTime).getUTCMinutes()).padStart(2,"0")} – {String(new Date(s.EndTime).getUTCHours()).padStart(2,"0")+":"+String(new Date(s.EndTime).getUTCMinutes()).padStart(2,"0")})
                                            </option>
                                        ))}
                                </select>
                                {errors.shiftId && (
                                    <span className={styles.errorText}>{errors.shiftId}</span>
                                )}
                            </div> */}

                            {/* File Upload */}
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Excel File</label>
                                {file ? (
                                    <div className={styles.filePreview}>
                                        <Document20Regular style={{ color: "#16a34a", flexShrink: 0 }} />
                                        <span className={styles.fileName}>{file.name}</span>
                                        <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                                        <span
                                            className={styles.removeBtn}
                                            onClick={() => setFile(null)}
                                        >
                                            <DismissCircle20Regular />
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        className={[
                                            styles.dropZone,
                                            dragOver ? styles.dropZoneActive : "",
                                            errors.file ? styles.dropZoneError : "",
                                        ].join(" ")}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                    >
                                        <ArrowUpload20Regular
                                            style={{ fontSize: "28px", color: dragOver ? "#0078D4" : "#9ca3af" }}
                                        />
                                        <span className={styles.dropText}>
                                            {dragOver ? "Drop file here" : "Click to browse or drag & drop"}
                                        </span>
                                        <span className={styles.dropHint}>Accepts .xlsx and .xls files only</span>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileSelect(f);
                                        e.target.value = "";
                                    }}
                                />
                                {errors.file && (
                                    <span className={styles.errorText}>{errors.file}</span>
                                )}
                                <button
                                    type="button"
                                    onClick={downloadSample}
                                    style={{
                                        alignSelf: "flex-start",
                                        background: "none",
                                        border: "none",
                                        color: "#0078D4",
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        padding: "0",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Download sample Excel
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <button
                                disabled={loading}
                                onClick={handleClose}
                                style={{
                                    background: "#f3f4f6",
                                    color: "#374151",
                                    fontWeight: 600,
                                    borderRadius: "8px",
                                    padding: "8px 18px",
                                    fontSize: "13px",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleSubmit}
                                style={{
                                    background: "#0078D4",
                                    color: "#fff",
                                    fontWeight: 600,
                                    borderRadius: "8px",
                                    padding: "8px 22px",
                                    fontSize: "13px",
                                    border: "none",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    opacity: loading ? 0.7 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    minWidth: "100px",
                                    justifyContent: "center",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="tiny" appearance="inverted" />
                                        Uploading...
                                    </>
                                ) : (
                                    "Upload"
                                )}
                            </button>
                        </div>
                    </div>
                </DialogSurface>
            </Dialog>
        </>
    );
};

export default RegularizeBulkUploadDialog;

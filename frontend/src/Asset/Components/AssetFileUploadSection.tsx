import { useId, useState } from "react";
import { Button, Text, Spinner } from "@fluentui/react-components";
import { ArrowUploadRegular, DismissRegular, DocumentRegular, EyeRegular, DeleteRegular } from "@fluentui/react-icons";
import { AssetFileRef } from "../Services/AssetInventoryService";

interface AssetFileUploadSectionProps {
  title: string;
  accept: string;
  // Already uploaded/persisted to blob (only ever non-empty once the asset exists).
  existingFiles: AssetFileRef[];
  // Selected locally but not uploaded yet — used before the asset is created,
  // when there's no ID yet to upload against.
  pendingFiles: File[];
  // Fires whenever the user picks new files. The parent decides what happens:
  // upload immediately (asset already exists) or just stage them (new asset).
  // May return a promise — awaited so the spinner reflects real upload time.
  onFilesSelected: (files: File[]) => Promise<void> | void;
  onRemovePending: (index: number) => void;
  onDeleteExisting: (relativePath: string) => Promise<void>;
}

const AssetFileUploadSection: React.FC<AssetFileUploadSectionProps> = ({
  title,
  accept,
  existingFiles,
  pendingFiles,
  onFilesSelected,
  onRemovePending,
  onDeleteExisting,
}) => {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!selected.length) return;
    setBusy(true);
    setError(null);
    try {
      await onFilesSelected(selected);
    } catch (err: any) {
      setError(err?.message || `Failed to upload ${title.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteExisting = async (relativePath: string) => {
    setDeletingPath(relativePath);
    setError(null);
    try {
      await onDeleteExisting(relativePath);
    } catch (err: any) {
      setError(err?.message || "Failed to delete file.");
    } finally {
      setDeletingPath(null);
    }
  };

  const hasFiles = existingFiles.length > 0 || pendingFiles.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text weight="semibold">{title}</Text>
        <Button
          size="small"
          icon={busy ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
          disabled={busy}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          Upload
        </Button>
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {!hasFiles ? (
        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
          No files added yet.
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {existingFiles.map((f) => (
            <div
              key={f.relativePath}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                border: "1px solid var(--colorNeutralStroke2)",
                borderRadius: "6px",
              }}
            >
              <DocumentRegular />
              <Text style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.fileName}
              </Text>
              <Button
                as="a"
                href={f.url}
                target="_blank"
                rel="noreferrer"
                appearance="subtle"
                size="small"
                icon={<EyeRegular />}
                aria-label={`View ${f.fileName}`}
                title="View"
              />
              <Button
                appearance="subtle"
                size="small"
                icon={deletingPath === f.relativePath ? <Spinner size="tiny" /> : <DeleteRegular />}
                disabled={deletingPath === f.relativePath}
                onClick={() => handleDeleteExisting(f.relativePath)}
                aria-label={`Delete ${f.fileName}`}
                title="Delete"
              />
            </div>
          ))}
          {pendingFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 10px",
                border: "1px dashed var(--colorNeutralStroke2)",
                borderRadius: "6px",
              }}
            >
              <DocumentRegular />
              <Text style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </Text>
              <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                pending
              </Text>
              <Button
                appearance="subtle"
                size="small"
                icon={<DismissRegular />}
                onClick={() => onRemovePending(index)}
                aria-label={`Remove ${file.name}`}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)" }}>
          {error}
        </Text>
      )}
    </div>
  );
};

export default AssetFileUploadSection;

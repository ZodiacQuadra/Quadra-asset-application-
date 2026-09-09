// Component/FileUpload.tsx
import React, { useRef, useState } from "react";
import {
  Button,
  Text,
  Caption1,
  Body1Strong,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  ArrowDownload24Regular,
  CloudAdd24Regular,
  DocumentPdf24Regular,
  Image24Regular,
  DocumentText24Regular,
  CloudArrowUp48Regular,
} from "@fluentui/react-icons";
import { FileAttachment } from "../../Services/Offboarding";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  attachments: FileAttachment[];
  onDelete: (blobPath: string) => void;
  onDownload: (blobPath: string, filename: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  attachments,
  onDelete,
  onDownload,
  disabled = false,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024,
  acceptedFileTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
  ],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    if (attachments.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid: [], errors };
    }

    files.forEach((file) => {
      if (file.size > maxFileSize) {
        errors.push(
          `${file.name} exceeds maximum size of ${(
            maxFileSize /
            1024 /
            1024
          ).toFixed(0)}MB`
        );
        return;
      }

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        errors.push(
          `${file.name
          } has unsupported file type. Allowed: ${acceptedFileTypes.join(", ")}`
        );
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join("; "));
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      setError(null);
      onFilesSelected(valid);
    }
  };

  // console.log("attachments", attachments);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
      return <Image24Regular className="text-blue-600 text-3xl" />;
    } else if (ext === "pdf") {
      return <DocumentPdf24Regular className="text-red-600 text-3xl" />;
    } else {
      return <DocumentText24Regular className="text-green-600 text-3xl" />;
    }
  };

  const hasFiles = attachments.length > 0;

  return (
    <div>
      {/* Category Header */}

      {/* Drop Zone */}

      <div
        className={`
            border-2 border-dashed bg-gray-100/50 rounded-lg p-2 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragging ? "bg-blue-50 border-blue-400" : "border-gray-300"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
            ${hasFiles ? "p-10 min-h-[80px]" : ""}
          `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(",")}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />

        {!hasFiles && !disabled && (
          <div className="flex flex-col items-center gap-1">
            <div className="h-20 w-20 flex items-center justify-center bg-blue-100 rounded-full mb-2">
              <CloudArrowUp48Regular className="text-blue-600 " />
            </div>
            <Body1Strong className="block mb-1 !text-lg">Upload files</Body1Strong>
            <Caption1 className="text-gray-600 !text-sm">
              Drag and drop or click to browse
            </Caption1>
            <Button size="large" className="!rounded-3xl !bg-blue-500 !text-white !border-0 !py-2 !px-3 !font-medium hover:!bg-blue-700">Choose Files</Button>
            <Caption1 className="text-gray-500 mt-1">
              Supports: {acceptedFileTypes.join(", ")} • Max {maxFiles} files •
              Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file
            </Caption1>
          </div>
        )}

        {!hasFiles && disabled && (
          <div className="text-center py-5">
            <Caption1 className="text-gray-500">No files uploaded</Caption1>
          </div>
        )}

        {hasFiles && !disabled && (
          <div className="w-full text-center mb-2">
            <CloudAdd24Regular className="inline-block text-blue-600 text-2xl" />
            <Caption1 className="text-gray-600 ml-2 inline-block">
              Click to add more files
            </Caption1>
          </div>
        )}

        {/* File List */}
        {hasFiles && (
          <div className="w-full flex flex-wrap gap-2 mt-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between min-w-[250px] max-w-[250px] 
                    p-3 bg-gray-50 rounded-lg border border-gray-200 
                    transition-all hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.filename)}
                  <div className="flex flex-col items-start justify-start flex-1 min-w-0">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 
                          truncate max-w-full block"
                      title={file.filename}
                    >
                      {file.filename.length > 25
                        ? file.filename.slice(0, 25) + "..."
                        : file.filename}
                    </a>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    appearance="subtle"
                    icon={<ArrowDownload24Regular />}
                    size="small"
                    onClick={() => onDownload(file.blobPath, file.filename)}
                    disabled={disabled}
                    title="Download file"
                    className="min-w-0"
                  />
                  {!disabled && (
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      size="small"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete ${file.filename}?`
                          )
                        ) {
                          onDelete(file.blobPath);
                        }
                      }}
                      title="Delete file"
                      className="min-w-0 hover:text-red-600"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-red-700">⚠️ {error}</Text>
        </div>
      )}
    </div>
  );
};

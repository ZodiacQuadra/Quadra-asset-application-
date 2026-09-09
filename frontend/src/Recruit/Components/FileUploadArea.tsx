import type React from "react";
import { useCallback, useState } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  makeStyles,
  tokens,
  shorthands,
  Badge,
  Caption1,
} from "@fluentui/react-components";
import {
  CloudAddRegular,
  DismissRegular,
  DocumentRegular,
} from "@fluentui/react-icons";

const FileUploadArea = ({
  onFilesSelected,
  selectedFiles,
  maxFiles = 10,
}: any) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: any) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: any) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const checkForDuplicates = (newFiles: any, existingFiles: any) => {
    const existingNames = existingFiles.map((f: any) => f.name.toLowerCase());
    return newFiles.filter(
      (file: any) => !existingNames.includes(file.name.toLowerCase())
    );
  };

  const handleDrop = useCallback(
    (e: any) => {
      e.preventDefault();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter(
        (file: any) =>
          file.type === "application/pdf" ||
          file.type === "application/msword" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );

      if (files.length === 0) {
        alert("Please upload only PDF, DOC, or DOCX files.");
        return;
      }

      const uniqueFiles = checkForDuplicates(files, selectedFiles);
      const duplicateCount = files.length - uniqueFiles.length;

      if (duplicateCount > 0) {
        alert(`${duplicateCount} duplicate file(s) were skipped.`);
      }

      if (selectedFiles.length + uniqueFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      if (uniqueFiles.length > 0) {
        onFilesSelected([...selectedFiles, ...uniqueFiles]);
      }
    },
    [selectedFiles, onFilesSelected, maxFiles]
  );

  const handleFileInput = useCallback(
    (e: any) => {
      const files = Array.from(e.target.files || []);
      const uniqueFiles = checkForDuplicates(files, selectedFiles);
      const duplicateCount = files.length - uniqueFiles.length;

      if (duplicateCount > 0) {
        alert(`${duplicateCount} duplicate file(s) were skipped.`);
      }

      if (selectedFiles.length + uniqueFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      if (uniqueFiles.length > 0) {
        onFilesSelected([...selectedFiles, ...uniqueFiles]);
      }

      e.target.value = "";
    },
    [selectedFiles, onFilesSelected, maxFiles]
  );

  const removeFile = (index: any) => {
    const newFiles = selectedFiles.filter((_: any, i: any) => i !== index);
    onFilesSelected(newFiles);
  };

  return (
    <div className="group">
      <Card className="overflow-hidden !rounded-xl bg-[#F9FAFB]" style={{ boxShadow: 'none' }}>
        <CardPreview>
          <div>
            <div  style={{ backgroundColor: '#F9FAFB', boxShadow: '0 0 2px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.14)' }}
              className={`
                relative rounded-xl p-4 text-center cursor-pointer 
                transition-all duration-300 ease-in-out min-h-[250px]
                flex flex-col items-center justify-center border-gray-300 gap-[15px]`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf"
                style={{ display: "none" }}
                onChange={handleFileInput}
              />

              <div className="h-[80px] w-[80px] p-[12px] bg-[#E0E7FF] rounded-full flex items-center justify-center">
                <CloudAddRegular className="text-5xl text-[#4F46E5]" />
                <div className="absolute inset-0 rounded-xl"></div>
              </div>

              <Text size={400} weight="semibold" className="text-gray-800">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag & drop resume files here"}
              </Text>

              <Caption1 className="text-gray-600">
                {/* Upload multiple resume files (PDF) - Max {maxFiles} files */}
                or click to browse from your computer
              </Caption1>
              <div className="flex flex-col items-center gap-[20px] mt-[12px]">
                <Button style={{ backgroundColor: 'transparent', color: '#484848', borderRadius: '30px', border: '1px solid #0256A8', padding: '10px 15px' }}>Choose Files</Button>
                <Caption1 className="text-gray-600">Supported formats: PDF, DOC, DOCX • Max {maxFiles} files • Max 5MB each</Caption1>
              </div>
            </div>



            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Text weight="semibold" className="text-gray-800">
                    Selected Files ({selectedFiles.length})
                  </Text>
                  <Badge style={{ color: '#16A34A', backgroundColor: 'transparent' }} size="large">
                    {selectedFiles.length} of {maxFiles} Processed
                  </Badge>
                </div>

                <div className="space-2 flex flex-wrap gap-2">
                  {selectedFiles.map((file: any, index: any) => (
                    <div
                      key={index}
                      className="flex items-center flex-row gap-3 p-2 w-[100%] bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DocumentRegular className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Text weight="semibold" className="text-gray-800">
                          {file.name}
                        </Text>
                        <div>
                          <Text size={200} className="text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Text>
                        </div>
                      </div>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<DismissRegular />}
                        onClick={() => removeFile(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};

export default FileUploadArea;

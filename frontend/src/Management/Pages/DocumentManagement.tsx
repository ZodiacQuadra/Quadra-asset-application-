import React, { useState, useEffect, useId } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Switch,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Body1,
  Spinner,
  Field,
  Card,
  Text,
  Badge,
  Subtitle2,
  Caption1,
  FluentProvider,
  Textarea,
  Checkbox,
  SearchBox,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add12Filled,
  Save20Regular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  DocumentRegular,
  TextDescriptionRegular,
  ImportantRegular,
  ShieldCheckmarkRegular,
  Document48Regular,
} from "@fluentui/react-icons";
import { nanoid } from "nanoid";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  Document as APIDocument,
  DocumentStatus,
  CreateDocumentData,
  UpdateDocumentData,
} from "../../Services/DocumentManagement";

interface Document
  extends Omit<APIDocument, "id" | "createdByUserId" | "modifiedByUserId"> {
  id: string;
  title: string;
  description: string;
  status: DocumentStatus | undefined;
  isRequired?: boolean;
  createdByUserId?: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
  isNew?: boolean;
}

interface DocumentError {
  title?: string;
}

interface SortConfig {
  key: keyof Document;
  direction: "asc" | "desc";
}

function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: DocumentError }>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(true);
  const { accessToken, currentUser }: any = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, [accessToken]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response: any = await getDocuments(
        { pageSize: 100, sortBy: "CreatedAt", sortDirection: "DESC" },
        accessToken
      );
      if (response.success && response.data) {
        const documentsWithTimestamps = response.data.documents.map(
          (doc: any) => ({
            ...doc,
            createdByUserID: doc.createdByUserId,
            modifiedByUserID: doc.modifiedByUserId,
            createdAt: doc.createdAt || new Date().toISOString(),
            modifiedAt: doc.modifiedAt || new Date().toISOString(),
            status: doc.status || ("Active" as DocumentStatus),
            isRequired: doc.isRequired || false,
          })
        );
        setDocuments(documentsWithTimestamps);
      } else {
        showToast("error", "Error fetching documents", response.message);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      showToast("error", "Error fetching documents", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = () => {
    const newDocument: Document = {
      id: nanoid(),
      title: "",
      description: "",
      isNew: true,
      isRequired: false,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      status: "Draft" as DocumentStatus,
    };
    setDocuments([...documents, newDocument]);
    setIsEditMode(true);
  };

  const showToast = (
    intent: "success" | "error" = "success",
    title: string,
    body?: string
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            intent === "success" ? (
              <CheckmarkCircle20Regular />
            ) : (
              <ErrorCircle20Regular />
            )
          }
        >
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, toastId, timeout: 5000 }
    );
  };

  const validateDocumentTitle = (id: string, title: string): boolean => {
    if (!title.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: { ...prevErrors[id], title: "Document name cannot be empty" },
      }));
      return false;
    }

    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (specialCharRegex.test(title)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: {
          ...prevErrors[id],
          title: "Special characters are not allowed in the document name",
        },
      }));
      return false;
    }

    const isDuplicate = documents.some(
      (document) =>
        document.id !== id &&
        document.title.toLowerCase() === title.toLowerCase()
    );

    if (isDuplicate) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: { ...prevErrors[id], title: "Document name already exists" },
      }));
      return false;
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (newErrors[id]) {
        delete newErrors[id].title;
        if (Object.keys(newErrors[id]).length === 0) {
          delete newErrors[id];
        }
      }
      return newErrors;
    });

    return true;
  };

  const validateAllDocuments = () => {
    let isValid = true;
    documents.forEach((document) => {
      if (!validateDocumentTitle(document.id, document.title)) {
        isValid = false;
      }
    });
    setIsFormValid(isValid);
    return isValid;
  };

  useEffect(() => {
    validateAllDocuments();
  }, [documents]);

  const handleInputChange = (
    id: string,
    field: keyof Document,
    value: string | boolean
  ) => {
    const updatedDocuments = documents.map((document) =>
      document.id === id
        ? { ...document, [field]: value, modifiedAt: new Date().toISOString() }
        : document
    );
    setDocuments(updatedDocuments);

    if (field === "title") {
      validateDocumentTitle(id, value as string);
    }
  };

  const saveAllDocuments = async () => {
    if (!validateAllDocuments()) {
      showToast(
        "error",
        "Validation Error",
        "Please fix the errors before saving."
      );
      return;
    }

    setIsSaving(true);
    let hasErrors = false;
    const documentsToSave = [...documents];

    for (const document of documentsToSave) {
      try {
        if (document.isNew) {
          const createData: CreateDocumentData = {
            title: document.title,
            description: document.description || "",
            status: "Active" as DocumentStatus,
            isRequired: document.isRequired || false,
            createdByUserId: currentUser?.userID || "",
          };
          const response = await createDocument(createData, accessToken);
          if (!response.success) throw new Error(response.message);
        } else {
          const updateData: UpdateDocumentData = {
            title: document.title,
            description: document.description || "",
            status: document.status || ("Active" as DocumentStatus),
            isRequired: document.isRequired || false,
            modifiedByUserId: currentUser?.userID || "",
          };
          const response = await updateDocument(
            document.id,
            updateData,
            accessToken
          );
          if (!response.success) throw new Error(response.message);
        }
      } catch (error) {
        showToast(
          "error",
          "Error",
          `Error saving document "${document.title}": ${error}`
        );
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      showToast("success", "Success", "All documents saved successfully.");
    }
    await fetchDocuments();
    setIsSaving(false);
    setIsEditMode(false);
  };

  const handleDeleteDocument = async (id: string) => {
    setDeletingId(id);
    const documentToDelete = documents.find((document) => document.id === id);

    if (documentToDelete?.isNew) {
      setDocuments((prevDocuments) =>
        prevDocuments.filter((document) => document.id !== id)
      );
      showToast("success", "Success", "New document removed successfully.");
    } else {
      try {
        const response = await deleteDocument(
          id,
          currentUser?.userID || "",
          accessToken
        );
        if (response.success) {
          await fetchDocuments();
          showToast("success", "Success", "Document deleted successfully.");
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        showToast("error", "Error", `Error deleting document: ${error}`);
      }
    }
    setDeletingId(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSort = (key: keyof Document) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const getSortedDocuments = () => {
    if (!sortConfig) return filteredDocuments;
    return [...filteredDocuments].sort((a, b) => {
      const aValue: any = a[sortConfig.key];
      const bValue: any = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredDocuments = documents.filter(
    (document) =>
      document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDocuments = getSortedDocuments();
  const getRequiredCount = () =>
    documents.filter((doc) => doc.isRequired).length;
  const getOptionalCount = () =>
    documents.filter((doc) => !doc.isRequired).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Documents...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Subtitle2 className="text-[#063762]">
                  Document Management
                </Subtitle2>
                <div className="flex items-center gap-2">
                  <Badge appearance="filled" color="danger" size="small">
                    Required: {getRequiredCount()}
                  </Badge>
                  <Badge appearance="filled" color="informative" size="small">
                    Optional: {getOptionalCount()}
                  </Badge>
                </div>
              </div>
              <div>
                {" "}
                <Caption1 className="text-gray-600">
                  Manage documents for your organization
                </Caption1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center gap-4 w-full md:w-1/4">
              <div className="relative w-full">
                <SearchBox
                  className={`w-full transition-all duration-200 ${
                    isTransitioning
                      ? "opacity-70 scale-[0.99]"
                      : "opacity-100 scale-100"
                  } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                  disabled={isLoading}
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(_, data) => handleSearchChange(data.value)}
                />
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none rounded" />
                )}
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEditMode}
                  onChange={toggleEditMode}
                  label={
                    <span className="text-sm font-medium">
                      {isEditMode ? "Edit Mode" : "View Mode"}
                    </span>
                  }
                />
              </div>
              <Button
                appearance="primary"
                onClick={addDocument}
                disabled={!isEditMode}
                shape="circular"
                icon={
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                    <Add12Filled />
                  </div>
                }
                className="hover:bg-indigo-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
              >
                Add Document
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4">
            {sortedDocuments.length > 0 ? (
              <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Table sortable className="w-full">
                    <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                      <TableRow className="border-b-2 border-gray-100">
                        <TableHeaderCell className="!py-3 !px-6 w-16">
                          <Body1Strong className="text-gray-900">#</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Name
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "title" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("description")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Description
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "description" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("isRequired")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Required
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "isRequired" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("modifiedAt")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Updated
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "modifiedAt" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell className="!py-3 !px-6 w-20">
                          <Body1Strong className="text-gray-900">
                            Actions
                          </Body1Strong>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDocuments.map(
                        (document: Document, index: number) => (
                          <TableRow
                            key={document.id}
                            className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            } ${document.isNew ? "bg-yellow-50/50" : ""}`}
                          >
                            <TableCell className="px-6 py-4">
                              <Badge
                                appearance="filled"
                                color={document.isNew ? "warning" : "brand"}
                                size="medium"
                                className={`font-semibold ${
                                  document.isNew
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {document.isNew ? "NEW" : index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {isEditMode ? (
                                <Field
                                  validationState={
                                    errors[document.id]?.title
                                      ? "error"
                                      : "none"
                                  }
                                  validationMessage={errors[document.id]?.title}
                                >
                                  <Textarea
                                    value={document.title}
                                    onChange={(e) =>
                                      handleInputChange(
                                        document.id,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                </Field>
                              ) : (
                                <Text className="text-gray-800 font-medium">
                                  {document.title || "No title"}
                                </Text>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {isEditMode ? (
                                <Textarea
                                  value={document.description}
                                  placeholder="Description"
                                  onChange={(e) =>
                                    handleInputChange(
                                      document.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                />
                              ) : (
                                <Body1>{document.description || "-"}</Body1>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {isEditMode ? (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={document.isRequired || false}
                                    onChange={(e, data) =>
                                      handleInputChange(
                                        document.id,
                                        "isRequired",
                                        !!data.checked
                                      )
                                    }
                                  />
                                  <Text size={200} className="text-gray-600">
                                    Required
                                  </Text>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {document.isRequired ? (
                                    <>
                                      <ShieldCheckmarkRegular className="w-4 h-4 text-red-600" />
                                      <Badge
                                        appearance="filled"
                                        color="danger"
                                        size="small"
                                      >
                                        Yes
                                      </Badge>
                                    </>
                                  ) : (
                                    <>
                                      <ImportantRegular className="w-4 h-4 text-gray-400" />
                                      <Badge
                                        appearance="outline"
                                        color="subtle"
                                        size="small"
                                      >
                                        No
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <CalendarRegular className="w-4 h-4 text-gray-400" />
                                <Text
                                  size={200}
                                  className="text-gray-700 font-medium"
                                >
                                  {formatDate(document.modifiedAt)}
                                </Text>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Button
                                onClick={() =>
                                  handleDeleteDocument(document.id)
                                }
                                icon={
                                  deletingId === document.id ? (
                                    <Spinner size="tiny" />
                                  ) : (
                                    <Delete20Regular />
                                  )
                                }
                                disabled={
                                  !isEditMode || deletingId === document.id
                                }
                                appearance="subtle"
                                className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                {sortedDocuments.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                    <div className="flex items-center justify-between">
                      <Caption1 className="text-gray-600 font-medium">
                        Showing {sortedDocuments.length} of {documents.length}{" "}
                        documents
                      </Caption1>
                      {isEditMode && (
                        <Button
                          icon={
                            isSaving ? (
                              <Spinner size="tiny" />
                            ) : (
                              <Save20Regular />
                            )
                          }
                          appearance="primary"
                          onClick={saveAllDocuments}
                          disabled={isSaving || !isFormValid}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? "Saving..." : "Save All"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <Document48Regular className="w-10 h-10 text-blue-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No documents found
                </Subtitle2>
                <div className="text-center">
                  <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any documents matching your criteria. Try adjusting your search."
                      : "Get started by creating your first document to manage your organization's documentation."}
                  </Text>
                </div>
                {searchTerm ? (
                  <Button
                    appearance="primary"
                    onClick={() => setSearchTerm("")}
                    className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    appearance="primary"
                    onClick={addDocument}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    icon={<Add12Filled />}
                  >
                    Add Your First Document
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FluentProvider>
  );
}

export default DocumentManagement;

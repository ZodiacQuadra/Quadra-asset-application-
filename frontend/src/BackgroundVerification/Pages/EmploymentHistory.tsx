import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  Card,
  Option,
  Subtitle2,
  Field,
  Input,
  Textarea,
  Dropdown,
  DialogActions,
  Button,
  DialogContent,
  FluentProvider,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import {
  Building24Regular,
  Calendar24Regular,
  Person24Regular,
  Organization24Regular,
} from "@fluentui/react-icons";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";

interface ExperienceData {
  id: string;
  companyName: string;
  position: string;
  headOfficeAddress: string;
  headOfficePhone: string;
  branchOfficeAddress: string;
  branchOfficePhone: string;
  employmentFrom: Date | undefined;
  employmentTo: Date | undefined;
  employeeCode: string;
  employmentNature: string;
  agencyDetails: string;
  responsibilities: string;
  lastCTC: string;
  reasonForLeaving: string;
  hrName: string;
  hrPosition: string;
  hrLandline: string;
  hrMobile: string;
  hrEmail: string;
  reportingAuthorityName: string;
  reportingAuthorityPosition: string;
  reportingAuthorityLandline: string;
  reportingAuthorityMobile: string;
  reportingAuthorityEmail: string;
  isNew: boolean;
}

interface Errors {
  [key: string]: string;
}

interface EmploymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (experience: ExperienceData) => void;
  experience?: ExperienceData | null;
}
const EmploymentHistoryDialog: React.FC<EmploymentHistoryDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  experience = null,
}) => {
  const [formData, setFormData] = useState<ExperienceData>({
    id: nanoid(),
    companyName: "",
    position: "",
    headOfficeAddress: "",
    headOfficePhone: "",
    branchOfficeAddress: "",
    branchOfficePhone: "",
    employmentFrom: undefined,
    employmentTo: undefined,
    employeeCode: "",
    employmentNature: "",
    agencyDetails: "",
    responsibilities: "",
    lastCTC: "",
    reasonForLeaving: "",
    hrName: "",
    hrPosition: "",
    hrLandline: "",
    hrMobile: "",
    hrEmail: "",
    reportingAuthorityName: "",
    reportingAuthorityPosition: "",
    reportingAuthorityLandline: "",
    reportingAuthorityMobile: "",
    reportingAuthorityEmail: "",
    isNew: true,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showErrors, setShowErrors] = useState<boolean>(false);

  useEffect(() => {
    if (experience) {
      setFormData(experience);
    } else {
      setFormData({
        id: nanoid(),
        companyName: "",
        position: "",
        headOfficeAddress: "",
        headOfficePhone: "",
        branchOfficeAddress: "",
        branchOfficePhone: "",
        employmentFrom: undefined,
        employmentTo: undefined,
        employeeCode: "",
        employmentNature: "",
        agencyDetails: "",
        responsibilities: "",
        lastCTC: "",
        reasonForLeaving: "",
        hrName: "",
        hrPosition: "",
        hrLandline: "",
        hrMobile: "",
        hrEmail: "",
        reportingAuthorityName: "",
        reportingAuthorityPosition: "",
        reportingAuthorityLandline: "",
        reportingAuthorityMobile: "",
        reportingAuthorityEmail: "",
        isNew: true,
      });
    }
  }, [experience, isOpen]);

  const clearError = (name: keyof ExperienceData) => {
    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
    clearError(name as keyof ExperienceData);
  };

  const handleDateChange = (
    date: Date | null | undefined,
    name: keyof ExperienceData
  ) => {
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: date || undefined,
    }));
    clearError(name);
  };

  const handleDropdownChange = (
    event: React.SyntheticEvent<HTMLElement>,
    data: { name?: string; optionValue?: string }
  ) => {
    const { name, optionValue } = data;
    if (name && optionValue) {
      setFormData((prevData: any) => ({
        ...prevData,
        [name]: optionValue,
      }));
      clearError(name as keyof ExperienceData);
    }
  };

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!formData.companyName)
      newErrors.companyName = "Company Name is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.headOfficeAddress)
      newErrors.headOfficeAddress = "Head Office Address is required";
    if (!formData.headOfficePhone)
      newErrors.headOfficePhone = "Head Office Phone is required";
    if (!formData.employmentFrom)
      newErrors.employmentFrom = "Employment From date is required";
    if (!formData.employmentTo)
      newErrors.employmentTo = "Employment To date is required";
    if (!formData.employmentNature)
      newErrors.employmentNature = "Employment Nature is required";
    if (!formData.lastCTC || isNaN(Number(formData.lastCTC)))
      newErrors.lastCTC = "Valid Last CTC is required";

    if (formData.employmentFrom && formData.employmentTo) {
      if (formData.employmentTo <= formData.employmentFrom) {
        newErrors.employmentTo =
          "Employment To date must be greater than Employment From date";
      }
    }

    if (formData.employmentNature === "Temporary" && !formData.agencyDetails) {
      newErrors.agencyDetails =
        "Agency details are required for temporary employment";
    }

    const emailFields = ["hrEmail", "reportingAuthorityEmail"];
    emailFields.forEach((field) => {
      if (
        formData[field as keyof ExperienceData] &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          formData[field as keyof ExperienceData] as string
        )
      ) {
        newErrors[field] = "Valid email address is required";
      }
    });

    const phoneFields = [
      "headOfficePhone",
      "branchOfficePhone",
      "hrLandline",
      "hrMobile",
      "reportingAuthorityLandline",
      "reportingAuthorityMobile",
    ];
    phoneFields.forEach((field) => {
      if (
        formData[field as keyof ExperienceData] &&
        !/^\d{10}$/.test(formData[field as keyof ExperienceData] as string)
      ) {
        newErrors[field] = "Valid 10-digit phone number is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setShowErrors(true);
    if (validate()) {
      onAdd(formData);
      handleCancel();
    }
  };

  const handleCancel = () => {
    setFormData({
      id: nanoid(),
      companyName: "",
      position: "",
      headOfficeAddress: "",
      headOfficePhone: "",
      branchOfficeAddress: "",
      branchOfficePhone: "",
      employmentFrom: undefined,
      employmentTo: undefined,
      employeeCode: "",
      employmentNature: "",
      agencyDetails: "",
      responsibilities: "",
      lastCTC: "",
      reasonForLeaving: "",
      hrName: "",
      hrPosition: "",
      hrLandline: "",
      hrMobile: "",
      hrEmail: "",
      reportingAuthorityName: "",
      reportingAuthorityPosition: "",
      reportingAuthorityLandline: "",
      reportingAuthorityMobile: "",
      reportingAuthorityEmail: "",
      isNew: true,
    });
    setErrors({});
    setShowErrors(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(event, data) => !data.open && onClose()}
      modalType="alert"
    >
      <DialogSurface className="!w-4xl">
        <DialogBody>
          {" "}
          <DialogTitle>Employment History Form</DialogTitle>
          <DialogContent>
            <div className="space-y-8">
              {/* Company Details Section */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3  pb-3 border-b border-gray-300">
                  <Building24Regular className="text-blue-600" />
                  <Subtitle2>Company Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field
                    label={<span>Company Name</span>}
                    required
                    validationState={errors.companyName ? "error" : undefined}
                    validationMessage={errors.companyName}
                  >
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter Company Name"
                    />
                  </Field>

                  <Field
                    label={<span>Position Held & Department</span>}
                    required
                    validationState={errors.position ? "error" : undefined}
                    validationMessage={errors.position}
                  >
                    <Input
                      name="position"
                      placeholder="Enter Designation"
                      value={formData.position}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <FluentProvider style={{ background: "transparent" }}>
                    {" "}
                    <Field
                      label={<span>Employment From</span>}
                      required
                      validationState={
                        errors.employmentFrom ? "error" : undefined
                      }
                      validationMessage={errors.employmentFrom}
                    >
                      <DatePicker
                        placeholder="Select From Date"
                        value={formData.employmentFrom}
                        onSelectDate={(date) =>
                          handleDateChange(date, "employmentFrom")
                        }
                      />
                    </Field>
                  </FluentProvider>

                  <FluentProvider style={{ background: "transparent" }}>
                    {" "}
                    <Field
                      label={<span>Employment To</span>}
                      required
                      validationState={
                        errors.employmentTo ? "error" : undefined
                      }
                      validationMessage={errors.employmentTo}
                    >
                      <DatePicker
                        placeholder="Select To Date"
                        value={formData.employmentTo}
                        onSelectDate={(date) =>
                          handleDateChange(date, "employmentTo")
                        }
                      />
                    </Field>
                  </FluentProvider>

                  <Field
                    label={<span>Head Office Address</span>}
                    required
                    validationState={
                      errors.headOfficeAddress ? "error" : undefined
                    }
                    validationMessage={errors.headOfficeAddress}
                    className="col-span-full"
                  >
                    <Input
                      name="headOfficeAddress"
                      placeholder="Enter Head Office Address"
                      value={formData.headOfficeAddress}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field
                    label={<span>Head Office Phone</span>}
                    required
                    validationState={
                      errors.headOfficePhone ? "error" : undefined
                    }
                    validationMessage={errors.headOfficePhone}
                  >
                    <Input
                      type="number"
                      name="headOfficePhone"
                      placeholder="Enter Phone Number"
                      value={formData.headOfficePhone}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field label="Branch Office Address">
                    <Input
                      name="branchOfficeAddress"
                      placeholder="Enter Branch Office Address"
                      value={formData.branchOfficeAddress}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field
                    label="Branch Office Phone"
                    validationState={
                      errors.branchOfficePhone ? "error" : undefined
                    }
                    validationMessage={errors.branchOfficePhone}
                  >
                    <Input
                      type="number"
                      name="branchOfficePhone"
                      placeholder="Enter Phone Number"
                      value={formData.branchOfficePhone}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field label="Responsibilities" className="col-span-full">
                    <Textarea
                      className="min-h-24 resize-y"
                      name="responsibilities"
                      placeholder="Enter your key responsibilities..."
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </Card>

              {/* Employment Details Section */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3  pb-3 border-b border-gray-300">
                  <Calendar24Regular className="text-blue-600" />
                  <Subtitle2>Employment Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FluentProvider style={{ background: "transparent" }}>
                    <Field
                      label={<span>Employment Nature</span>}
                      required
                      validationState={
                        errors.employmentNature ? "error" : undefined
                      }
                      validationMessage={errors.employmentNature}
                    >
                      <Dropdown
                        placeholder="Select Employment Nature"
                        value={formData.employmentNature}
                        onOptionSelect={(event, data) =>
                          handleDropdownChange(event, {
                            ...data,
                            name: "employmentNature",
                          })
                        }
                      >
                        <Option value="Temporary">Temporary</Option>
                        <Option value="Permanent">Permanent</Option>
                      </Dropdown>
                    </Field>
                  </FluentProvider>

                  <Field
                    label={
                      <span>
                        Agency Details
                        {formData.employmentNature === "Temporary" && (
                          <span className="text-red-600"> *</span>
                        )}
                      </span>
                    }
                    validationState={errors.agencyDetails ? "error" : undefined}
                    validationMessage={errors.agencyDetails}
                  >
                    <Input
                      name="agencyDetails"
                      placeholder="Enter Agency Details"
                      value={formData.agencyDetails}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field
                    label={<span>Last CTC Per Annum</span>}
                    required
                    validationState={errors.lastCTC ? "error" : undefined}
                    validationMessage={errors.lastCTC}
                  >
                    <Input
                      name="lastCTC"
                      value={formData.lastCTC}
                      placeholder="Enter CTC (in numbers)"
                      onChange={handleInputChange}
                      type="number"
                    />
                  </Field>

                  <Field label="Reason for Leaving">
                    <Input
                      name="reasonForLeaving"
                      placeholder="Enter Reason for Leaving"
                      value={formData.reasonForLeaving}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
              </Card>

              {/* HR Details Section */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3  pb-3 border-b border-gray-300">
                  <Person24Regular className="text-blue-600" />
                  <Subtitle2>Human Resource Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="HR Name">
                    <Input
                      name="hrName"
                      placeholder="Enter HR Name"
                      value={formData.hrName}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field label="HR Position">
                    <Input
                      name="hrPosition"
                      placeholder="Enter HR Position"
                      value={formData.hrPosition}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field
                    label="HR Landline"
                    validationState={errors.hrLandline ? "error" : undefined}
                    validationMessage={errors.hrLandline}
                  >
                    <Input
                      name="hrLandline"
                      placeholder="Enter Landline Number"
                      value={formData.hrLandline}
                      onChange={handleInputChange}
                      type="number"
                    />
                  </Field>

                  <Field
                    label="HR Mobile"
                    validationState={errors.hrMobile ? "error" : undefined}
                    validationMessage={errors.hrMobile}
                  >
                    <Input
                      name="hrMobile"
                      placeholder="Enter Mobile Number"
                      value={formData.hrMobile}
                      onChange={handleInputChange}
                      type="number"
                    />
                  </Field>

                  <Field
                    className="col-span-full"
                    label="HR Email"
                    validationState={errors.hrEmail ? "error" : undefined}
                    validationMessage={errors.hrEmail}
                  >
                    <Input
                      name="hrEmail"
                      placeholder="Enter HR Email"
                      value={formData.hrEmail}
                      onChange={handleInputChange}
                      type="email"
                    />
                  </Field>
                </div>
              </Card>

              {/* Reporting Authority Section */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3  pb-3 border-b border-gray-300">
                  <Organization24Regular className="text-blue-600" />
                  <Subtitle2>Reporting Authority Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Authority Name">
                    <Input
                      name="reportingAuthorityName"
                      placeholder="Enter Authority Name"
                      value={formData.reportingAuthorityName}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field label="Authority Position">
                    <Input
                      name="reportingAuthorityPosition"
                      placeholder="Enter Authority Position"
                      value={formData.reportingAuthorityPosition}
                      onChange={handleInputChange}
                    />
                  </Field>

                  <Field
                    label="Authority Landline"
                    validationState={
                      errors.reportingAuthorityLandline ? "error" : undefined
                    }
                    validationMessage={errors.reportingAuthorityLandline}
                  >
                    <Input
                      name="reportingAuthorityLandline"
                      placeholder="Enter Landline Number"
                      value={formData.reportingAuthorityLandline}
                      onChange={handleInputChange}
                      type="number"
                    />
                  </Field>

                  <Field
                    label="Authority Mobile"
                    validationState={
                      errors.reportingAuthorityMobile ? "error" : undefined
                    }
                    validationMessage={errors.reportingAuthorityMobile}
                  >
                    <Input
                      name="reportingAuthorityMobile"
                      placeholder="Enter Mobile Number"
                      value={formData.reportingAuthorityMobile}
                      onChange={handleInputChange}
                      type="number"
                    />
                  </Field>

                  <Field
                    className="col-span-full"
                    label="Authority Email"
                    validationState={
                      errors.reportingAuthorityEmail ? "error" : undefined
                    }
                    validationMessage={errors.reportingAuthorityEmail}
                  >
                    <Input
                      name="reportingAuthorityEmail"
                      placeholder="Enter Authority Email"
                      value={formData.reportingAuthorityEmail}
                      onChange={handleInputChange}
                      type="email"
                    />
                  </Field>
                </div>
              </Card>
            </div>
          </DialogContent>
        </DialogBody>

        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button appearance="primary" onClick={handleSubmit}>
            Add Employment History
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default EmploymentHistoryDialog;

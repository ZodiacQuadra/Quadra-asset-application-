import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  Button,
  Field,
  Textarea,
  Dropdown,
  Option,
  Card,
  Text,
  Rating,
  Body1Strong,
  CardPreview,
  FluentProvider,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  Input,
  Spinner,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import {
  submitInterviewFeedback,
  submitInterviewFeedbackNotification,
} from "../../Services/InterviewScheduling";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate } from "react-router-dom";  // for redirect on token expiry

 
interface FeedbackFormProps {
  interview?: any;
  onClose: () => void;
  onSubmit?: (feedbackData: any) => void;
  onGenerateShareLink:(data:any)=>void
  // When true, the job skills are still being fetched — show a loader in the
  // "Job-Specific Skills Assessment" area instead of hiding it.
  skillsLoading?: boolean;
}
 
interface ValidationErrors {
  overallRating?: string;
  technicalSkills?: string;
  communicationSkills?: string;
  problemSolving?: string;
  culturalFit?: string;
  recommendation?: string;
  strengths?: string;
  rejectionReason?: string;
  jobSkillsRating?: Record<string, string>;
  additionalComments?: string;
  recommendedSalary?:string
}
 
export default function FeedbackForm({
  interview,
  onClose,
  onSubmit,
  onGenerateShareLink,
  skillsLoading = false,
}: FeedbackFormProps) {
  const [feedback, setFeedback] = useState({
    overallRating: 0,
    technicalSkills: 0,
    communicationSkills: 0,
    problemSolving: 0,
    culturalFit: 0,
    recommendation: "",
    strengths: "",
    weaknesses: "",
    additionalComments: "",
    rejectionReason: "",
    jobSkillsRating: {} as Record<string, number>,
    recommendedSalary: "",
  });
 
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const navigate = useNavigate();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);


  useEffect(()=>{
    const checkSessionExpired = async () => {
      try {
        const val = await refreshToken();
        if (!val) {
          alert("Session expired. Please log in again.");
          localStorage.clear();
          sessionStorage.clear();
          navigate("/");
        }
      } catch (e) {
        console.warn("Error during session check", e);
        alert("An error occurred. Please log in again.");
        localStorage.clear();
        sessionStorage.clear();
        navigate("/");
      }
    }
    checkSessionExpired();
  },[])
 
  // Calculate overall rating automatically
  useEffect(() => {
    const calculateOverallRating = () => {
      const baseRatings = [
        feedback.technicalSkills,
        feedback.communicationSkills,
        feedback.problemSolving,
        feedback.culturalFit,
      ];
 
      // Get job skills ratings
      const jobSkillsRatings = Object.values(feedback.jobSkillsRating);
 
      // Combine all ratings
      const allRatings = [...baseRatings, ...jobSkillsRatings].filter(
        (rating) => rating > 0
      );
 
      if (allRatings.length === 0) {
        return 0;
      }
 
      // Calculate average
      const sum = allRatings.reduce((acc, rating) => acc + rating, 0);
      const average = sum / allRatings.length;
 
      // Round to nearest 0.5
      return Math.round(average * 2) / 2;
    };
 
    const calculatedRating = calculateOverallRating();
    setFeedback((prev) => ({
      ...prev,
      overallRating: calculatedRating,
    }));
  }, [
    feedback.technicalSkills,
    feedback.communicationSkills,
    feedback.problemSolving,
    feedback.culturalFit,
    feedback.jobSkillsRating,
  ]);
 
  // Get available recommendation options based on overall rating
  const getAvailableRecommendations = () => {
    if (feedback.overallRating < 3) {
      return ["Not Recommend", "Strongly Not Recommend"];
    }
    return [
      "Strongly Recommend",
      "Recommend",
      "Not Recommend",
      "Strongly Not Recommend",
    ];
  };
 
  // Clear recommendation if it becomes invalid
  useEffect(() => {
    const availableOptions = getAvailableRecommendations();
    if (
      feedback.recommendation &&
      !availableOptions.includes(feedback.recommendation)
    ) {
      setFeedback((prev) => ({
        ...prev,
        recommendation: "",
      }));
    }
  }, [feedback.overallRating]);
 
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
 
    // Validate ratings (must be > 0)
    if (!feedback.technicalSkills || feedback.technicalSkills === 0) {
      errors.technicalSkills = "Technical skills rating is required";
    }
    if (!feedback.communicationSkills || feedback.communicationSkills === 0) {
      errors.communicationSkills = "Communication skills rating is required";
    }
    if (!feedback.problemSolving || feedback.problemSolving === 0) {
      errors.problemSolving = "Problem solving rating is required";
    }
    if (!feedback.culturalFit || feedback.culturalFit === 0) {
      errors.culturalFit = "Cultural fit rating is required";
    }
 
    // Validate recommendation
    if (!feedback.recommendation.trim()) {
      errors.recommendation = "Recommendation is required";
    }
 
    // Validate strengths (minimum 200 characters)
    if ((feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") &&!feedback.strengths.trim()) {
      errors.strengths = "Strengths field is required";
    } else if ((feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && feedback.strengths.trim().length < 200) {
      errors.strengths = `Strengths must be at least 200 characters (currently ${
        feedback.strengths.trim().length
      })`;
    }
 
    // Validate rejection reason if not recommending hire (minimum 200 characters)
    if (
      (feedback.recommendation === "Not Recommend" ||
        feedback.recommendation === "Strongly Not Recommend") &&
      !feedback.rejectionReason.trim()
    ) {
      errors.rejectionReason =
        "Rejection reason is required when not recommending";
    } else if (
      (feedback.recommendation === "Not Recommend" ||
        feedback.recommendation === "Strongly Not Recommend") &&
      feedback.rejectionReason.trim().length < 200
    ) {
      errors.rejectionReason = `Rejection reason must be at least 200 characters (currently ${
        feedback.rejectionReason.trim().length
      })`;
    }
 
    // Validate additional comments if recommending hire
    if((feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && !feedback.additionalComments.trim()){
      errors.additionalComments = "Comments are required when recommending";
    }   
    
    // if((feedback.recommendation === "Recommend" ||
    //               feedback.recommendation === "Strongly Recommend") && !feedback.recommendedSalary.trim()){
    //   errors.recommendedSalary = "Recommended salary is required when recommending";
    // }

    if((feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && feedback.recommendedSalary && isNaN(parseInt(feedback.recommendedSalary.trim()))){
      errors.recommendedSalary = "Recommended salary must be a valid number";
    }

    // if((feedback.recommendation === "Recommend" ||
    //               feedback.recommendation === "Strongly Recommend") && parseInt(feedback.recommendedSalary.trim())<100000){
    //   errors.recommendedSalary = "Recommended salary must be at least 100,000";
    // }
 
    // Validate job skills ratings if they exist
    if (interview?.JobSkills && interview.JobSkills.length > 0) {
      const jobSkillsErrors: Record<string, string> = {};
      interview.JobSkills.forEach((skill: string) => {
        if (
          !feedback.jobSkillsRating[skill] ||
          feedback.jobSkillsRating[skill] === 0
        ) {
          jobSkillsErrors[skill] = `${skill} rating is required`;
        }
      });
      if (Object.keys(jobSkillsErrors).length > 0) {
        errors.jobSkillsRating = jobSkillsErrors;
      }
    }
 
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
 
  const handleJobSkillRating = (skill: string, rating: number) => {
    setFeedback((prev) => ({
      ...prev,
      jobSkillsRating: {
        ...prev.jobSkillsRating,
        [skill]: rating,
      },
    }));
 
    // Clear validation error for this skill
    if (validationErrors.jobSkillsRating?.[skill]) {
      setValidationErrors((prev: any) => ({
        ...prev,
        jobSkillsRating: {
          ...prev.jobSkillsRating,
          [skill]: undefined,
        },
      }));
    }
  };


 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
    if (!validateForm()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>
            Please fill in all required fields before submitting.
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
 
    setIsSubmitting(true);
 
    try {
      const apiPayload = {
        interviewId: interview?.ID,
        applicantId: interview?.ApplicantID,
        jobPostingId: interview?.JobPostingID,
        applicantPipelineId: interview?.ApplicantPipelineID,
        overallRating: feedback.overallRating,
        technicalSkills: feedback.technicalSkills,
        communicationSkills: feedback.communicationSkills,
        problemSolving: feedback.problemSolving,
        culturalFit: feedback.culturalFit,
        recommendation: feedback.recommendation,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        additionalComments: feedback.additionalComments,
        jobSkillsRating: feedback.jobSkillsRating,
        rejectionReason: feedback.rejectionReason,
        createdByUserId: currentUser.userID,
        recommendedSalary: feedback.recommendedSalary,
      };
 
      // console.log("Submitting feedback:", interview);
      // console.log("Submitting feedback:", apiPayload);
      await refreshToken().then(async (val: any) => {
        if (!val) {
          try {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            sessionStorage.clear();
          } catch (e) {
            console.warn("Failed to clear storage on token expiry", e);
          }
          navigate("/");
          return; 
        }
        
        const result = await submitInterviewFeedback(apiPayload, accessToken);
 
        if (result.success) {
          dispatchToast(
            <Toast>
              <ToastTitle>Success!</ToastTitle>
              <ToastBody>
                Interview feedback has been submitted successfully.
              </ToastBody>
            </Toast>,
            { intent: "success" }
          );
 
          if (onSubmit) {
            onSubmit({
              ...feedback,
              interviewId: interview?.ID,
              submittedAt: new Date().toISOString(),
              apiResponse: result.data,
            });
          } else {
            onClose();
          }


           await submitInterviewFeedbackNotification(
          interview,
          apiPayload,
          accessToken,
          currentUser
        );
        } else {
          throw new Error(result.error || "Failed to submit feedback");
        }
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);

      // if the error is related to authentication/token expiry, clear storage and redirect
      if (
        error instanceof Error &&
        /token|session|auth/i.test(error.message)
      ) {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn("Failed to clear storage on auth error", e);
        }
        navigate("/");
        return;
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>
            {error instanceof Error
              ? error.message
              : "Failed to submit feedback. Please try again."}
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
      
    }
  };
 
  const handleFieldChange = (fieldName: string, value: any) => {
    setFeedback((prev) => ({ ...prev, [fieldName]: value }));
 
    if (validationErrors[fieldName as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    }
  };
 
  const RatingField = ({
    value,
    onChange,
    label,
    fieldName,
    required = false,
    disabled = false,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
    fieldName: string;
    required?: boolean;
    disabled?: boolean;
  }) => (
    <Field
      label={label}
      required={required}
      validationState={
        validationErrors[fieldName as keyof ValidationErrors] ? "error" : "none"
      }
      validationMessage={
        validationErrors[fieldName as keyof ValidationErrors] || ""
      }
    >
      <Rating
        color="marigold"
        value={value}
        onChange={(_, data) => !disabled && onChange(data.value)}
      />
    </Field>
  );
 
  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "N/A" };
 
    try {
      const cleanDateString = dateString.replace("Z", "");
      const date = new Date(cleanDateString);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
 
      const istDate = new Date(year, month, day, hour, minute);
      const now = new Date();
      const isToday = istDate.toDateString() === now.toDateString();
      const isTomorrow =
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
        istDate.toDateString();
 
      let dateDisplay = istDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
 
      if (isToday) dateDisplay = "Today";
      else if (isTomorrow) dateDisplay = "Tomorrow";
 
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
 
      return {
        date: dateDisplay,
        time: `${displayHours}:${displayMinutes} ${ampm}`,
        isUpcoming: istDate > now,
        isPast: istDate < now,
      };
    } catch (error) {
      console.warn("Invalid date format:", dateString);
      return {
        date: "Invalid Date",
        time: "",
        isUpcoming: false,
        isPast: false,
      };
    }
  };
 
  const getSubmitButtonConfig = () => {
    switch (feedback.recommendation) {
      case "Strongly Recommend":
      case "Recommend":
        return {
          text: "Submit Feedback",
          appearance: "primary" as const,
        };
      case "Not Recommend":
      case "Strongly Not Recommend":
        return {
          text: "Submit Feedback",
          appearance: "secondary" as const,
        };
      default:
        return {
          text: "Submit Feedback",
          appearance: "primary" as const,
        };
    }
  };
 
  const submitButtonConfig = getSubmitButtonConfig();
  const availableRecommendations = getAvailableRecommendations();

  // console.log("Data",interview)
 
  return (
    <>
      <FluentProvider style={{ background: "transparent" }}>
        <Toaster toasterId={toasterId} />
      </FluentProvider>
 
      <Drawer open  position="end" className="!w-[75%]">
        <DrawerBody className="max-h-[96vh] overflow-y-auto">
            <DrawerHeader className="!flex !flex-row items-center justify-between px-0 py-[18px]">
              <div>
                <Text size={600} weight="semibold">
                  Interview Feedback
                </Text>
                <div>
                  <Text size={300} className="text-gray-600 mt-1 block">
                    {interview
                      ? `Provide feedback for ${interview.InterviewTitle}`
                      : "Provide interview feedback"}
                  </Text>
                </div>
              </div>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={onClose}
                className="ml-4"
              />
            </DrawerHeader>
 
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Interview Details */}
                {interview && (
                  <Card style={{ boxShadow: 'none' }} >
                    <CardPreview className="bg-[#F9FAFB]">
                      <div className="p-4 !grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Applicant:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {interview.ApplicantName}
                          </Text>
                        </div>
                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Email:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {interview.Email}
                          </Text>
                        </div>
                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Interview:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {interview.InterviewTitle}
                          </Text>
                        </div>
                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Date:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {formatDateTime(interview.ScheduledDateTime).date}{" "}
                            at{" "}
                            {formatDateTime(interview.ScheduledDateTime).time}
                          </Text>
                        </div>
                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Type:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {interview.InterviewType}
                          </Text>
                        </div>

                        <div className="flex flex-col justify-between">
                          <Text className="font-medium text-[#4B5563]">
                            Salary Range:
                          </Text>
                          <Text className="text-[#111827] font-semibold">
                            {interview.MinSalaryRange} - {interview.MaxSalaryRange} LPA
                          </Text>
                        </div>
                      </div>
                    </CardPreview>
                  </Card>
                )}
 
                {/* Rating Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RatingField
                    value={feedback.technicalSkills}
                    onChange={(value) =>
                      handleFieldChange("technicalSkills", value)
                    }
                    label="Technical Skills"
                    fieldName="technicalSkills"
                    required
                  />
 
                  <RatingField
                    value={feedback.communicationSkills}
                    onChange={(value) =>
                      handleFieldChange("communicationSkills", value)
                    }
                    label="Communication Skills"
                    fieldName="communicationSkills"
                    required
                  />
 
                  <RatingField
                    value={feedback.problemSolving}
                    onChange={(value) =>
                      handleFieldChange("problemSolving", value)
                    }
                    label="Problem Solving"
                    fieldName="problemSolving"
                    required
                  />
 
                  <RatingField
                    value={feedback.culturalFit}
                    onChange={(value) =>
                      handleFieldChange("culturalFit", value)
                    }
                    label="Cultural Fit"
                    fieldName="culturalFit"
                    required
                  />
                </div>
 
                {/* Job Skills Rating */}
                {skillsLoading && (
                  <div>
                    <Body1Strong className="mb-4">
                      Job-Specific Skills Assessment
                    </Body1Strong>
                    <div className="flex items-center gap-2 py-4">
                      <Spinner size="tiny" />
                      <Text>Loading job skills...</Text>
                    </div>
                  </div>
                )}
                {!skillsLoading &&
                  interview?.JobSkills &&
                  interview.JobSkills.length > 0 && (
                  <div>
                    <Body1Strong className="mb-4">
                      Job-Specific Skills Assessment
                    </Body1Strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {interview.JobSkills.map((skill: string) => (
                        <Field
                          key={skill}
                          label={skill}
                          required
                          validationState={
                            validationErrors.jobSkillsRating?.[skill]
                              ? "error"
                              : "none"
                          }
                          validationMessage={
                            validationErrors.jobSkillsRating?.[skill] || ""
                          }
                        >
                          <Rating
                            color="marigold"
                            value={feedback.jobSkillsRating[skill] || 0}
                            onChange={(_, data) =>
                              handleJobSkillRating(skill, data.value)
                            }
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                )}
 
                {/* Overall Rating - Auto-calculated and Disabled */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <RatingField
                    value={feedback.overallRating}
                    onChange={() => {}}
                    label="Overall Rating (Auto-calculated)"
                    fieldName="overallRating"
                    disabled={true}
                  />
                  <Text size={200} className="text-gray-600 mt-2 block">
                    Calculated as the average of all skill ratings
                  </Text>
                </div>


                {/* Recommendation Dropdown */}
                <Field
                  label="Recommendation"
                  required
                  validationState={
                    validationErrors.recommendation ? "error" : "none"
                  }
                  validationMessage={validationErrors.recommendation || ""}
                >
                  <FluentProvider style={{ background: "transparent" }}>
                    <Dropdown
                      placeholder="Select recommendation"
                      value={feedback.recommendation}
                      onOptionSelect={(_, data) => {
                        handleFieldChange(
                          "recommendation",
                          data.optionValue || ""
                        );

                        if (data.optionValue === "Not Recommend" || data.optionValue === "Strongly Not Recommend") {
                          handleFieldChange("rejectionReason", "");
                          handleFieldChange("strengths", "");
                        } 
                      }}
                      className="w-full"
                    >
                      {availableRecommendations.map((option) => (
                        <Option key={option} value={option}>
                          {option}
                        </Option>
                      ))}
                    </Dropdown>
                  </FluentProvider>
                  {feedback.overallRating < 3 && feedback.overallRating > 0 && (
                    <Text size={200} className="text-orange-600 mt-2 block">
                      ⚠️ Overall rating below 3.0 - only "Not Recommend" options
                      available
                    </Text>
                  )}
                </Field>

                
                  {(feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && (
                       <Field
                  label="Strengths / Weaknesses"
                  required
                  validationState={
                    validationErrors.strengths ? "error" : "none"
                  }
                  validationMessage={validationErrors.strengths || ""}
                  hint={`${
                    feedback.strengths.trim().length
                  }/200 characters minimum`}
                >
                  <Textarea
                    placeholder="What are the candidate's key strengths / weaknesses? (minimum 200 characters)"
                    value={feedback.strengths}
                    onChange={(e) =>
                      handleFieldChange("strengths", e.target.value)
                    }
                    rows={4}
                    resize="vertical"
                  />
                </Field>
                  )
                }
                
 
             
 {(feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && (
                <Field label="Areas for Improvement">
                  <Textarea
                    placeholder="What areas need improvement?"
                    value={feedback.weaknesses}
                    onChange={(e) =>
                      handleFieldChange("weaknesses", e.target.value)
                    }
                    rows={4}
                    resize="vertical"
                  />
                </Field>
                  )}
 
                
 
                {/* Rejection Reason */}
                {(feedback.recommendation === "Not Recommend" ||
                  feedback.recommendation === "Strongly Not Recommend") && (
                  <Field
                    label="Rejection Reason"
                    required
                    validationState={
                      validationErrors.rejectionReason ? "error" : "none"
                    }
                    validationMessage={validationErrors.rejectionReason || ""}
                    hint={`${
                      feedback.rejectionReason.trim().length
                    }/200 characters minimum`}
                  >
                    <Textarea
                      placeholder="Please provide a reason for not recommending this candidate... (minimum 200 characters)"
                      value={feedback.rejectionReason}
                      onChange={(e) =>
                        handleFieldChange("rejectionReason", e.target.value)
                      }
                      rows={4}
                      resize="vertical"
                    />
                  </Field>
                )}

                {
                  (feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && (
                    <Field 
                    validationState={validationErrors.recommendedSalary ? "error" : "none"} 
                    validationMessage={validationErrors.recommendedSalary} 
                    label="Recommended Salary"
                    hint={"Eg.500000"}
                    
                    >
                      <Input
                       
                       placeholder="Enter recommended salary"
                       value={feedback.recommendedSalary}
                       onChange={(e) => handleFieldChange("recommendedSalary", e.target.value)}
                      
                      />
                    </Field>
                  )
                }
 
                {/* Additional Comments */}
                {(feedback.recommendation === "Recommend" ||
                  feedback.recommendation === "Strongly Recommend") && (
                  <Field
                    label="Comments"
                    required
                     validationState={
                    validationErrors.additionalComments ? "error" : "none"
                  }
                    validationMessage={validationErrors.additionalComments || ""}
                    >
                    <Textarea
                      placeholder="Any additional observations or comments..."
                      value={feedback.additionalComments}
                      onChange={(e) =>
                        handleFieldChange("additionalComments", e.target.value)
                      }
                      required
                      rows={3}
                      resize="vertical"
                    />
                  </Field>
                )}
 
                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    appearance="secondary"
                    onClick={onClose}
                    type="button"
                    style={{borderRadius: '30px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance={submitButtonConfig.appearance}
                    type="submit"
                    disabled={isSubmitting}
                    style={{ background: 'linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)', padding: '12px 18px', borderRadius: '30px', color: '#fff' }}
                  >
                    {isSubmitting ? "Submitting..." : submitButtonConfig.text}
                  </Button>
                </div>
              </form>
            </DrawerBody>
        </Drawer>
    </>
  );
}
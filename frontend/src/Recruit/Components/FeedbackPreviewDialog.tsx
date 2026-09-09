import React, { useState, useEffect } from "react";
import {
  Button,
  Text,
  Badge,
  Card,
  Spinner,
  Field,
  Rating,
  Body1Strong,
} from "@fluentui/react-components";

import { getInterviewFeedback } from "../../Services/InterviewScheduling";
import { useAuth } from "../../Auth/AuthProvider";
import { getUserByID } from "../../Services/GraphAPI";

// TypeScript interfaces
interface Interview {
  ID: string;
  ApplicantName: string;
  ApplicantEmail: string;
  JobRole: string;
  ScheduledDateTime: string;
  Duration: number;
  InterviewTitle?: string;
  Email?: string;
  InterviewType?: string;
}

// Feedback Preview Content Component for Drawer
interface FeedbackItem {
  id: string;
  feedbackSequence: number;
  interviewId: string;
  overallRating: number;
  technicalSkills: number;
  communicationSkills: number;
  problemSolving: number;
  culturalFit: number;
  recommendation: string;
  strengths: string;
  weaknesses: string;
  additionalComments: string;
  rejectedReason?: string;
  createdAt: string;
}

interface JobSkill {
  id: string;
  jobSkillId: string;
  rating: number;
  comments: string;
}

interface FeedbackData {
  feedback: FeedbackItem[];
  jobSkills: JobSkill[];
}

interface FeedbackPreviewContentProps {
  interview: Interview;
}

const FeedbackPreviewContent: React.FC<FeedbackPreviewContentProps> = ({
  interview,
}) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken }: any = useAuth();

  const [interviewer, setInterviewer] = useState();

  // API call to fetch feedback data
  const fetchFeedbackData = async (interviewId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getInterviewFeedback(interviewId, accessToken);
      const interviewerDetail = await getUserByID(result?.data?.feedback[0]?.createdByUserId, accessToken);
      // console.log('result and interview data ', result?.data?.feedback[0]?.createdByUserId, interviewerDetail, '---', result); 
      setInterviewer(interviewerDetail.displayName);     

      if (result.success && result.data) {
        setFeedbackData(result.data);
      } else {
        setError(result.error || "Failed to load feedback data");
      }
    } catch (err) {
      setError("Failed to load feedback data");
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (interview?.ID) {
      fetchFeedbackData(interview.ID);
      // console.log('Interview data items are: ', interview);      
    }
  }, [interview?.ID]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "N/A" };

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow =
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
        date.toDateString();

      let dateDisplay = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (isToday) dateDisplay = "Today";
      else if (isTomorrow) dateDisplay = "Tomorrow";

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");

      return {
        date: dateDisplay,
        time: `${displayHours}:${displayMinutes} ${ampm}`,
        isUpcoming: date > now,
        isPast: date < now,
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

  const getRecommendationColor = (
    recommendation: string
  ): "success" | "danger" | "warning" | "brand" => {
    if (!recommendation) return "brand";

    const rec = recommendation.toLowerCase();
    if (rec.includes("strongly recommend") && !rec.includes("not")) {
      return "success";
    } else if (rec === "recommend") {
      return "success";
    } else if (rec.includes("strongly not recommend")) {
      return "danger";
    } else if (rec.includes("not recommend")) {
      return "danger";
    }
    return "brand";
  };

  const RatingDisplay = ({
    label,
    value,
    maxValue = 5,
    isOverall = false,
  }: {
    label: string;
    value: number;
    maxValue?: number;
    isOverall?: boolean;
  }) => (
    <Field  label={label}>
      <div
        className={
          isOverall ? "bg-blue-50 p-3 rounded-lg border border-blue-200" : ""
        }
      >
        <Rating   color="marigold" value={value || 0} max={maxValue} />
        {isOverall && (
          <Text size={200} className="text-gray-600 mt-2 block">
            Auto-calculated from all skill ratings
          </Text>
        )}
      </div>
    </Field>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading feedback...</Body1Strong>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Text size={400} className="text-red-600">
          {error}
        </Text>
        <Button
          onClick={() => fetchFeedbackData(interview.ID)}
          appearance="outline"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[15px]">
      {/* Feedback Metadata */}
      {feedbackData &&
        feedbackData.feedback &&
        feedbackData.feedback.length > 0 &&
        feedbackData.feedback.map((feedback) => (
          <div className="text-sm text-gray-500" key={feedback.id}>
            <Text>
              Feedback submitted on {formatDateTime(feedback.createdAt).date} at{" "}
              {formatDateTime(feedback.createdAt).time}
            </Text>
          </div>
        ))}

      {/* Interview Details */}
      <Card className="!bg-[#F9FAFB] !rounded-[10px]">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Applicant:</Text>
            <Text className="text-gray-900">{interview.ApplicantName}</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Email:</Text>
            <Text className="text-gray-900">
              {interview.ApplicantEmail || interview.Email}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Job Role:</Text>
            <Text className="text-gray-900">{interview.JobRole}</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Date:</Text>
            <Text className="text-gray-900">
              {formatDateTime(interview.ScheduledDateTime).date} at{" "}
              {formatDateTime(interview.ScheduledDateTime).time}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Duration:</Text>
            <Text className="text-gray-900">{interview.Duration} minutes</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Interviewer Name</Text>
            <Text className="text-gray-900">{interviewer}</Text>
          </div>
        </div>
      </Card>

      {/* Feedback Details */}
      {feedbackData &&
      feedbackData.feedback &&
      feedbackData.feedback.length > 0 ? (
        feedbackData.feedback.map((feedback, index) => (
          <div key={feedback.id || index} className="space-y-6">
            {/* Recommendation Badge */}
            <div className="flex items-center justify-between">
              <Text size={500} weight="semibold">
                Feedback Details
              </Text>
              <Badge
                appearance="filled"
                color={getRecommendationColor(feedback.recommendation)}
              >
                {feedback.recommendation || "No Recommendation"}
              </Badge>
            </div>

            {/* Ratings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RatingDisplay
                label="Technical Skills"
                value={feedback.technicalSkills}
              />
              <RatingDisplay
                label="Communication Skills"
                value={feedback.communicationSkills}
              />
              <RatingDisplay
                label="Problem Solving"
                value={feedback.problemSolving}
              />
              <RatingDisplay
                label="Cultural Fit"
                value={feedback.culturalFit}
              />
            </div>

            {/* Job Skills Assessment */}
            {feedbackData.jobSkills && feedbackData.jobSkills.length > 0 && (
              <div>
                <Body1Strong className="mb-4">
                  Job-Specific Skills Assessment
                </Body1Strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbackData.jobSkills.map((skill, skillIndex) => (
                    <Field
                      key={skill.id || skillIndex}
                      label={skill.jobSkillId || `Skill ${skillIndex + 1}`}
                    >
                      <Rating
                        color="marigold"
                        value={skill.rating || 0}
                        max={5}
                      />
                      {skill.comments && (
                        <Text size={200} className="text-gray-600 mt-1">
                          {skill.comments}
                        </Text>
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Rating - After all skill ratings */}
            <div className="col-span-full">
              <RatingDisplay
                label="Overall Rating"
                value={feedback.overallRating}
                isOverall={true}
              />
            </div>

            {/* Rejection Reason
            {(feedback.recommendation === "Not Recommend" ||
              feedback.recommendation === "Strongly Not Recommend") &&
              feedback.rejectedReason && (
                <Field
                  style={{ gap: "5px" }}
                  label={
                    <p style={{ fontSize: "medium", fontWeight: "600" }}>
                      Rejection Reason
                    </p>
                  }
                >
                  <div className="w-[100%] flex flex-wrap justify-center items-center py-3 bg-[#F9FAFB] rounded-md shadow-sm">
                    {feedback?.rejectedReason ? (
                      <div className="space-y-1 w-[96%]">
                        {feedback.rejectedReason
                          .split(/(?=\d+\.)/)
                          .map((line, index) => (
                            <p key={index} className="text-[#4B5563] text-sm">
                              {line.trim()}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[#4B5563] text-sm">-</p>
                    )}
                  </div>
                </Field>
              )} */}

            {/* Text Feedback */}
            {
              (feedback.recommendation === "Recommend" ||
              feedback.recommendation === "Strongly Recommend") &&
                
              <div className="flex flex-col gap-3">
              <Field
                style={{ gap: "5px" }}
                label={
                  <p style={{ fontSize: "medium", fontWeight: "600" }}>
                    Strengths
                  </p>
                }
              >
                <div className="w-[100%] flex justify-center items-center py-3 bg-[#F9FAFB] rounded-md shadow-sm">
                  {feedback?.strengths ? (
                    <div className="space-y-1 w-[96%]">
                      {feedback.strengths
                        .split(/(?=\d+\.)/)
                        .map((line, index) => (
                          <p key={index} className="text-[#4B5563] text-xs">
                            {line.trim()}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[#4B5563] text-sm">-</p>
                  )}
                </div>
              </Field>

              <Field
                style={{ gap: "5px" }}
                label={
                  <p style={{ fontSize: "medium", fontWeight: "600" }}>
                    Areas for Improvement
                  </p>
                }
              >
                <div className="w-[100%] flex justify-center items-center py-3 bg-[#F9FAFB] rounded-md shadow-sm">
                  {feedback?.weaknesses ? (
                    <div className="space-y-1 w-[96%]">
                      {feedback.weaknesses
                        .split(/(?=\d+\.)/)
                        .map((line, index) => (
                          <p key={index} className="text-[#4B5563] text-xs">
                            {line.trim()}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[#4B5563] text-sm">-</p>
                  )}
                </div>
              </Field>
            </div>
            }

           
           
            

            {/* Additional Comments - Only show for Recommend/Strongly Recommend */}
            {(feedback.recommendation === "Recommend" ||
              feedback.recommendation === "Strongly Recommend") &&
              feedback.additionalComments && (
                <Field
                  style={{ gap: "5px" }}
                  label={
                    <p style={{ fontSize: "medium", fontWeight: "600" }}>
                      Additional Comments
                    </p>
                  }
                >
                  <div className="w-[100%] flex justify-center items-center py-3 bg-[#F9FAFB] rounded-md shadow-sm">
                    {feedback?.additionalComments ? (
                      <div className="space-y-1 w-[96%]">
                        {feedback.additionalComments
                          .split(/(?=\d+\.)/)
                          .map((line, index) => (
                            <p key={index} className="text-[#4B5563] text-xs">
                              {line.trim()}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[#4B5563] text-sm">-</p>
                    )}
                  </div>
                </Field>
              )}


              {/* Reject reason - Only show for Not Recommend/Strongly Not Recommend */}
            {(feedback.recommendation === "Not Recommend" ||
              feedback.recommendation === "Strongly Not Recommend") &&
              feedback.rejectedReason && (
                <Field
                  style={{ gap: "5px" }}
                  label={
                    <p style={{ fontSize: "medium", fontWeight: "600" }}>
                      Rejection Reason
                    </p>
                  }
                >
                  <div className="w-[100%] flex justify-center items-center py-3 bg-[#F9FAFB] rounded-md shadow-sm">
                    {feedback?.rejectedReason ? (
                      <div className="space-y-1 w-[96%]">
                        {feedback.rejectedReason
                          .split(/(?=\d+\.)/)
                          .map((line, index) => (
                            <p key={index} className="text-[#4B5563] text-xs">
                              {line.trim()}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[#4B5563] text-sm">-</p>
                    )}
                  </div>
                </Field>
              )}
          </div>
        ))
      ) : (
        <Card>
          <div className="text-center py-8">
            <Text size={300} className="text-gray-600">
              No feedback available for this interview.
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FeedbackPreviewContent;

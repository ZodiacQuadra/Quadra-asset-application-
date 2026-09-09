import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Spinner,
  Body1Strong,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  Body1,
  Body2,
  Caption1,
  Caption1Strong,
  Subtitle2Stronger,
  Subtitle2,
  Divider,
  tokens,
  ProgressBar,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  DocumentBulletList20Regular,
  Checkmark20Regular,
  Warning20Regular,
  Dismiss20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";

interface TranscriptAnalysisProps {
  transcriptUrl: string;
  jobPostingId: string;
  applicantId: string;
  interviewType: string;
  interviewTitle: string;
  interviewId: string; // Add this
  recordingId: string; // Add this
}

interface QuestionAnalysis {
  question: string;
  isRelevant: boolean;
  relevantTo: string[];
  reason: string;
  betterAlternative?: string;
}

interface AnalysisData {
  overallScore: number;
  relevanceMetrics: {
    jobDescriptionRelevance: number;
    resumeRelevance: number;
    skillsRelevance: number;
    irrelevantQuestions: number;
  };
  questionAnalysis: QuestionAnalysis[];
  coverageAssessment: {
    coveredSkills: string[];
    missedSkills: string[];
    coveredExperiences: string[];
    missedExperiences: string[];
  };
  interviewerPerformance: {
    questionQuality: string;
    probingDepth: string;
    biasDetected: boolean;
    candidateSpaceProvided: string;
  };
  candidatePerformance: {
    responseQuality: string;
    alignment: string;
    technicalDepth: string;
    communication: string;
  };
  redFlags: string[];
  recommendations: string[];
  complianceCheck: {
    discriminatoryQuestions: boolean;
    professionalStandards: boolean;
    concerns: string[];
  };
  summary: {
    effectiveness: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  };
  _metadata?: {
    analysisType?: string;
    reason?: string;
    message?: string;
    originalTranscriptLength?: number;
    analyzedTranscriptLength?: number;
    wasTruncated?: boolean;
  };
}

const TranscriptAnalysisDialog: React.FC<TranscriptAnalysisProps> = ({
  transcriptUrl,
  jobPostingId,
  applicantId,
  interviewType,
  interviewTitle,
  interviewId, // Add this
  recordingId,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const { accessToken, refreshToken } = useAuth();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const analyzeTranscript = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/transcript/analyze-interview-transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            transcriptUrl,
            jobPostingId,
            applicantId,
            interviewType,
            interviewId, // Send this
            recordingId, // Send this
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data.analysis);
        // Auto-expand key sections
        setExpandedSections({
          quality: true,
          relevance: true,
          coverage: true,
          performance: true,
          questions: false,
          compliance: true,
          summary: true,
        });
      } else {
        setError(result.error || "Failed to analyze transcript");
      }
    } catch (err) {
      setError("An error occurred while analyzing the transcript");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async () => {
    await refreshToken().then(async (result: any) => {
      setOpen(true);
      if (!analysis && !loading) {
        analyzeTranscript();
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return tokens.colorPaletteGreenForeground1;
    if (score >= 60) return tokens.colorPaletteYellowForeground2;
    return tokens.colorPaletteRedForeground1;
  };

  const getSeverityBadge = (severity: string) => {
    const colorMap: Record<string, any> = {
      High: "danger",
      Medium: "warning",
      Low: "informative",
    };
    return (
      <Badge appearance="filled" color={colorMap[severity] || "subtle"}>
        {severity}
      </Badge>
    );
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation === "Proceed") return "success";
    if (recommendation === "Proceed with Caution") return "warning";
    return "danger";
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="outline"
          icon={<DocumentBulletList20Regular />}
          onClick={handleOpenDialog}
        >
          View Analysis
        </Button>
      </DialogTrigger>
      <DialogSurface style={{ maxWidth: "900px", width: "90vw" }}>
        <DialogBody>
          <DialogTitle>
            <Subtitle2>Interview Transcript Analysis</Subtitle2>
            <div>
              <Caption1>{interviewTitle}</Caption1>
            </div>
          </DialogTitle>
          <DialogContent style={{ overflowY: "auto", maxHeight: "70vh" }}>
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">
                  Analyzing transcript with AI...
                </Body1Strong>
                <Caption1>This may take a moment</Caption1>
              </div>
            )}

            {error && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <Body1>{error}</Body1>
                </MessageBarBody>
              </MessageBar>
            )}

            {analysis && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Metadata warnings if any */}
                {/* {analysis._metadata?.wasTruncated && (
                  <MessageBar intent="warning">
                    <MessageBarBody>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Warning20Regular />
                        <span>
                          Transcript was truncated for analysis due to length
                          constraints
                        </span>
                      </div>
                    </MessageBarBody>
                  </MessageBar>
                )} */}

                {/* 1. Overall Interview Quality */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("quality")}
                      >
                        <Subtitle2Stronger>
                          Overall Interview Quality
                        </Subtitle2Stronger>

                        {expandedSections["quality"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["quality"] && (
                    <CardPreview>
                      <div style={{ padding: "0 16px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "36px",
                              fontWeight: "bold",
                              color: getScoreColor(analysis.overallScore),
                            }}
                          >
                            {analysis.overallScore}/100
                          </div>
                          <div style={{ flex: 1 }}>
                            <ProgressBar
                              value={analysis.overallScore}
                              max={100}
                              color={
                                analysis.overallScore >= 80
                                  ? "success"
                                  : analysis.overallScore >= 60
                                  ? "warning"
                                  : "error"
                              }
                            />
                          </div>
                        </div>
                        {analysis.summary.effectiveness && (
                          <Caption1
                            style={{
                              marginTop: "8px",
                              color: tokens.colorNeutralForeground3,
                            }}
                          >
                            {analysis.summary.effectiveness}
                          </Caption1>
                        )}
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* 2. Relevance Metrics */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("relevance")}
                      >
                        <Subtitle2Stronger>Relevance Metrics</Subtitle2Stronger>
                        {expandedSections["relevance"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["relevance"] && (
                    <CardPreview>
                      <div
                        style={{
                          padding: "0 16px 16px",
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <Caption1Strong>
                            Job Description Relevance
                          </Caption1Strong>
                          <ProgressBar
                            value={
                              analysis.relevanceMetrics.jobDescriptionRelevance
                            }
                            max={100}
                            color={
                              analysis.relevanceMetrics
                                .jobDescriptionRelevance >= 70
                                ? "success"
                                : "warning"
                            }
                          />
                          <Caption1>
                            {analysis.relevanceMetrics.jobDescriptionRelevance}%
                          </Caption1>
                        </div>
                        <div>
                          <Caption1Strong>Resume Relevance</Caption1Strong>
                          <ProgressBar
                            value={analysis.relevanceMetrics.resumeRelevance}
                            max={100}
                            color={
                              analysis.relevanceMetrics.resumeRelevance >= 70
                                ? "success"
                                : "warning"
                            }
                          />
                          <Caption1>
                            {analysis.relevanceMetrics.resumeRelevance}%
                          </Caption1>
                        </div>
                        <div>
                          <Caption1Strong>Skills Relevance</Caption1Strong>
                          <ProgressBar
                            value={analysis.relevanceMetrics.skillsRelevance}
                            max={100}
                            color={
                              analysis.relevanceMetrics.skillsRelevance >= 70
                                ? "success"
                                : "warning"
                            }
                          />
                          <Caption1>
                            {analysis.relevanceMetrics.skillsRelevance}%
                          </Caption1>
                        </div>
                        <div>
                          <Caption1Strong>Irrelevant Questions</Caption1Strong>
                          <ProgressBar
                            value={
                              analysis.relevanceMetrics.irrelevantQuestions
                            }
                            max={100}
                            color="error"
                          />
                          <Caption1>
                            {analysis.relevanceMetrics.irrelevantQuestions}%
                          </Caption1>
                        </div>
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* 3. Coverage Assessment */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("coverage")}
                      >
                        <Subtitle2Stronger>
                          Coverage Assessment
                        </Subtitle2Stronger>
                        {expandedSections["coverage"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["coverage"] && (
                    <CardPreview>
                      <div
                        style={{
                          padding: "0 16px 16px",
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            <Checkmark20Regular
                              style={{
                                color: tokens.colorPaletteGreenForeground1,
                              }}
                            />
                            <Caption1Strong>
                              Covered Skills (
                              {analysis.coverageAssessment.coveredSkills.length}
                              )
                            </Caption1Strong>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {analysis.coverageAssessment.coveredSkills.length >
                            0 ? (
                              analysis.coverageAssessment.coveredSkills.map(
                                (skill, idx) => (
                                  <Badge
                                    key={idx}
                                    appearance="filled"
                                    color="success"
                                  >
                                    {skill}
                                  </Badge>
                                )
                              )
                            ) : (
                              <Caption1
                                style={{
                                  color: tokens.colorNeutralForeground3,
                                }}
                              >
                                None
                              </Caption1>
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            <Warning20Regular
                              style={{
                                color: tokens.colorPaletteRedForeground1,
                              }}
                            />
                            <Caption1Strong>
                              Missed Skills (
                              {analysis.coverageAssessment.missedSkills.length})
                            </Caption1Strong>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            {analysis.coverageAssessment.missedSkills.length >
                            0 ? (
                              analysis.coverageAssessment.missedSkills.map(
                                (skill, idx) => (
                                  <Badge
                                    key={idx}
                                    appearance="filled"
                                    color="danger"
                                  >
                                    {skill}
                                  </Badge>
                                )
                              )
                            ) : (
                              <Caption1
                                style={{
                                  color: tokens.colorNeutralForeground3,
                                }}
                              >
                                None
                              </Caption1>
                            )}
                          </div>
                        </div>
                        {analysis.coverageAssessment.coveredExperiences.length >
                          0 && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <Checkmark20Regular
                                style={{
                                  color: tokens.colorPaletteGreenForeground1,
                                }}
                              />
                              <Caption1Strong>
                                Covered Experiences
                              </Caption1Strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                              {analysis.coverageAssessment.coveredExperiences.map(
                                (exp, idx) => (
                                  <li key={idx}>
                                    <Caption1>{exp}</Caption1>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        {analysis.coverageAssessment.missedExperiences.length >
                          0 && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <Warning20Regular
                                style={{
                                  color: tokens.colorPaletteRedForeground1,
                                }}
                              />
                              <Caption1Strong>
                                Missed Experiences
                              </Caption1Strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                              {analysis.coverageAssessment.missedExperiences.map(
                                (exp, idx) => (
                                  <li key={idx}>
                                    <Caption1>{exp}</Caption1>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* 4. Performance Assessment */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("performance")}
                      >
                        <Subtitle2Stronger>
                          Performance Assessment
                        </Subtitle2Stronger>
                        {expandedSections["performance"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["performance"] && (
                    <CardPreview>
                      <div
                        style={{
                          padding: "0 16px 16px",
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "24px",
                        }}
                      >
                        {/* Interviewer Performance */}
                        <div>
                          <Caption1Strong
                            style={{ display: "block", marginBottom: "12px" }}
                          >
                            Interviewer Performance
                          </Caption1Strong>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <Caption1>Question Quality: </Caption1>
                              <Badge appearance="tint">
                                {
                                  analysis.interviewerPerformance
                                    .questionQuality
                                }
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Probing Depth: </Caption1>
                              <Badge appearance="tint">
                                {analysis.interviewerPerformance.probingDepth}
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Candidate Space: </Caption1>
                              <Badge appearance="tint">
                                {
                                  analysis.interviewerPerformance
                                    .candidateSpaceProvided
                                }
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Bias Detected: </Caption1>
                              <Badge
                                appearance="filled"
                                color={
                                  analysis.interviewerPerformance.biasDetected
                                    ? "danger"
                                    : "success"
                                }
                              >
                                {analysis.interviewerPerformance.biasDetected
                                  ? "Yes"
                                  : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Candidate Performance */}
                        <div>
                          <Caption1Strong
                            style={{ display: "block", marginBottom: "12px" }}
                          >
                            Candidate Performance
                          </Caption1Strong>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <Caption1>Response Quality: </Caption1>
                              <Badge appearance="tint">
                                {analysis.candidatePerformance.responseQuality}
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Alignment: </Caption1>
                              <Badge appearance="tint">
                                {analysis.candidatePerformance.alignment}
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Technical Depth: </Caption1>
                              <Badge appearance="tint">
                                {analysis.candidatePerformance.technicalDepth}
                              </Badge>
                            </div>
                            <div>
                              <Caption1>Communication: </Caption1>
                              <Badge appearance="tint">
                                {analysis.candidatePerformance.communication}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* 5. Question Analysis */}
                {analysis.questionAnalysis.length > 0 && (
                  <Card>
                    <CardHeader
                      header={
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            width: "100%",
                          }}
                          onClick={() => toggleSection("questions")}
                        >
                          <Subtitle2Stronger>
                            Question Analysis (
                            {analysis.questionAnalysis.length})
                          </Subtitle2Stronger>
                          {expandedSections["questions"] ? (
                            <ChevronDown20Regular />
                          ) : (
                            <ChevronRight20Regular />
                          )}
                        </div>
                      }
                    />
                    {expandedSections["questions"] && (
                      <CardPreview>
                        <div
                          style={{
                            padding: "0 16px 16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            maxHeight: "384px",
                            overflowY: "auto",
                          }}
                        >
                          {analysis.questionAnalysis.map((qa, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "12px",
                                border: `1px solid ${tokens.colorNeutralStroke2}`,
                                borderRadius: "4px",
                                backgroundColor: qa.isRelevant
                                  ? tokens.colorNeutralBackground1
                                  : tokens.colorNeutralBackground2,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  marginBottom: "8px",
                                }}
                              >
                                {qa.isRelevant ? (
                                  <Checkmark20Regular
                                    style={{
                                      color:
                                        tokens.colorPaletteGreenForeground1,
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <Dismiss20Regular
                                    style={{
                                      color: tokens.colorPaletteRedForeground1,
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                                <div style={{ flex: 1 }}>
                                  <Body2 style={{ fontWeight: 600 }}>
                                    {qa.question}
                                  </Body2>
                                  <Caption1
                                    style={{
                                      marginTop: "4px",
                                      display: "block",
                                    }}
                                  >
                                    {qa.reason}
                                  </Caption1>
                                  {!qa.isRelevant && qa.betterAlternative && (
                                    <div
                                      style={{
                                        marginTop: "8px",
                                        padding: "8px",
                                        backgroundColor:
                                          tokens.colorNeutralBackground3,
                                        borderRadius: "4px",
                                      }}
                                    >
                                      <Caption1Strong>
                                        Better Alternative:
                                      </Caption1Strong>
                                      <Caption1
                                        style={{
                                          marginLeft: "4px",
                                          display: "block",
                                        }}
                                      >
                                        {qa.betterAlternative}
                                      </Caption1>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {qa.relevantTo && qa.relevantTo.length > 0 && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                    marginTop: "8px",
                                  }}
                                >
                                  {qa.relevantTo.map((rel, ridx) => (
                                    <Badge
                                      key={ridx}
                                      appearance="tint"
                                      size="small"
                                    >
                                      {rel}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardPreview>
                    )}
                  </Card>
                )}

                {/* 6. Compliance Check */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("compliance")}
                      >
                        <Subtitle2Stronger>Compliance Check</Subtitle2Stronger>
                        {expandedSections["compliance"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["compliance"] && (
                    <CardPreview>
                      <div style={{ padding: "0 16px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {analysis.complianceCheck
                              .discriminatoryQuestions ? (
                              <Dismiss20Regular
                                style={{
                                  color: tokens.colorPaletteRedForeground1,
                                }}
                              />
                            ) : (
                              <Checkmark20Regular
                                style={{
                                  color: tokens.colorPaletteGreenForeground1,
                                }}
                              />
                            )}
                            <Caption1>
                              Discriminatory Questions:{" "}
                              <Badge
                                appearance="filled"
                                color={
                                  analysis.complianceCheck
                                    .discriminatoryQuestions
                                    ? "danger"
                                    : "success"
                                }
                              >
                                {analysis.complianceCheck
                                  .discriminatoryQuestions
                                  ? "Detected"
                                  : "None"}
                              </Badge>
                            </Caption1>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {analysis.complianceCheck.professionalStandards ? (
                              <Checkmark20Regular
                                style={{
                                  color: tokens.colorPaletteGreenForeground1,
                                }}
                              />
                            ) : (
                              <Dismiss20Regular
                                style={{
                                  color: tokens.colorPaletteRedForeground1,
                                }}
                              />
                            )}
                            <Caption1>
                              Professional Standards:{" "}
                              <Badge
                                appearance="filled"
                                color={
                                  analysis.complianceCheck.professionalStandards
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {analysis.complianceCheck.professionalStandards
                                  ? "Met"
                                  : "Not Met"}
                              </Badge>
                            </Caption1>
                          </div>
                          {analysis.complianceCheck.concerns &&
                            analysis.complianceCheck.concerns.length > 0 && (
                              <div>
                                <Caption1Strong>Concerns:</Caption1Strong>
                                <ul
                                  style={{
                                    margin: "8px 0 0 0",
                                    paddingLeft: "20px",
                                  }}
                                >
                                  {analysis.complianceCheck.concerns.map(
                                    (concern, idx) => (
                                      <li key={idx}>
                                        <Caption1>{concern}</Caption1>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>

                        {/* Red Flags as part of Compliance */}
                        {analysis.redFlags && analysis.redFlags.length > 0 && (
                          <div style={{ marginTop: "16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "12px",
                              }}
                            >
                              <Warning20Regular
                                style={{
                                  color: tokens.colorPaletteRedForeground1,
                                }}
                              />
                              <Caption1Strong>
                                Red Flags ({analysis.redFlags.length})
                              </Caption1Strong>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                              }}
                            >
                              {analysis.redFlags.map((flag, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "12px",
                                    border: `1px solid ${tokens.colorNeutralStroke2}`,
                                    borderRadius: "4px",
                                    backgroundColor:
                                      tokens.colorNeutralBackground2,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    <Badge appearance="filled" color="warning">
                                      {flag}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* 7. Summary & Recommendation */}
                <Card>
                  <CardHeader
                    header={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onClick={() => toggleSection("summary")}
                      >
                        <Subtitle2Stronger>
                          Summary & Recommendation
                        </Subtitle2Stronger>
                        {expandedSections["summary"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["summary"] && (
                    <CardPreview>
                      <div
                        style={{
                          padding: "0 16px 16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <Caption1Strong>Final Recommendation:</Caption1Strong>
                          <div style={{ marginTop: "8px" }}>
                            <Badge
                              appearance="filled"
                              color={getRecommendationColor(
                                analysis.summary.recommendation
                              )}
                              size="large"
                            >
                              {analysis.summary.recommendation}
                            </Badge>
                          </div>
                        </div>

                        <Divider />

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <Checkmark20Regular
                                style={{
                                  color: tokens.colorPaletteGreenForeground1,
                                }}
                              />
                              <Caption1Strong>Strengths</Caption1Strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                              {analysis.summary.strengths.map(
                                (strength, idx) => (
                                  <li key={idx} style={{ marginBottom: "4px" }}>
                                    <Caption1>{strength}</Caption1>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                              }}
                            >
                              <Warning20Regular
                                style={{
                                  color: tokens.colorPaletteRedForeground1,
                                }}
                              />
                              <Caption1Strong>Weaknesses</Caption1Strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "20px" }}>
                              {analysis.summary.weaknesses.map(
                                (weakness, idx) => (
                                  <li key={idx} style={{ marginBottom: "4px" }}>
                                    <Caption1>{weakness}</Caption1>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>

                        {analysis.recommendations &&
                          analysis.recommendations.length > 0 && (
                            <div>
                              <Caption1Strong>Recommendations:</Caption1Strong>
                              <ul
                                style={{
                                  margin: "8px 0 0 0",
                                  paddingLeft: "20px",
                                }}
                              >
                                {analysis.recommendations.map((rec, idx) => (
                                  <li key={idx} style={{ marginBottom: "4px" }}>
                                    <Caption1>{rec}</Caption1>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </CardPreview>
                  )}
                </Card>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default TranscriptAnalysisDialog;

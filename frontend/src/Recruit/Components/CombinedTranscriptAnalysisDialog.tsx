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
  Badge,
  Card,
  CardHeader,
  CardPreview,
  Body1,
  Caption1,
  Caption1Strong,
  Subtitle2Stronger,
  tokens,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  Divider,
  Body1Strong,
} from "@fluentui/react-components";
import {
  DocumentMultiple20Regular,
  Checkmark20Regular,
  Warning20Regular,
  Dismiss20Regular,
  ChevronDown20Regular,
  ChevronRight20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";

interface Recording {
  id: string;
  createdDateTime: string;
  fullTranscriptData: {
    transcriptContentUrl: string;
    createdDateTime: string;
    endDateTime: string;
  };
}

interface CombinedTranscriptAnalysisProps {
  recordings: Recording[];
  jobPostingId: string;
  applicantId: string;
  interviewType: string;
  interviewTitle: string;
  interviewId: string;
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
  _combinedAnalysis?: {
    numberOfTranscripts: number;
    combinationMode: string;
    individualLengths: number[];
    totalLength: number;
  };
}

const CombinedTranscriptAnalysisDialog: React.FC<CombinedTranscriptAnalysisProps> = ({
  recordings,
  jobPostingId,
  applicantId,
  interviewType,
  interviewTitle,
  interviewId,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const { accessToken, refreshToken } = useAuth();

  // Filter valid recordings (those with transcripts)
  const validRecordings = recordings.filter(
    (r) => r.fullTranscriptData.transcriptContentUrl
  );

  const handleOpenDialog = async () => {
    await refreshToken().then(async () => {
      setOpen(true);
      // Auto-start analysis if not already done
      if (!analysis && !loading) {
        analyzeCombinedTranscripts();
      }
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const analyzeCombinedTranscripts = async () => {
    if (validRecordings.length === 0) {
      setError("No valid recordings found to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const selectedUrls = validRecordings
        .map((r) => r.fullTranscriptData.transcriptContentUrl)
        .filter((url): url is string => !!url);

      const selectedRecordingIds = validRecordings.map((r) => r.id);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/transcript/analyze-combined-transcripts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            transcriptUrls: selectedUrls,
            jobPostingId,
            applicantId,
            interviewType,
            combinationMode: "merge",
            interviewId,
            recordingIds: selectedRecordingIds,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setAnalysis(result.data.analysis);
        setExpandedSections({
          overall: true,
          relevance: true,
          coverage: true,
          performance: true,
          questions: false,
          compliance: true,
          summary: true,
        });
      } else {
        setError(result.error || "Failed to analyze combined transcripts");
      }
    } catch (err) {
      setError("An error occurred while analyzing the transcripts");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return tokens.colorPaletteGreenForeground1;
    if (score >= 60) return tokens.colorPaletteYellowForeground2;
    return tokens.colorPaletteRedForeground1;
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation === "Proceed") return "success";
    if (recommendation === "Proceed with Caution") return "warning";
    return "danger";
  };

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button
          appearance="primary"
          icon={<DocumentMultiple20Regular />}
          onClick={handleOpenDialog}
          disabled={validRecordings.length === 0}
        >
          Analyze All Recordings ({validRecordings.length})
        </Button>
      </DialogTrigger>
      <DialogSurface style={{ maxWidth: "900px", width: "90vw" }}>
        <DialogBody>
          <DialogTitle>
            <Subtitle2Stronger>Combined Transcript Analysis</Subtitle2Stronger>
            <div>
              <Caption1>
                {interviewTitle} - {validRecordings.length} Recording
                {validRecordings.length !== 1 ? "s" : ""}
              </Caption1>
            </div>
          </DialogTitle>
          <DialogContent style={{ overflowY: "auto", maxHeight: "70vh" }}>
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong>
                  Analyzing {validRecordings.length} transcript
                  {validRecordings.length !== 1 ? "s" : ""}...
                </Body1Strong>
                <Caption1>
                  This may take a moment depending on the transcript length
                </Caption1>
              </div>
            )}

            {/* Error State */}
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>
                  <Body1>{error}</Body1>
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Combined Analysis Metadata */}
                {analysis._combinedAnalysis && (
                  <MessageBar intent="info">
                    <MessageBarBody>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <DocumentMultiple20Regular />
                        <span>
                          Successfully analyzed{" "}
                          {analysis._combinedAnalysis.numberOfTranscripts}{" "}
                          recording
                          {analysis._combinedAnalysis.numberOfTranscripts !== 1
                            ? "s"
                            : ""}{" "}
                          (
                          {analysis._combinedAnalysis.totalLength.toLocaleString()}{" "}
                          total characters)
                        </span>
                      </div>
                    </MessageBarBody>
                  </MessageBar>
                )}

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
                        onClick={() => toggleSection("overall")}
                      >
                        <Subtitle2Stronger>
                          Overall Interview Quality
                        </Subtitle2Stronger>
                        {expandedSections["overall"] ? (
                          <ChevronDown20Regular />
                        ) : (
                          <ChevronRight20Regular />
                        )}
                      </div>
                    }
                  />
                  {expandedSections["overall"] && (
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
                        <Caption1
                          style={{
                            marginTop: "8px",
                            color: tokens.colorNeutralForeground3,
                          }}
                        >
                          Based on combined analysis of all recordings
                        </Caption1>
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

                {/* 3. Coverage Assessment - Similar structure */}
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
                      </div>
                    </CardPreview>
                  )}
                </Card>

                {/* Summary Section */}
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
            {/* {analysis && !loading && (
              <Button appearance="primary" onClick={analyzeCombinedTranscripts}>
                Re-analyze
              </Button>
            )} */}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CombinedTranscriptAnalysisDialog;

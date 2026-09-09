import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Button,
  Input,
  Dropdown,
  Option,
  Avatar,
  ProgressBar,
  Field,
} from "@fluentui/react-components";
import {
  PersonRegular,
  MailRegular,
  CallRegular,
  CalendarRegular,
} from "@fluentui/react-icons";

interface Applicant {
  ID: string;
  ApplicantCode: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  JobRole: string;
  Status: string;
  CurrentStage: string;
  StageProgress: number;
  AppliedDate: string;
  Skills: string[];
  Experience: string;
}

interface ApplicantPipelineProps {
  applicants: Applicant[];
}

export default function ApplicantPipeline({
  applicants,
}: ApplicantPipelineProps) {
  const [filterStage, setFilterStage] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesStage =
      filterStage === "all" ||
      applicant.CurrentStage.toLowerCase() === filterStage;
    const matchesSearch =
      applicant.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.JobRole.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "applied":
        return "informative";
      case "screening":
        return "warning";
      case "technical interview":
        return "brand";
      case "hr interview":
        return "success";
      case "final interview":
        return "severe";
      case "offer":
        return "success";
      case "rejected":
        return "danger";
      case "hired":
        return "success";
      default:
        return "subtle";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-2">
          <Text size={600} weight="semibold">
            Applicant Pipeline
          </Text>
          <Text size={300} className="text-gray-600">
            Track applicants through the hiring process
          </Text>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Field className="flex-1">
            <Input
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field className="w-full sm:w-48">
            <Dropdown
              placeholder="Filter by stage"
              value={filterStage}
              selectedOptions={filterStage !== "all" ? [filterStage] : []}
              onOptionSelect={(_, data) =>
                setFilterStage(data.optionValue || "all")
              }
            >
              <Option value="all">All Stages</Option>
              <Option value="applied">Applied</Option>
              <Option value="screening">Screening</Option>
              <Option value="technical interview">Technical Interview</Option>
              <Option value="hr interview">HR Interview</Option>
              <Option value="final interview">Final Interview</Option>
              <Option value="offer">Offer</Option>
              <Option value="hired">Hired</Option>
              <Option value="rejected">Rejected</Option>
            </Dropdown>
          </Field>
        </div>
      </CardHeader>

      <CardPreview className="p-4">
        <div className="space-y-4">
          {filteredApplicants.map((applicant) => (
            <Card
              key={applicant.ID}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar
                    name={getInitials(applicant.FirstName, applicant.LastName)}
                    size={48}
                    className="h-12 w-12"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Text size={500} weight="semibold">
                        {applicant.FirstName} {applicant.LastName}
                      </Text>
                      <Badge
                        appearance="outline"
                        size="small"
                        className="text-xs"
                      >
                        {applicant.ApplicantCode}
                      </Badge>
                      <Badge
                        appearance={
                          getStageColor(applicant.CurrentStage) as any
                        }
                        size="small"
                      >
                        {applicant.CurrentStage}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <MailRegular className="text-base" />
                        <Text size={300}>{applicant.Email}</Text>
                      </div>
                      {applicant.Phone && (
                        <div className="flex items-center gap-2">
                          <CallRegular className="text-base" />
                          <Text size={300}>{applicant.Phone}</Text>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <PersonRegular className="text-base" />
                        <Text size={300}>{applicant.JobRole}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarRegular className="text-base" />
                        <Text size={300}>
                          Applied:{" "}
                          {new Date(applicant.AppliedDate).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <Text size={300} weight="medium">
                          Pipeline Progress
                        </Text>
                        <Text size={300}>{applicant.StageProgress}%</Text>
                      </div>
                      <ProgressBar
                        value={applicant.StageProgress / 100}
                        className="h-2"
                      />
                    </div>

                    <div className="mb-3">
                      <Text
                        size={300}
                        weight="medium"
                        className="text-gray-700 mb-1 block"
                      >
                        Skills:
                      </Text>
                      <div className="flex flex-wrap gap-1">
                        {applicant.Skills.map((skill, index) => (
                          <Badge
                            key={index}
                            appearance="outline"
                            size="small"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <Text size={300}>
                        <Text weight="medium">Experience:</Text>{" "}
                        {applicant.Experience}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button appearance="outline" size="small">
                    View Profile
                  </Button>
                  <Button appearance="outline" size="small">
                    Schedule Interview
                  </Button>
                  <Button appearance="outline" size="small">
                    Move Stage
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredApplicants.length === 0 && (
            <div className="text-center py-8">
              <Text size={400} className="text-gray-500">
                No applicants found matching your criteria.
              </Text>
            </div>
          )}
        </div>
      </CardPreview>
    </Card>
  );
}

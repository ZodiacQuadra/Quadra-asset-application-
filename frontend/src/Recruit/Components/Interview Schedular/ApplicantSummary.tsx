import React from "react";
import {
  Avatar,
  Badge,
  Spinner,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Body1Strong,
} from "@fluentui/react-components";
import { Applicant } from "../../../Types/interview";

interface ApplicantSummaryProps {
  selectedApplicants: Set<string>;
  applicants: Applicant[];
  isLoadingApplicants: boolean;
}

const ApplicantSummary: React.FC<ApplicantSummaryProps> = ({
  selectedApplicants,
  applicants,
  isLoadingApplicants,
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  if (isLoadingApplicants) {
    return (
      <Card className="w-full">
        <CardPreview className="flex items-center justify-center p-4 flex-col">
          <Spinner />
          <div>
            <Body1Strong className="mt-2">
              Loading applicant details...
            </Body1Strong>
          </div>
        </CardPreview>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader
        header={
          <Text weight="semibold">
            Schedule interviews for {selectedApplicants.size} selected applicant
            {selectedApplicants.size > 1 ? "s" : ""}
          </Text>
        }
      />
      <CardPreview>
        <div className="max-h-40 overflow-y-auto pb-1 px-4 space-y-3">
          {Array.from(selectedApplicants).map((applicantId) => {
            const applicant = applicants.find((a) => a.ID === applicantId);
            return applicant ? (
              <div
                key={applicant.ID}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <Avatar
                  size={32}
                  name={`${applicant.firstName} ${applicant.lastName}`}
                  initials={getInitials(
                    applicant.firstName,
                    applicant.lastName
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex-col">
                    <Text weight="medium" className="block">
                      {applicant.firstName} {applicant.lastName}
                    </Text>
                    <div>
                      <Text size={200} className="text-gray-600 block">
                        {applicant.email}
                      </Text>
                    </div>
                  </div>
                </div>
                <Badge appearance="outline" size="small">
                  {applicant.applicantStatus}
                </Badge>
              </div>
            ) : (
              <div
                key={applicantId}
                className="flex flex-col items-center justify-center py-8 h-full"
              >
                <Spinner />
                <Body1Strong className="mt-2"> Loading...</Body1Strong>
              </div>
            );
          })}
        </div>
      </CardPreview>
    </Card>
  );
};

export default ApplicantSummary;

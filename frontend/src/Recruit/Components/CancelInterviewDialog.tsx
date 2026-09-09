import React, { useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Field,
  Textarea,
  Spinner,
  Text,
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
} from "@fluentui/react-components";
import { Warning24Regular, Dismiss24Regular, Important20Filled } from "@fluentui/react-icons";

interface CancelInterviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  interview: any;
  applicant: any;
  onCancelSuccess: (cancelData: CancelInterviewData) => void;
  isLoading?: boolean;
}

interface CancelInterviewData {
  interviewId: string;
  reason: string;
  applicantId: string;
  interviewers?: any[]; // Add interviewers to the interface
}

export const CancelInterviewDialog: React.FC<CancelInterviewDialogProps> = ({
  isOpen,
  onOpenChange,
  interview,
  applicant,
  onCancelSuccess,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    setIsSubmitting(true);

    try {
      const cancelData: CancelInterviewData = {
        interviewId: interview.interviewId,
        reason: reason.trim(),
        applicantId: applicant.ID,
        // Pass the interviewers data from the interview object
        interviewers: interview.interviewers || [],
      };

      await onCancelSuccess(cancelData);
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to cancel interview:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch (error) {
      return { date: "Invalid Date", time: "" };
    }
  };

  if (!interview || !applicant) return null;

  const dateTime = formatDateTime(interview.scheduledDateTime);
  const interviewers = interview.interviewers || [];

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(_, { open }) => onOpenChange(open)}
      position="end"
      className="!w-[75%]"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div className="flex items-center gap-2">
            <span className="h-[32px] w-[32px] rounded-[50%] bg-[#FEE2E2] flex justify-center items-center"><Important20Filled className="text-red-500 h-[20px] w-[20px]" /></span>
            Cancel Interview
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
          <Text className="text-red-800 font-medium">
            Are you sure you want to cancel this interview? This action
            cannot be undone. The applicant and interviewers will be
            notified.
          </Text>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-[#6B7280]">Applicant:</Text>
            <Text className="text-[#111827] font-semibold">
              {applicant.firstName} {applicant.lastName}
            </Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-gray-700">Interview:</Text>
            <Text className="text-[#111827] font-semibold">{interview.title}</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-[#6B7280]">Date:</Text>
            <Text className="text-[#111827] font-semibold">{dateTime.date}</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-[#6B7280]">Time:</Text>
            <Text className="text-[#111827] font-semibold">{dateTime.time}</Text>
          </div>
          <div className="flex flex-col gap-1">
            <Text className="font-medium text-[#6B7280]">Interviewers:</Text>
            <div className="text-[#111827]">
              {interviewers && interviewers.length > 0 ? (
                <div className="flex items-center gap-3">
                  {(() => {
                    const interviewerNames = interviewers.map(
                      (i: any) => i.displayName
                    );

                    const {
                      inlineItems,
                      overflowItems,
                    }: any = partitionAvatarGroupItems({
                      items: interviewerNames,
                      layout: "stack",
                    });

                    return (
                      <AvatarGroup size={28} layout="stack" key="interviewers">
                        {inlineItems.map((name: string) => (
                          <AvatarGroupItem name={name} key={name} />
                        ))}
                        {overflowItems && overflowItems.length > 0 && (
                          <AvatarGroupPopover>
                            {overflowItems.map((name: string) => (
                              <AvatarGroupItem name={name} key={name} />
                            ))}
                          </AvatarGroupPopover>
                        )}
                      </AvatarGroup>
                    );
                  })()}
                </div>
              ) : (
                <Text className="text-gray-500 text-sm">No interviewers assigned</Text>
              )}
            </div>
          </div>
        </div>

        <Field label="Reason for Cancellation" required>
          <Textarea
            placeholder="Please provide a reason for cancelling this interview..."
            value={reason}
            onChange={(_e, data) => setReason(data.value)}
            resize="vertical"
            rows={4}
            disabled={isSubmitting || isLoading}
          />
        </Field>

        {/* {interviewers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Text className="text-blue-800 text-sm">
                  <strong>Note:</strong> All {interviewers.length}{" "}
                  interviewer(s) and the applicant will receive a cancellation
                  notification email.
                </Text>
              </div>
            )} */}
      </DrawerBody>

      <DrawerFooter className="!flex !justify-end !items-center">
        <Button
          appearance="secondary"
          onClick={handleCancel}
          disabled={isSubmitting || isLoading}
          className="!rounded-[30px]"
        >
          Keep Interview
        </Button>
        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading || !reason.trim()}
          className="!bg-[#DC2626] !text-[#fff] !rounded-[30px]"
          icon={
            isSubmitting || isLoading ? (
              <Spinner size="tiny" />
            ) : (
              <Dismiss24Regular color="#fff" />
            )
          }
        >
          {isSubmitting || isLoading ? "Cancelling..." : "Cancel Interview"}
        </Button>
      </DrawerFooter>
    </Drawer>
  );
};

export default CancelInterviewDialog;

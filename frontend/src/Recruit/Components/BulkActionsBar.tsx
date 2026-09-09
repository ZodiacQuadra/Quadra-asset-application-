import React from "react";
import { Button, Badge, Card, CardHeader } from "@fluentui/react-components";
import {
  CalendarLtr24Regular,
  Dismiss24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
} from "@fluentui/react-icons";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkSchedule: () => void;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  isManualStage?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkSchedule,
  onBulkApprove,
  onBulkReject,
  isManualStage = false,
}) => {
  return (
    <div className="bg-emerald-200 border border-blue-200 rounded-lg md:w-1/2 p-3 w-full flex items-center justify-between fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2">
        <Badge appearance="filled" color="brand">
          {selectedCount} selected
        </Badge>
        <span className="text-sm text-gray-600">
          {selectedCount} applicant{selectedCount !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {isManualStage ? (
          <>
            <Button
              appearance="primary"
              size="small"
              onClick={onBulkApprove}
              icon={<CheckmarkCircle24Regular />}
            >
              Bulk Approve
            </Button>
            <Button
              appearance="outline"
              size="small"
              onClick={onBulkReject}
              icon={<DismissCircle24Regular />}
              className="!bg-red-50 hover:!bg-red-100"
            >
              Bulk Reject
            </Button>
          </>
        ) : (
          <Button
            appearance="primary"
            size="small"
            onClick={onBulkSchedule}
            icon={<CalendarLtr24Regular />}
          >
            Bulk Schedule
          </Button>
        )}
        <Button
          appearance="subtle"
          size="small"
          className="!bg-red-50 hover:!bg-red-100"
          onClick={onClearSelection}
          icon={<Dismiss24Regular />}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

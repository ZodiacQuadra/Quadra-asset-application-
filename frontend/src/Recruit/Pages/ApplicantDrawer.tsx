import React, { useState, useEffect } from "react";
import {
  Tab,
  TabList,
  TabValue,
  SelectTabEvent,
  SelectTabData,
  Divider,
  makeStyles,
  Body1Strong,
  Spinner,
} from "@fluentui/react-components";
import {
  Document20Regular,
  TextBulletListCheckmark20Regular,
} from "@fluentui/react-icons";
import { PreviewApplicant } from "../Components/PreviewApplicant";

import { getApplicantById } from "../../Services/Resume";
import ApplicantLifecycleStepper from "../Components/ApplicantLifecycleStepper";

interface Applicant {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  Status: string;
  CreatedAt: string;
  ModifiedAt: string | null;
  skills: Array<{ value: string }>;
}

interface ApplicantDrawerProps {
  jobId: string;
  applicant: Applicant;
  onUpdate?: (updatedApplicant: Applicant) => void;
  onClose?: () => void;
  showlifecycle?: boolean;
}

const useStyles = makeStyles({
  tabContent: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "10px 0",
  },
});

export const ApplicantDrawer: React.FC<ApplicantDrawerProps> = ({
  jobId,
  applicant,
  onUpdate,
  onClose,
  showlifecycle = true,
}) => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>("resume");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Local state to keep applicant data
  const [applicantData, setApplicantData] = useState<Applicant>(applicant);

  // Handle tab switch
  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value);
  };

  // ✅ Fetch applicant from server and update state
  const fetchApplicant = async () => {
    try {
      setIsLoading(true);
      const latest: any = await getApplicantById(applicant.ID);
      if (latest?.data) {
        setApplicantData(latest.data);
      }
    } catch (error) {
      console.error("Error fetching applicant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Handle updates and refresh applicant info
  const handleApplicantUpdate = async (updatedData: any) => {
    try {
      // ✅ First update parent component
      onUpdate?.(updatedData);

      // ✅ Then refresh from server to get the latest data
      await fetchApplicant();
    } catch (err) {
      console.error("Error updating applicant:", err);
    }
  };

  // ✅ Update local state when applicant prop changes
  useEffect(() => {
    setApplicantData(applicant);
  }, [applicant]);

  // ✅ Initial fetch only if needed
  useEffect(() => {
    // Only fetch if we suspect the data might be stale
    if (applicant.ID) {
      fetchApplicant();
    }
  }, [applicant.ID]);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="w-fit p-[10px] bg-[#f7f7f7] border-[#CECECE] rounded-lg border-1">
        <TabList
          selectedValue={selectedTab}
          onTabSelect={handleTabSelect}
          vertical={window.screen.width < 550 ? true : false}
          size="small"
          appearance="transparent"
        >
          <Tab
            value="resume"
            data-selected={selectedTab === "resume"}
            className={`${
              selectedTab === "resume"
                ? "!bg-[#ffffff] !text-[#1493DF] :after:!text-[#007ED5] after:!bg-transparent after:!border-none"
                : "!bg-transparent !text-[#4B5563] after:!border-0 :after:!text-[#007ED5] after:!bg-transparent after:!border-none"
            } `}
          >
            <Document20Regular
              className={`${
                selectedTab === "resume" ? "!text-[#1493DF]" : "!text-[#4B5563]"
              } `}
            />
            <span
              className={`${
                selectedTab === "resume" ? "!text-[#1493DF]" : "!text-[#4B5563]"
              } `}
            >
              Resume Details
            </span>
          </Tab>
          <Tab
            value="status"
            data-selected={selectedTab === "status"}
            className={`${
              selectedTab === "status"
                ? "!bg-[#ffffff] !text-[#1493DF] :after:!text-[#007ED5] after:!bg-transparent after:!border-none"
                : "!bg-transparent !text-[#4B5563] :after:!text-[#007ED5] after:!bg-transparent after:!border-none"
            } `}
          >
            <TextBulletListCheckmark20Regular
              className={`${
                selectedTab === "status" ? "!text-[#1493DF]" : "!text-[#4B5563]"
              } `}
            />
            <span
              className={`${
                selectedTab === "status" ? "!text-[#1493DF]" : "!text-[#4B5563]"
              } `}
            >
              Lifecycle Progress
            </span>
          </Tab>
          {/* <Tab value="analytics" data-selected={selectedTab === "analytics"}>
            <ChartMultiple20Regular />
            Analytics
          </Tab> */}
        </TabList>
      </div>

      <Divider />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 h-full">
            <Spinner />
            <Body1Strong className="mt-2">
              Loading applicant data...
            </Body1Strong>
          </div>
        ) : (
          <>
            {selectedTab === "resume" && (
              <PreviewApplicant
                jobId={jobId}
                applicant={applicantData}
                onUpdate={handleApplicantUpdate}
                onClose={onClose}
              />
            )}
            {selectedTab === "status" && (
              <ApplicantLifecycleStepper
                applicantId={applicantData.ID}
                showlifecycle={showlifecycle}
              />
            )}

            {/* {selectedTab === "analytics" && <ApplicantAnalytics />} */}
          </>
        )}
      </div>
    </div>
  );
};

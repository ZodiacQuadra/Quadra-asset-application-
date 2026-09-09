import {
  Body1,
  Caption1,
  Card,
  Subtitle1,
  Text,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  Clock24Regular,
  Document24Regular,
} from "@fluentui/react-icons";
import type { JobPosting, ChangeLog } from "../../Pages/JobPosting";

interface StatsDashboardProps {
  jobPostings: JobPosting[];
}

export const StatsDashboard = ({ jobPostings }: StatsDashboardProps) => {
  const activeJobs = jobPostings.filter((job) => job.status === "active");
  const draftJobs = jobPostings.filter((job) => job.status === "draft");

  const pendingApprovals = jobPostings.filter(
    (job: JobPosting) => job.hasPendingSuggestions
  );

  const stats = [
    {
      title: "Total Job Postings",
      value: jobPostings.length,
      icon: Document24Regular,
      description: "All job postings in the system",
      bgColor: "bg-[var(--colorBrandBackgroundInvertedPressed)]",
      iconColor: "text-[var(--colorNeutralStrokeAccessibleSelected)]",
    },
    {
      title: "Active Postings",
      value: activeJobs.length,
      icon: CheckmarkCircle24Regular,
      description: "Currently accepting applications",
      bgColor: "bg-[var(--colorPaletteDarkGreenBackground2)]",
      iconColor: "text-[var(--colorPaletteDarkGreenForeground2)]",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals.length,
      icon: Clock24Regular,
      description: "Awaiting review and approval",
      bgColor: "bg-[var(--colorStatusWarningBorder1)]",
      iconColor: "text-[var(--colorStatusWarningBorderActive)]",
    },
  ];

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="text-left rounded-lg border-none bg-transparent cursor-pointer w-full h-full transition-all duration-200 hover:-translate-y-1 p-4 hover:shadow-lg"
          >
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md flex items-center justify-center ${stat.bgColor} ${stat.iconColor}`}
                >
                  <Icon />
                </div>
                <div className="flex flex-col gap-0.5 md:max-w-[250px] md:min-w-[180px]">
                  <Body1 className="font-semibold">{stat.title}</Body1>
                  <Caption1 className="text-[var(--colorNeutralForeground3)]">
                    <p className="truncate"> {stat.description}</p>
                  </Caption1>
                </div>
                <div
                  className={`p-4 rounded-md flex items-center justify-center `}
                >
                  <Subtitle1>{stat.value}</Subtitle1>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Badge,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title3,
  Body1,
  Caption1,
  Divider,
  FluentProvider,
  Subtitle1,
  Persona,
  Body1Strong,
  Spinner,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  AccordionToggleEventHandler,
} from "@fluentui/react-components";
import {
  Person20Regular,
  Calendar20Regular,
  Document20Regular,
  CheckmarkCircle20Regular,
  Edit20Regular,
  ArrowCounterclockwise20Regular,
  Dismiss20Regular,
  CheckmarkCircle20Filled,
  Circle20Regular,
  DismissRegular,
} from "@fluentui/react-icons";
import type { JobPosting, ChangeLog } from "../../Pages/JobPosting";
import { useEffect, useState } from "react";
import { getJobChangeLogs } from "../../../Services/JobPosting";
import { useAuth } from "../../../Auth/AuthProvider";

interface ChangeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
}

export const ChangeLogModal = ({
  isOpen,
  onClose,
  job,
}: ChangeLogModalProps) => {
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken }: any = useAuth();
  const getChangeIcon = (type: string) => {
    switch (type) {
      case "description_change":
        return <Edit20Regular />;
      case "skills_change":
        return <Document20Regular />;
      case "status_change":
        return <ArrowCounterclockwise20Regular />;
      case "suggestion_approved":
        return <CheckmarkCircle20Regular />;
      default:
        return <Document20Regular />;
    }
  };

  useEffect(() => {
    if (job.id && isOpen) {
      setIsLoading(true);
      getJobChangeLogs(job.id, accessToken)
        .then((result) => {
          if (result.success) {
            // console.log("Change logs fetched successfully:", result.data);
            setChangeLogs(result.data || []);
          } else {
            console.error("Failed to fetch change logs:", result.error);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [job.id, isOpen]);

  const fetchAllChangeLogs = async () => {
    try {
      const allLogs: ChangeLog[] = [];
      setChangeLogs(allLogs);
    } catch (error) {
      console.error("Error fetching change logs:", error);
    }
  };

  // const getChangeColor = (type: string) => {
  //   switch (type) {
  //     case "description_change":
  //       return "informative";
  //     case "skills_change":
  //       return "important";
  //     case "status_change":
  //       return "warning";
  //     case "suggestion_approved":
  //       return "success";
  //     default:
  //       return "subtle";
  //   }
  // };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "description_change":
        return "!text-blue-600 !bg-blue-100";
      case "skills_change":
        return "!text-purple-600 !bg-purple-100";
      case "status_change":
        return "!text-yellow-600 !bg-yellow-100";
      case "suggestion_approved":
        return "!text-green-600 !bg-green-100";
      default:
        return "!text-gray-600 !bg-gray-100";
    }
  };

  const getStepperIconColor = (type: string) => {
    switch (type) {
      case "description_change":
        return "text-blue-600";
      case "skills_change":
        return "text-purple-600";
      case "status_change":
        return "text-orange-600";
      case "suggestion_approved":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStepperBgColor = (type: string) => {
    switch (type) {
      case "description_change":
        return "bg-blue-100 border-blue-300";
      case "skills_change":
        return "bg-purple-100 border-purple-300";
      case "status_change":
        return "bg-orange-100 border-orange-300";
      case "suggestion_approved":
        return "bg-green-100 border-green-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const formatChangeType = (type: string) => {
    switch (type) {
      case "description_change":
        return "Description Updated";
      case "skills_change":
        return "Skills Modified";
      case "status_change":
        return "Status Changed";
      case "suggestion_approved":
        return "Suggestion Approved";
      default:
        return "Unknown Change";
    }
  };

  const sortedChangeLogs = changeLogs.sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  const renderContent = () => {
    const [openItems, setOpenItems] = useState<string[]>([]);
    const handleToggle: AccordionToggleEventHandler<string> = (event, data) => {
      setOpenItems(data.openItems);
    };

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">Loading change history...</Body1Strong>
        </div>
      );
    }

    if (sortedChangeLogs.length === 0) {
      return (
        <div className="text-center flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Document20Regular className="w-8 h-8 text-gray-400" />
          </div>
          <Text className="text-gray-600">No changes yet</Text>
          <Caption1 className="text-gray-500 mt-2">
            Changes to this job posting will appear here
          </Caption1>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-8">
          {sortedChangeLogs.map((log, index) => (
            <div key={log.id} className="relative flex items-start space-x-6">
              {/* Stepper Icon */}
              <div
                className={`
                  relative z-10 flex items-center justify-center w-8 h-8 
                  rounded-full border-1 ${getStepperBgColor(log.type)}
                `}
              >
                <div className={`${getStepperIconColor(log.type)}`}>
                  {getChangeIcon(log.type)}
                </div>
              </div>

              {/* Content Card */}
              <div className="flex-1 min-w-0">
                <Card className="shadow-sm border border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <Badge
                          appearance="ghost"
                          className={getChangeColor(log.type)}
                          size="large"
                        >
                          {formatChangeType(log.type)}
                        </Badge>

                        {index === 0 && (
                          <Badge appearance="outline" color="success">
                            Latest
                          </Badge>
                        )}
                      </div>

                      <div className="text-right">
                        <Caption1 className="text-gray-600 block">
                          {new Date(log.changedAt).toLocaleDateString()}
                        </Caption1>
                        <Caption1 className="text-gray-500">
                          {new Date(log.changedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Caption1>
                      </div>
                    </div>
                  </CardHeader>

                  <CardPreview className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* User Info */}
                      <div>
                        <div className="grid grid-cols-2">
                          <Text className="text-gray-800 font-semibold">
                            Changed by:
                          </Text>
                          <Text className="text-gray-800 font-semibold">
                            Suggested by:
                          </Text>
                        </div>
                        <div className="grid grid-cols-2 items-center space-x-2 ">
                          <Persona
                            name={log.changedBy}
                            secondaryText={new Date(
                              log.changedAt
                            ).toLocaleDateString()}
                          />
                          {log.suggestedBy && (
                            <Persona
                              name={log.changedBy}
                              secondaryText={new Date(
                                log.changedAt
                              ).toLocaleDateString()}
                            />
                          )}
                        </div>
                      </div>

                      {/* Change Comparison */}
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <Text weight="semibold" className="text-red-800">
                              Previous Value
                            </Text>
                          </div>
                          <div className="text-red-700 whitespace-pre-wrap text-sm">
                            {log.oldValue}
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <Text weight="semibold" className="text-green-800">
                              Updated Value
                            </Text>
                          </div>
                          <div className="text-green-700 whitespace-pre-wrap text-sm">
                            {log.newValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardPreview>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* End of Timeline Indicator */}
        <div className="relative flex items-start space-x-6 mt-8">
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border bg-gray-50 border-gray-300">
            <Circle20Regular className="text-gray-400" />
          </div>
          <div className="flex-1 pt-2">
            <Body1Strong>Job posting created</Body1Strong>
          </div>
        </div>
      </div>
    );
  };

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <OverlayDrawer
        open={isOpen}
        position="end"
        size="large"
        className="!rounded-l-xl"
        onOpenChange={(event, data) => (data.open ? undefined : onClose())}
      >
        <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FFFFFF] !m-0 !p-3">
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => onClose()}
              />
            }
          >
            <div className="flex gap-4 items-center">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Document20Regular className="w-6 h-6 text-blue-600" />
              </div>
              <Subtitle1 className="!text-sm !font-semibold">
                Suggestion History - {job.title}
              </Subtitle1>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className="overflow-y-auto">
          <div className="mt-6">{renderContent()}</div>
        </DrawerBody>
      </OverlayDrawer>
    </FluentProvider>
  );
};

import { Button, Card, CardHeader } from "@fluentui/react-components";
import {
  Briefcase24Regular,
  Add24Regular,
  Search24Regular,
  Document24Regular,
  People24Regular,
  Sparkle24Regular,
} from "@fluentui/react-icons";

interface EmptyStateProps {
  type: "no-jobs" | "no-results" | "no-pending";
  onAction?: () => void;
  searchQuery?: string;
}

export const EmptyState = ({
  type,
  onAction,
  searchQuery,
}: EmptyStateProps) => {
  const configs = {
    "no-jobs": {
      icon: Briefcase24Regular,
      title: "No job postings yet",
      description:
        "Get started by creating your first job posting to attract top talent to your organization.",
      actionText: "Create Job Posting",
      illustration: (
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Briefcase24Regular className="h-12 w-12 text-blue-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
            <Sparkle24Regular className="h-4 w-4 text-yellow-600" />
          </div>
        </div>
      ),
    },
    "no-results": {
      icon: Search24Regular,
      title: `No results for "${searchQuery}"`,
      description:
        "Try adjusting your search terms or filters to find what you're looking for.",
      actionText: "Clear Search",
      illustration: (
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Search24Regular className="h-12 w-12 text-gray-500" />
        </div>
      ),
    },
    "no-pending": {
      icon: Document24Regular,
      title: "No pending approvals",
      description:
        "All suggestions have been reviewed. Great job staying on top of things!",
      actionText: "View All Jobs",
      illustration: (
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <People24Regular className="h-12 w-12 text-green-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      ),
    },
  };

  const config = configs[type];

  return (
    <Card className="py-16 px-8 text-center border-dashed border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
      <CardHeader>
        {config.illustration}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
          {config.description}
        </p>
        {onAction && (
          <Button
            onClick={onAction}
            appearance="primary"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            icon={<Add24Regular />}
          >
            {config.actionText}
          </Button>
        )}
      </CardHeader>
    </Card>
  );
};

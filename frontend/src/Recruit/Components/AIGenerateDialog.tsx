import * as React from "react";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Spinner,
  Body1Strong,
  DialogTrigger,
} from "@fluentui/react-components";
import {
  FlashSparkle24Regular,
  FlashSparkleFilled,
  Edit24Regular,
} from "@fluentui/react-icons";
import axios from "axios";

interface AIGenerateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
  onUseContent: () => void;
  accessToken?: string;
}

const AIGenerateDialog: React.FC<AIGenerateDialogProps> = ({
  isOpen,
  onOpenChange,
  content,
  isLoading,
  onRegenerate,
  onUseContent,
  accessToken,
}) => {
  const [isRefining, setIsRefining] = React.useState(false);
  const [refinedContent, setRefinedContent] = React.useState("");
  const [currentContent, setCurrentContent] = React.useState(content);

  // Update current content when content prop changes
  React.useEffect(() => {
    setCurrentContent(content);
    setRefinedContent(""); // Reset refined content when new content arrives
  }, [content]);

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/refine-description`,
        {
          content: currentContent,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const refined = response.data.output.content;
      setRefinedContent(refined);
      setCurrentContent(refined); // Update current content to refined version
    } catch (error) {
      console.error("Error refining content:", error);
      // Optionally show error toast
    } finally {
      setIsRefining(false);
    }
  };

  const handleUseContent = () => {
    onUseContent();
    setRefinedContent(""); // Reset refined content after using
  };

  // Format content for display (convert markdown-like syntax to HTML)
  const formatContent = (text: string) => {
    if (!text) return "";
    
    return text
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Headers
      .replace(/^### (.*$)/gim, "<h3 style='font-weight: 600; margin-top: 16px; margin-bottom: 8px;'>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2 style='font-weight: 700; margin-top: 20px; margin-bottom: 12px;'>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1 style='font-weight: 800; margin-top: 24px; margin-bottom: 16px;'>$1</h1>")
      // Bullet points
      .replace(/^- (.*$)/gim, "<li style='margin-left: 20px;'>$1</li>")
      // Line breaks
      .replace(/\n\n/g, "<br/><br/>");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(e, data) => onOpenChange(data.open)}
      modalType="alert"
    >
      <DialogSurface style={{ maxWidth: "700px" }}>
        <DialogBody>
          <DialogContent className="max-h-96 overflow-y-auto">
            <div className="text-center mb-2">
              <div className="mx-auto bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FlashSparkle24Regular className="text-blue-600" />
              </div>
              <DialogTitle className="font-bold text-gray-900 mb-2">
                AI Generated Content
              </DialogTitle>
              <p className="text-gray-600">
                {refinedContent 
                  ? "Content has been refined into markdown format" 
                  : "Please use the AI generated Content"}
              </p>
            </div>

            {isLoading || isRefining ? (
              <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">
                  {isRefining ? "Refining content..." : "Generating content..."}
                </Body1Strong>
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatContent(currentContent)) }}
                className="whitespace-pre-wrap border border-gray-200 rounded-lg p-4 bg-gray-50 text-gray-800"
                style={{ lineHeight: "1.6" }}
              />
            )}
          </DialogContent>
          <DialogActions className="flex w-max gap-2">
            <Button
              appearance="outline"
              onClick={onRegenerate}
              disabled={isLoading || isRefining}
              icon={<FlashSparkleFilled primaryFill={"#0066ff"} />}
            >
              <div className="!bg-gradient-to-r !from-[#0066ff] !to-[#ff0501] !bg-clip-text !text-transparent">
                Re-Generate
              </div>
            </Button>
            
            {/* <Button
              appearance="outline"
              onClick={handleRefine}
              disabled={isLoading || isRefining || !currentContent}
              icon={<Edit24Regular />}
              className="!border-purple-500 !text-purple-600"
            >
              Refine
            </Button> */}

            <Button
              appearance="primary"
              onClick={handleUseContent}
              disabled={isLoading || isRefining || !currentContent}
            >
              Use Content
            </Button>
            
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AIGenerateDialog;
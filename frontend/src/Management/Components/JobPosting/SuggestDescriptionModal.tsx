import { useContext, useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardHeader,
  CardPreview,
  FluentProvider,
} from "@fluentui/react-components";
import {
  Lightbulb24Regular,
  Person24Regular,
  Send24Regular,
  Document24Regular,
} from "@fluentui/react-icons";
import { toneContext } from "../../Pages/JobPosting";

interface JobPosting {
  id: string;
  title: string;
  description: string;
  skills: string[];
  status: "active" | "draft" | "closed";
  createdBy: string;
  createdAt: Date;
  modifiedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
}

interface SuggestDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
  onSubmit: (suggestion: string, suggestedBy: string) => void;
}

export const SuggestDescriptionModal = ({
  isOpen,
  onClose,
  job,
  onSubmit,
}: SuggestDescriptionModalProps) => {
  const [suggestion, setSuggestion] = useState("");
  const [suggestedBy, setSuggestedBy] = useState("Current User");
  const tone = useContext(toneContext);
  const handleSubmit = () => {
    if (suggestion.trim() && suggestedBy.trim()) {
      onSubmit(suggestion, suggestedBy);
      setSuggestion("");
      setSuggestedBy("Current User");
      onClose();
    }
  };

  return (
    <FluentProvider style={{background:"transparent"}}>
      <Dialog
        open={isOpen}
        onOpenChange={(event, data) => !data.open && onClose()}
      >
        <DialogSurface className="max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <DialogBody>
            <DialogContent className="p-0">
              {/* Header */}
              <div className="text-center pb-6 pt-4">
                <div className="mx-auto bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Lightbulb24Regular className="text-orange-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Suggest Description Improvement
                </DialogTitle>
                <p className="text-gray-600">
                  Help improve the job description for "{job.title}" with your
                  suggestions
                </p>
              </div>

              <div className="space-y-8">
                {/* Current Description Card */}
                <Card className="border-2 border-blue-100 shadow-sm">
                  <CardHeader
                    header={
                      <div className="text-lg text-blue-800 flex items-center bg-blue-50 p-4 rounded-t-lg">
                        <Document24Regular className="mr-2" />
                        Current Description for {job.title}
                      </div>
                    }
                  />
                  <CardPreview className="p-6">
                    <div className="rounded-lg p-4 border">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                  </CardPreview>
                </Card>

                {/* Suggestion Form */}
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                    <Lightbulb24Regular className="mr-2" />
                    Your Improvement Suggestion
                  </h3>

                  <div className="space-y-6">
                    {/* Name Input */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-700 flex items-center">
                        <Person24Regular className="mr-2 text-orange-600" />
                        Your Name
                      </Label>
                      <Input
                        value={suggestedBy}
                        onChange={(e) => setSuggestedBy(e.target.value)}
                        placeholder="Enter your name"
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    {/* Suggestion Textarea */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-700">
                        Improved Description
                      </Label>
                      <p className="text-sm text-gray-600">
                        Write a better version of the job description. Be
                        specific about improvements you're making.
                      </p>
                      <Textarea
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Write your improved description here. Consider making it more engaging, specific, or comprehensive..."
                        rows={8}
                        className="text-base resize-none min-h-[200px]"
                        required
                      />
                      <div className="text-right text-sm text-gray-500">
                        {suggestion.length} characters
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className=" rounded-lg p-4 border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2">
                        💡 Tips for a great suggestion:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Make the role sound exciting and engaging</li>
                        <li>
                          • Be specific about responsibilities and expectations
                        </li>
                        <li>
                          • Highlight growth opportunities and company culture
                        </li>
                        <li>• Use clear, professional language</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>

            {/* Actions */}
            <DialogActions className="flex w-max">
              <Button
                appearance="secondary"
                onClick={onClose}
                className="h-12 px-8 text-base"
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={!suggestion.trim() || !suggestedBy.trim()}
                className="h-12 px-8 text-base bg-orange-600 hover:bg-orange-700 shadow-lg"
              >
                <Send24Regular className="mr-2" />
                Submit Suggestion
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};

// Demo component to show the modal in action
export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const sampleJob: JobPosting = {
    id: "1",
    title: "Senior Frontend Developer",
    description:
      "We are looking for a Senior Frontend Developer to join our dynamic team. The ideal candidate will have experience with React, TypeScript, and modern web development practices. You will be responsible for building user interfaces, collaborating with the design team, and ensuring optimal performance of web applications.",
    skills: ["React", "TypeScript", "CSS", "JavaScript"],
    status: "active",
    createdBy: "HR Team",
    createdAt: new Date(),
    modifiedAt: new Date(),
    createdByUserId: "",
    modifiedByUserId: "",
  };

  const handleSuggestionSubmit = (suggestion: string, suggestedBy: string) => {
    // console.log("Suggestion submitted:", { suggestion, suggestedBy });
    alert(`Thank you for your suggestion, ${suggestedBy}!`);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Job Description Suggestions
        </h1>

        <Button
          appearance="primary"
          onClick={() => setIsModalOpen(true)}
          className="mb-4 bg-orange-600 hover:bg-orange-700"
        >
          <Lightbulb24Regular className="mr-2" />
          Suggest Description Improvement
        </Button>

        <SuggestDescriptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={sampleJob}
          onSubmit={handleSuggestionSubmit}
        />
      </div>
    </div>
  );
}

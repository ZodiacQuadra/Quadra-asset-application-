import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import {
  Button,
  Tooltip,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  FluentProvider,
  Toast,
  ToastTitle,
  useToastController,
  Spinner,
  useId,
  Toaster,
} from "@fluentui/react-components";
import {
  TextBold20Regular,
  TextItalic20Regular,
  TextUnderline20Regular,
  TextAlignLeft20Regular,
  TextAlignCenter20Regular,
  TextAlignRight20Regular,
  ArrowUndo20Regular,
  ArrowRedo20Regular,
  FlashSparkleFilled,
  TextColor20Regular,
  Copy20Regular,
  DocumentEditRegular,
} from "@fluentui/react-icons";
import * as React from "react";
import UpdateJDConfirmDialog from "./UpdateJDConfirmDialog";

interface AdvancedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  generateDescription: () => void; // Changed to void since it just triggers the dialog
  loading: boolean;
  formdata: any;
  disabled: boolean;
  onUpdateJD?: (content: string) => Promise<void>; // New prop for handling JD update
  newJobRoleName?:string
  isOtherSelected: boolean
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your message here...",
  generateDescription,
  loading,
  formdata,
  disabled,
  onUpdateJD,
}) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showUpdateJDDialog, setShowUpdateJDDialog] = useState(false);
  const [isUpdatingJD, setIsUpdatingJD] = useState(false);
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [styleSet, setStyleSet] = useState<string[]>([]);
  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());


  const colors = [
    "#000000",
    "#1E40AF",
    "#047857",
    "#B91C1C",
    "#6B21A8",
    "#374151",
    "#2563EB",
    "#059669",
    "#DC2626",
    "#7C3AED",
  ];

  useEffect(() => {
    if (editorRef.current) {
      if (value === "") {
        editorRef.current.innerHTML = "";
      } else if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = DOMPurify.sanitize(value);
      }
    }
  }, [value]);

  // Auto-close copy options popover after 5 seconds
  useEffect(() => {
    if (showCopyOptions) {
      const timer = setTimeout(() => {
        setShowCopyOptions(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showCopyOptions]);

  const saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range && editorRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const updateActiveStyles = () => {
  const styles = new Set<string>();
  
  const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
  
  commands.forEach(cmd => {
    if (document.queryCommandState(cmd)) {
      styles.add(cmd);
    }
  });
  
  setActiveStyles(styles);
};

  // const execCommand = (command: string, value: string = "") => {
  //   if (styleSet.includes(command)) {
  //       setStyleSet(prev => prev.filter(cmd => cmd !== command));
      
  //   } else {
  //     console.log("add executed");
  //      if(command.includes("justify")){
  //       setStyleSet(prev => prev.filter(cmd => !cmd.includes("justify")))
  //     }
  //     setStyleSet(prev => [...prev, command]);
  //   }
  //   console.log("exceCommad", command)
  //   const savedSelection = saveCurrentSelection();
  //   editorRef.current?.focus();
  //   restoreSelection(savedSelection);




  //   document.execCommand(command, false, value);

  //   if (editorRef.current) {
  //     const html = editorRef.current.innerHTML;
  //     onChange(html);
  //     editorRef.current.focus();
  //   }
  // };

  const execCommand = (command: string, value: string = "") => {
  editorRef.current?.focus();
  document.execCommand(command, false, value);

  if (editorRef.current) {
    onChange(editorRef.current.innerHTML);
  }
  
  // Update UI state to match DOM
  updateActiveStyles();
};


useEffect(() => {
  const handleSelectionChange = () => {
    if (editorRef.current?.contains(document.getSelection()?.anchorNode || null)) {
      updateActiveStyles();
    }
  };

  document.addEventListener('selectionchange', handleSelectionChange);
  return () => document.removeEventListener('selectionchange', handleSelectionChange);
}, []);

  // console.log("styleSet", styleSet)

  const handleList = (type: "insertUnorderedList" | "insertOrderedList") => {
    execCommand(type);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      execCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleFormatBlock = (tag: string) => {
    // Remove any existing format block first
    execCommand("formatBlock", "div");
    // Then apply the new format
    execCommand("formatBlock", tag);
  };

  // Copy content as plain text
  const copyAsPlainText = () => {
    if (!value.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please fill job description</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    } else {
      if (editorRef.current) {
        const plainText = editorRef.current.innerText;
        navigator.clipboard.writeText(plainText).then(
          () => {
            setShowCopyOptions(false);
            dispatchToast(
              <FluentProvider style={{ background: "transparent" }}>
                <Toast>
                  <ToastTitle>Plain text copied to clipboard</ToastTitle>
                </Toast>
              </FluentProvider>,
              { intent: "success" }
            );
          },
          (err) => {
            console.error("Could not copy text: ", err);
            dispatchToast(
              <Toast>
                <ToastTitle>Failed to copy text</ToastTitle>
              </Toast>,
              { intent: "error" }
            );
          }
        );
      }
    }
  };

  // Copy content as formatted HTML
  const copyAsFormatted = () => {
    if (!value.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please fill job description</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    } else {
      if (editorRef.current) {
        const htmlContent = editorRef.current.innerHTML;
        navigator.clipboard.writeText(htmlContent).then(
          () => {
            setShowCopyOptions(false);
            dispatchToast(
              <Toast>
                <ToastTitle>Formatted HTML copied to clipboard</ToastTitle>
              </Toast>,
              { intent: "success" }
            );
          },
          (err) => {
            console.error("Could not copy HTML: ", err);
            dispatchToast(
              <Toast>
                <ToastTitle>Failed to copy HTML</ToastTitle>
              </Toast>,
              { intent: "error" }
            );
          }
        );
      }
    }
  };

  // Handle AI generation with dialog
  const handleGenerateClick = async () => {
    generateDescription();
  };

  // Handle Update JD button click
  const handleUpdateJDClick = () => {
    if (!value.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Please fill all required fields before suggesting job description
          </ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    } else {
      setShowUpdateJDDialog(true);
    }
  };

  // Handle Update JD confirmation
  const handleUpdateJDConfirm = async () => {
    if (!onUpdateJD) {
      console.error("onUpdateJD callback not provided");
      return;
    }

    setIsUpdatingJD(true);
    try {
      await onUpdateJD(value);
      setShowUpdateJDDialog(false);
      dispatchToast(
        <Toast>
          <ToastTitle>Job description updated successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error updating job description:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to update job description</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsUpdatingJD(false);
    }
  };

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="p-2 border-b rounded-t-md bg-[#e8e8e8] bg-opacity-10 backdrop-blur-md flex flex-wrap gap-1 items-center">
        {/* Text Style Controls */}
        <div className="flex gap-1">
          <div className={`p-1 rounded-lg ${activeStyles.has("bold") ? "!bg-white" : "!bg-transparent"}`}>
            <Tooltip content="Bold" relationship="label">
              <Button
                icon={<TextBold20Regular />}
                appearance="subtle"
                onClick={() => execCommand("bold")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
          <div className={`p-1 rounded-lg ${activeStyles.has("italic") ? "!bg-white" : "!bg-transparent"}`}>
            <Tooltip content="Italic" relationship="label">
              <Button
                icon={<TextItalic20Regular />}
                appearance="subtle"
                onClick={() => execCommand("italic")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
          <div className={`p-1 rounded-lg ${activeStyles.has("underline") ? "!bg-white" : "!bg-transparent"}`}>
            <Tooltip content="Underline" relationship="label">
              <Button
                icon={<TextUnderline20Regular />}
                appearance="subtle"
                onClick={() => execCommand("underline")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
        </div>

        <Divider vertical className="h-6 min-w-[19px] max-w-[20px]" />

        {/* Alignment Controls */}
        <div className="flex gap-1">
          <div className={`p-1 rounded-lg ${activeStyles.has("justifyLeft") ? "!bg-white" : "!bg-transparent"}`}>
            <Tooltip content="Left Align" relationship="label">
              <Button
                icon={<TextAlignLeft20Regular />}
                appearance="subtle"
                onClick={() => execCommand("justifyLeft")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
          <div className={`p-1 rounded-lg ${activeStyles.has("justifyCenter") ? "!bg-white" : "!bg-transparent"}`}>
            <Tooltip content="Center Align" relationship="label">
              <Button
                icon={<TextAlignCenter20Regular />}
                appearance="subtle"
                onClick={() => execCommand("justifyCenter")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
          <div className={`p-1 rounded-lg ${activeStyles.has("justifyRight") ? "!bg-white" : "!bg-transparent"}`}>

            <Tooltip content="Right Align" relationship="label">
              <Button
                icon={<TextAlignRight20Regular />}
                appearance="subtle"
                onClick={() => execCommand("justifyRight")}
                disabled={disabled}
              />
            </Tooltip>
          </div>
        </div>

        <Divider vertical className="h-6 min-w-[19px] max-w-[20px]" />

        {/* Font and Color Controls */}
        <div className="flex gap-1">
          <Popover
            open={showColorPicker}
            onOpenChange={(e, data) => setShowColorPicker(data.open)}
          >
            <PopoverTrigger>
              <Tooltip content="Text Color" relationship="label">
                <Button
                  icon={<TextColor20Regular />}
                  appearance="subtle"
                  onClick={() => {
                    const selection = saveCurrentSelection();
                    setShowColorPicker(true);
                    setTimeout(() => restoreSelection(selection), 0);
                  }}
                  disabled={disabled}
                />
              </Tooltip>
            </PopoverTrigger>
            <PopoverSurface className="p-2">
              <div className="grid grid-cols-5 gap-1">
                {colors.map((color) => (
                  <Button
                    key={color}
                    appearance="subtle"
                    className="w-6 h-6"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      execCommand("foreColor", color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            </PopoverSurface>
          </Popover>
        </div>

        {/* History Controls */}
        <div className="flex gap-1">
          <Tooltip content="Undo" relationship="label">
            <Button
              icon={<ArrowUndo20Regular />}
              appearance="subtle"
              onClick={() => execCommand("undo")}
              disabled={disabled}
            />
          </Tooltip>
          <Tooltip content="Redo" relationship="label">
            <Button
              icon={<ArrowRedo20Regular />}
              appearance="subtle"
              onClick={() => execCommand("redo")}
              disabled={disabled}
            />
          </Tooltip>
        </div>

        <Divider vertical className="h-6" />

        {/* Copy to Clipboard Popover */}
        <Popover
          withArrow
          open={showCopyOptions}
          onOpenChange={(e, data) => setShowCopyOptions(data.open)}
        >
          <PopoverTrigger>
            <Tooltip content="Copy to Clipboard" relationship="label">
              <Button
                icon={<Copy20Regular />}
                appearance="subtle"
                onClick={() => setShowCopyOptions(true)}
                disabled={disabled}
              />
            </Tooltip>
          </PopoverTrigger>
          <PopoverSurface className="flex flex-col gap-2 font-normal">
            <Button onClick={copyAsPlainText}>Copy as Plain Text</Button>
            <Button onClick={copyAsFormatted}>Copy as Formatted HTML</Button>
          </PopoverSurface>
        </Popover>

        {/* Update JD Button */}
        <Tooltip content="Suggest JD" relationship="label">
          <Button
            style={{ backgroundColor: '#fff', borderRadius: '30px' }}
            icon={
              isUpdatingJD ? <Spinner size="tiny" /> : <DocumentEditRegular />
            }
            appearance="subtle"
            onClick={handleUpdateJDClick}
            disabled={isUpdatingJD || disabled}
          >
            {isUpdatingJD ? "Updating..." : "Suggest JD"}
          </Button>
        </Tooltip>

        <Divider vertical className="h-6 min-w-[19px] max-w-[20px]" />

        {/* AI Generate */}
        <Tooltip content="AI generate" relationship="label">
          <Button
            icon={
              loading ? null : <FlashSparkleFilled primaryFill={"#0066ff"} />
            }
            appearance="subtle"
            onClick={handleGenerateClick}
            className=" !outline-gradient-to-r !from-[#0066ff] !to-[#ff0501] !rounded-[30px]"
            disabled={disabled || loading}
          >
            {loading ? (
              <Spinner size="tiny" />
            ) : (
              <div className="!bg-gradient-to-r from-[#0066ff] to-[#ff0501] !bg-clip-text !text-transparent ">
                Generate
              </div>
            )}
          </Button>
        </Tooltip>
      </div>

      <style>
        {`
          [contenteditable=true]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}
      </style>

      <div
        ref={editorRef}
        className="p-4 h-64 overflow-auto focus:outline-none border-1 border-gray-300 rounded-b-md relative whitespace-pre-wrap max-w-[100vw]"
        contentEditable={disabled ? false : true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        data-placeholder={placeholder}
        aria-disabled={disabled}
      />

      {/* Update JD Confirmation Dialog */}
      <UpdateJDConfirmDialog
        isOpen={showUpdateJDDialog}
        onOpenChange={setShowUpdateJDDialog}
        isLoading={isUpdatingJD}
        onConfirm={handleUpdateJDConfirm}
        editorContent={value}
      />

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default AdvancedEditor;

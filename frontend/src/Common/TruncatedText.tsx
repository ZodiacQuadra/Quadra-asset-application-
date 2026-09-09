import { Tooltip, Text } from "@fluentui/react-components";
import { useThemedMountNode } from "./useThemedMountNode";

interface TruncatedTextProps {
  text: string | null | undefined;
  fallback?: string;
  weight?: "regular" | "medium" | "semibold" | "bold";
  size?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000;
  color?: string;
  maxWidth?: string | number;
  block?: boolean;
  style?: React.CSSProperties;
}

// Single-line ellipsis with the full text available on hover via a tooltip —
// drop-in replacement for a plain <Text> anywhere the value can be long
// enough to overflow or misalign a card/table (asset names, descriptions,
// emails, category/status labels). Renders nothing special (no tooltip
// wrapper needed visually) when there's no text at all.
//
// Tooltip uses the same position:fixed popup positioning as Dropdown/Popover
// — without an explicit mountNode targeting a themed node outside any
// transformed ancestor, its surface can end up stretched to cover the whole
// page for a frame on hover (seen as a "white page flash"). useThemedMountNode
// is the same fix already used for Dropdowns inside Dialogs elsewhere in this
// app; every TruncatedText gets its own, so this is safe to use anywhere.
const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  fallback = "—",
  weight,
  size,
  color,
  maxWidth,
  block = true,
  style,
}) => {
  const { mountNode, portal } = useThemedMountNode();
  const value = text && text.trim().length > 0 ? text : fallback;
  return (
    <>
      <Tooltip content={value} relationship="label" withArrow mountNode={mountNode}>
        <Text
          weight={weight}
          size={size}
          block={block}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: maxWidth ?? "100%",
            color,
            cursor: "default",
            ...style,
          }}
        >
          {value}
        </Text>
      </Tooltip>
      {portal}
    </>
  );
};

export default TruncatedText;

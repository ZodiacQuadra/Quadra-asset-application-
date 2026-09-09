import { useEffect, useState } from "react";
import { Button, Combobox, Option, Persona, Spinner, Text } from "@fluentui/react-components";
import { DismissRegular, ArrowExitRegular } from "@fluentui/react-icons";
import { getAllEntraUsers, EntraADUser } from "../../Services/EntraADUserService";

export interface CurrentAssignment {
  userId: string;
  name: string;
  department: string | null;
}

interface AssetAssignSectionProps {
  currentAssignment: CurrentAssignment | null;
  pendingUserId: string | null;
  pendingUserName: string | null;
  onSelectPending: (userId: string, name: string) => void;
  onClearPending: () => void;
  onReturn: () => Promise<void>;
  mountNode: HTMLElement | null;
}

// Searches dbo.EntraADUsers (the app's own synced directory) rather than a
// live Microsoft Graph lookup — AssetItemsUserMapping.UserID has a foreign
// key to that table, so only users already synced there can be assigned.
const AssetAssignSection: React.FC<AssetAssignSectionProps> = ({
  currentAssignment,
  pendingUserId,
  pendingUserName,
  onSelectPending,
  onClearPending,
  onReturn,
  mountNode,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntraADUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getAllEntraUsers(1, 8, query);
        if (res.success && res.data?.users) {
          setResults(res.data.users);
          setIsOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handleReturn = async () => {
    setReturning(true);
    setError(null);
    try {
      await onReturn();
    } catch (err: any) {
      setError(err?.message || "Failed to return asset.");
    } finally {
      setReturning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Text weight="semibold">Assign Employee</Text>

      {currentAssignment ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            border: "1px solid var(--colorNeutralStroke2)",
            borderRadius: "6px",
          }}
        >
          <Persona name={currentAssignment.name} secondaryText={currentAssignment.department ?? undefined} />
          <div style={{ flex: 1 }} />
          <Button
            appearance="subtle"
            size="small"
            icon={returning ? <Spinner size="tiny" /> : <ArrowExitRegular />}
            disabled={returning}
            onClick={handleReturn}
          >
            Return
          </Button>
        </div>
      ) : pendingUserId && pendingUserName ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            border: "1px dashed var(--colorNeutralStroke2)",
            borderRadius: "6px",
          }}
        >
          <Persona name={pendingUserName} />
          <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
            pending
          </Text>
          <div style={{ flex: 1 }} />
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissRegular />}
            onClick={onClearPending}
            aria-label="Clear selection"
          />
        </div>
      ) : (
        <Combobox
          placeholder="Search employee by name or email... (optional)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          open={isOpen}
          onOpenChange={(_, data) => setIsOpen(data.open)}
          mountNode={mountNode}
          onOptionSelect={(_, data) => {
            const user = results.find((u) => u.ID === data.optionValue);
            if (user) {
              onSelectPending(user.ID, user.DisplayName);
              setQuery("");
              setIsOpen(false);
            }
          }}
        >
          {loading ? (
            <Option key="loading" value="" disabled text="Searching...">
              Searching...
            </Option>
          ) : results.length === 0 ? (
            <Option key="empty" value="" disabled text="No results">
              {query.length < 2 ? "Type at least 2 characters to search" : "No users found"}
            </Option>
          ) : (
            results.map((u) => (
              <Option key={u.ID} value={u.ID} text={u.DisplayName}>
                <Persona name={u.DisplayName} secondaryText={u.Mail} />
              </Option>
            ))
          )}
        </Combobox>
      )}

      {error && (
        <Text size={200} style={{ color: "var(--colorPaletteRedForeground1)" }}>
          {error}
        </Text>
      )}
    </div>
  );
};

export default AssetAssignSection;

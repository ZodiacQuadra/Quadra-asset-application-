import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dropdown,
  Option,
  Input,
  Button,
  Badge,
  Spinner,
} from "@fluentui/react-components";
import TruncatedText from "../../Common/TruncatedText";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { AssetHandoverRequestItem, HANDOVER_ITEM_STATUS_OPTIONS, HandoverItemStatus } from "../Services/AssetHandoverRequestService";

const STATUS_COLOR: Record<HandoverItemStatus, "warning" | "success" | "danger" | "informative" | "subtle"> = {
  Pending: "warning",
  "Good condition": "success",
  Damaged: "danger",
  "Not Applicable": "subtle",
  Removed: "informative",
  Collected: "success",
};

interface HandoverItemsTableProps {
  items: AssetHandoverRequestItem[];
  disabled?: boolean;
  onActionItem: (itemId: string, status: Exclude<HandoverItemStatus, "Pending">, remarks: string) => Promise<void>;
}

const HandoverItemsTable: React.FC<HandoverItemsTableProps> = ({ items, disabled, onActionItem }) => {
  const [draftStatus, setDraftStatus] = useState<Record<string, Exclude<HandoverItemStatus, "Pending"> | "">>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const { mountNode, portal } = useThemedMountNode();

  const handleSave = async (item: AssetHandoverRequestItem) => {
    const status = draftStatus[item.ID] || (item.Status !== "Pending" ? item.Status : undefined);
    if (!status) return;
    setSavingId(item.ID);
    try {
      await onActionItem(item.ID, status as Exclude<HandoverItemStatus, "Pending">, draftRemarks[item.ID] ?? item.Remarks ?? "");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
    <Table size="small">
      <TableHeader>
        <TableRow>
          <TableHeaderCell style={{ width: "30%" }}>Asset</TableHeaderCell>
          <TableHeaderCell style={{ width: "22%" }}>Status</TableHeaderCell>
          <TableHeaderCell style={{ width: "32%" }}>Remarks</TableHeaderCell>
          <TableHeaderCell style={{ width: "16%" }}>Action</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const currentStatus = draftStatus[item.ID] ?? (item.Status !== "Pending" ? item.Status : "");
          return (
            <TableRow key={item.ID}>
              <TableCell>
                <TruncatedText text={item.AssetName} weight="semibold" size={200} />
                <TruncatedText text={item.AssetTagID} size={100} color="#605E5C" />
              </TableCell>
              <TableCell>
                <Dropdown
                  placeholder="Select status"
                  value={currentStatus}
                  selectedOptions={currentStatus ? [currentStatus] : []}
                  disabled={disabled}
                  mountNode={mountNode}
                  onOptionSelect={(_, data) =>
                    setDraftStatus((prev) => ({ ...prev, [item.ID]: (data.optionValue as Exclude<HandoverItemStatus, "Pending">) || "" }))
                  }
                  style={{ minWidth: "150px" }}
                >
                  {HANDOVER_ITEM_STATUS_OPTIONS.map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Dropdown>
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Optional remarks"
                  disabled={disabled}
                  value={draftRemarks[item.ID] ?? item.Remarks ?? ""}
                  onChange={(_, data) => setDraftRemarks((prev) => ({ ...prev, [item.ID]: data.value }))}
                  style={{ width: "100%" }}
                />
              </TableCell>
              <TableCell>
                {item.Status !== "Pending" && !draftStatus[item.ID] ? (
                  <Badge appearance="tint" color={STATUS_COLOR[item.Status]}>
                    {item.Status}
                  </Badge>
                ) : (
                  <Button
                    size="small"
                    appearance="primary"
                    disabled={disabled || !currentStatus || savingId === item.ID}
                    onClick={() => handleSave(item)}
                  >
                    {savingId === item.ID ? <Spinner size="tiny" /> : "Save"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    {portal}
    </>
  );
};

export default HandoverItemsTable;

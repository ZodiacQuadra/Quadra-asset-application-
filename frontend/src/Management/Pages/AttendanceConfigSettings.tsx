import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Spinner,
  Input,
  Text,
  Caption1,
  FluentProvider,
  teamsLightTheme,
  Card,
} from "@fluentui/react-components";
import {
  EditRegular,
  CheckmarkRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
  AttendanceConfigSetting,
  getAttendanceConfigSettings,
  updateAttendanceConfigValue,
} from "../../Services/AttendanceConfigService";
import { useId } from "@fluentui/react-components";

const AttendanceConfigSettings: React.FC = () => {
  const { accessToken, currentUser } = useAuth();
  const toasterId = useId("attendance-config-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [settings, setSettings] = useState<AttendanceConfigSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await getAttendanceConfigSettings(accessToken);
      setSettings(data || []);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>Failed to load configuration settings</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [accessToken]);

  const handleEdit = (setting: AttendanceConfigSetting) => {
    setEditingId(setting.ID);
    setEditValue(setting.Value ?? "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async (id: any) => {
    if (!accessToken) return;
    try {
      setSaving(true);
      await updateAttendanceConfigValue(
        id,
        editValue,
        accessToken,
        currentUser?.userID 
      );
      setSettings((prev) =>
        prev.map((s) =>
          s.ID === id
            ? { ...s, Value: editValue, ModifiedAt: new Date().toISOString() }
            : s
        )
      );
      setEditingId(null);
      setEditValue("");
      dispatchToast(
        <Toast>
          <ToastTitle>Success</ToastTitle>
          <ToastBody>Configuration updated successfully</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>Failed to update configuration</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <FluentProvider style={{ backgroundColor: "transparent" }}>
      <Toaster toasterId={toasterId} position="top-end" />
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Body1Strong style={{ fontSize: "18px" }}>
            Attendance Configuration Settings
          </Body1Strong>
          <br />
          <Caption1 style={{ color: "#616161" }}>
            Manage system-level attendance configuration values
          </Caption1>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <Spinner label="Loading configurations..." />
          </div>
        ) : settings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#616161" }}>
            <Text>No active configuration settings found.</Text>
          </div>
        ) : (
          <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
            <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                  <TableRow className="border-b-2 border-gray-100">
                    <TableHeaderCell className="!py-3 !px-6" style={{ width: "35%" }}>
                      <Body1Strong className="text-gray-900">Configuration Name</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-3 !px-6" style={{ width: "35%" }}>
                      <Body1Strong className="text-gray-900">Value</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-3 !px-6" style={{ width: "20%" }}>
                      <Body1Strong className="text-gray-900">Last Modified</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-3 !px-6" style={{ width: "10%" }} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting, index) => (
                    <TableRow
                      key={setting.ID}
                      className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      <TableCell className="px-6 py-4">
                        <Text weight="semibold" className="text-gray-800">
                          {setting.ConfigurationName}
                        </Text>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {editingId === setting.ID ? (
                          <Input
                            value={editValue}
                            onChange={(_, d) => setEditValue(d.value)}
                            style={{ width: "100%" }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(setting.ID);
                              if (e.key === "Escape") handleCancel();
                            }}
                          />
                        ) : (
                          <Text className="text-gray-700">{setting.Value ?? "—"}</Text>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Caption1 className="text-gray-500">
                          {formatDate(setting.ModifiedAt)}
                        </Caption1>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {editingId === setting.ID ? (
                          <div className="flex items-center gap-1">
                            <Button
                              icon={<CheckmarkRegular />}
                              appearance="primary"
                              size="small"
                              onClick={() => handleSave(setting.ID)}
                              disabled={saving}
                            />
                            <Button
                              icon={<DismissRegular />}
                              appearance="subtle"
                              size="small"
                              onClick={handleCancel}
                              disabled={saving}
                            />
                          </div>
                        ) : (
                          <Button
                            icon={<EditRegular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => handleEdit(setting)}
                            className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                            title="Edit configuration"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
              <Caption1 className="text-gray-600 font-medium px-4">
                Showing {settings.length} configuration{settings.length !== 1 ? "s" : ""}
              </Caption1>
            </div>
          </Card>
        )}
      </div>
    </FluentProvider>
  );
};

export default AttendanceConfigSettings;

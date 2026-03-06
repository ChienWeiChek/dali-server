import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  useControllerInfo,
  useMqttStatus,
  updateMqttSettings,
} from "../hooks/useMqttSettings";
import { useToast } from "./ToastProvider";

interface MqttSettingsCardProps {
  controller: string;
}

export default function MqttSettingsCard({ controller }: MqttSettingsCardProps) {
  const { info, loading: infoLoading } = useControllerInfo(controller);
  const { status, loading: statusLoading, refresh } = useMqttStatus(controller);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    brokerAddress: "",
    port: "",
    username: "",
    password: "",
  });

  // Update form when status loads
  useEffect(() => {
    if (status) {
      setFormData({
        brokerAddress: status.brokerAddress,
        port: status.port.toString(),
        username: status.username,
        password: "",
      });
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateMqttSettings(controller, {
        brokerAddress: formData.brokerAddress,
        port: formData.port,
        username: formData.username,
        ...(formData.password && { password: formData.password }),
      });

      showToast("MQTT settings updated successfully", "success");
      setFormData({ ...formData, password: "" });
      refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update MQTT settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const loading = infoLoading || statusLoading;

  return (
    <Card>
      <CardHeader
        title="📡 MQTT Connection Settings"
        action={
          status && (
            <Chip
              label={status.connected ? "Connected" : "Disconnected"}
              color={status.connected ? "success" : "error"}
              size="small"
            />
          )
        }
      />
      <CardContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Controller Info */}
            {info && (
              <Box sx={{ mb: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Controller Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Title: {info.title}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Serial: {info.serial}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      DALI Serial: {info.daliSerial}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Version: {info.deviceVersion}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      MAC Address: {info.macAddress}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Client ID */}
            {status && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Client ID: {status.clientId}
                </Typography>
              </Box>
            )}

            {/* MQTT Settings Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Broker Address"
                    value={formData.brokerAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, brokerAddress: e.target.value })
                    }
                    required
                    disabled={saving}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Port"
                    type="number"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                    required
                    disabled={saving}
                    inputProps={{ min: 1, max: 65535 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    disabled={saving}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={status?.passwordExist ? "••••••••" : ""}
                    disabled={saving}
                    helperText={
                      status?.passwordExist
                        ? "Leave blank to keep current password"
                        : ""
                    }
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving && <CircularProgress size={20} />}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}

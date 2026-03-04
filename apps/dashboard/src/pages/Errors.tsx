import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  DeviceHub as DeviceHubIcon,
} from "@mui/icons-material";
import useSWR from "swr";
import { apiFetch } from "../lib/apiClient";

interface ErrorDevice {
  guid: string;
  class: string;
  type: string;
  title: string;
  port: number;
  shortAddress: number;
  zone: string;
  zones: string[];
  gtin: string;
  serial: string;
  error: boolean;
  errorBits: number;
  errors: string[];
}

interface ErrorData {
  [controller: string]: ErrorDevice[];
}

const errorLabels: Record<string, string> = {
  errorLamp: "Lamp Error",
  errorPowerSupply: "Power Supply Error",
  errorOverTemperature: "Over Temperature",
  errorShortCircuit: "Short Circuit",
  errorOpenCircuit: "Open Circuit",
  errorControlGear: "Control Gear Error",
};

const getErrorLabel = (error: string): string => {
  return errorLabels[error] || error;
};

const getErrorColor = (errorCount: number): string => {
  if (errorCount === 0) return "#2e7d32";
  if (errorCount <= 2) return "#ed6c02";
  return "#d32f2f";
};

export default function Errors() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | false>(false);

  const { data, error, isLoading } = useSWR<ErrorData>(
    `/api/devices/error`,
    async () => {
      const res = await apiFetch(`/api/devices/error`);
      return res.ok
        ? res.json()
        : Promise.reject(new Error("Failed to fetch device errors"));
    }
  );

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleDeviceClick = (controller: string, guid: string) => {
    navigate(`/devices/${controller}/${guid}`);
  };

  // Calculate total error count
  const totalErrorDevices = data
    ? Object.values(data).reduce((total, devices) => total + devices.length, 0)
    : 0;

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load device errors. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <ErrorIcon sx={{ fontSize: 40, color: "#d32f2f" }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Device Errors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Devices with errors grouped by controller
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <Card sx={{ bgcolor: totalErrorDevices > 0 ? "#d32f2f10" : "#2e7d3210" }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ErrorIcon sx={{ color: getErrorColor(totalErrorDevices) }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Devices with Errors
                    </Typography>
                    <Typography variant="h5" sx={{ color: getErrorColor(totalErrorDevices) }}>
                      {totalErrorDevices}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DeviceHubIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Controllers Affected
                    </Typography>
                    <Typography variant="h5">
                      {data ? Object.keys(data).length : 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon sx={{ color: "#ed6c02" }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Typography variant="h6" sx={{ color: totalErrorDevices > 0 ? "#d32f2f" : "#2e7d32" }}>
                      {totalErrorDevices > 0 ? "Attention Required" : "All Clear"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* No Errors State */}
      {totalErrorDevices === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 80, color: "#2e7d32", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Device Errors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            All devices are operating normally.
          </Typography>
        </Paper>
      )}

      {/* Error Devices by Controller */}
      {data && totalErrorDevices > 0 && (
        <Box>
          {Object.entries(data).map(([controller, devices]) => (
            <Accordion
              key={controller}
              expanded={expanded === controller}
              onChange={handleAccordionChange(controller)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  bgcolor: "#f5f5f5",
                  "&:hover": { bgcolor: "#eeeeee" },
                }}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <DeviceHubIcon color="primary" />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {controller}
                  </Typography>
                  <Chip
                    label={`${devices.length} device${devices.length !== 1 ? "s" : ""}`}
                    color="error"
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {devices.map((device) => (
                    <Grid item xs={12} sm={6} md={4} key={device.guid}>
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: 4,
                          },
                          border: "1px solid",
                          borderColor: "#d32f2f40",
                        }}
                        onClick={() => handleDeviceClick(controller, device.guid)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                            <ErrorIcon sx={{ color: "#d32f2f", mt: 0.5 }} />
                            <Box flex={1}>
                              <Typography variant="h6" gutterBottom>
                                {device.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {device.type} • Address: {device.shortAddress}
                              </Typography>
                            </Box>
                          </Box>

                          {device.zone && (
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {device.zone}
                              </Typography>
                            </Box>
                          )}

                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              Errors ({device.errors.length}):
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {device.errors.map((error, index) => (
                                <Chip
                                  key={index}
                                  label={getErrorLabel(error)}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>

                          <Box mt={2} pt={2} borderTop="1px solid #e0e0e0">
                            <Typography variant="caption" color="text.secondary">
                              Serial: {device.serial}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
}

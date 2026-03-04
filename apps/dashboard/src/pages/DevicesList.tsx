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
  DeviceHub as DeviceHubIcon,
  Devices as DevicesIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { useDevices } from "../hooks/useDevices";
import { Device } from "../types/dashboard";

export default function DevicesPage() {
  const navigate = useNavigate();
  const { liveDevices: devices, loading, error } = useDevices();
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleDeviceClick = (controller: string, guid: string) => {
    navigate(`/devices/${controller}/${guid}`);
  };

  // Calculate total device count
  const totalDevices = devices
    ? Object.values(devices).reduce<number>(
        (total, deviceList) => total + (Array.isArray(deviceList) ? deviceList.length : 0),
        0
      )
    : 0;

  if (loading) {
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
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DevicesIcon sx={{ fontSize: 40, color: "#1976d2" }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              DALI Devices
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All devices grouped by controller and zone
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <Card sx={{ bgcolor: "#1976d210" }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DevicesIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Devices
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {totalDevices}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <DeviceHubIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Controllers
                    </Typography>
                    <Typography variant="h5">
                      {devices ? Object.keys(devices).length : 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* No Devices State */}
      {totalDevices === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <DevicesIcon sx={{ fontSize: 80, color: "#9e9e9e", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Devices Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No DALI devices are currently available.
          </Typography>
        </Paper>
      )}

      {/* Devices by Controller */}
      {devices && totalDevices > 0 && (
        <Box>
          {Object.keys(devices).map((controller) => {
            const groupedDevices = (devices[controller] as Device[])?.reduce<
              Record<string, Device[]>
            >((acc: Record<string, Device[]>, device: Device) => {
              const zoneKey = device.zones?.length
                ? device.zones.join(", ")
                : "Unassigned";
              if (!acc[zoneKey]) acc[zoneKey] = [];
              acc[zoneKey].push(device);
              return acc;
            }, {});

            const deviceCount = (devices[controller] as Device[]).length;

            return (
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
                      label={`${deviceCount} device${deviceCount !== 1 ? "s" : ""}`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {Object.entries(groupedDevices).map(([zone, zoneDevices]) => (
                    <Box key={zone} mb={3}>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          {zone}
                        </Typography>
                        <Chip
                          label={zoneDevices.length}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Grid container spacing={2}>
                        {zoneDevices.map((device) => (
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
                                borderColor: "#1976d240",
                              }}
                              onClick={() => handleDeviceClick(controller, device.guid)}
                            >
                              <CardContent>
                                <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                                  <DevicesIcon sx={{ color: "#1976d2", mt: 0.5 }} />
                                  <Box flex={1}>
                                    <Typography variant="h6" gutterBottom>
                                      {device.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {device.type} • Address: {device.shortAddress}
                                    </Typography>
                                  </Box>
                                </Box>

                                <Box mt={2} pt={2} borderTop="1px solid #e0e0e0">
                                  <Typography variant="caption" color="text.secondary">
                                    Port: {device.port}
                                  </Typography>
                                  {device.gtin && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      GTIN: {device.gtin}
                                    </Typography>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Container>
  );
}

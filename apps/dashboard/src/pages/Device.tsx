import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Devices as DevicesIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { apiFetch } from "../lib/apiClient";
import PropertyValue from "../components/PropertyValue";

type DeviceDetail = {
  guid: string;
  title: string;
  port: number;
  shortAddress: number;
  type: string;
  gtin?: string;
  serial?: string;
  zones?: string[];
  properties: string[];
};

export default function DeviceDetailPage() {
  const { guid, controller } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const res = await apiFetch(`/api/devices/${controller}/${guid}`, {
          method: "GET",
        });
        if (!res.ok)
          throw new Error(`Failed to get device details (${res.status})`);
        const data = await res.json();
        setDevice(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load device information.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [guid, controller]);

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

  if (!device) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DevicesIcon sx={{ fontSize: 40, color: "#1976d2" }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {device.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip
                icon={<InfoIcon />}
                label={device.type}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`Address: ${device.shortAddress}`}
                variant="outlined"
              />
              <Chip
                label={`Port: ${device.port}`}
                variant="outlined"
              />
              {device.zones && device.zones.length > 0 && (
                <Chip
                  icon={<LocationIcon />}
                  label={device.zones.join(", ")}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Static Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <InfoIcon color="primary" />
                <Typography variant="h6">
                  Static Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    GUID
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {device.guid}
                  </Typography>
                </Box>
                {device.gtin && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      GTIN
                    </Typography>
                    <Typography variant="body2">
                      {device.gtin}
                    </Typography>
                  </Box>
                )}
                {device.serial && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Serial Number
                    </Typography>
                    <Typography variant="body2">
                      {device.serial}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Controller
                  </Typography>
                  <Typography variant="body2">
                    {controller}
                  </Typography>
                </Box>
                {device.zones && device.zones.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Zones
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {device.zones.map((zone, index) => (
                        <Chip
                          key={index}
                          label={zone}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Properties Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">
                  Live Properties
                </Typography>
                {device.properties && device.properties.length > 0 && (
                  <Chip
                    label={`${device.properties.length} properties`}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  flex: 1,
                  maxHeight: "calc(100vh - 400px)",
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {device.properties && device.properties.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1}>
                    {device.properties.map((prop) => (
                      <PropertyValue
                        key={prop}
                        guid={guid as string}
                        property={prop}
                        controller={controller as string}
                      />
                    ))}
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: 60, color: "#9e9e9e", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No properties available for this device
                    </Typography>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

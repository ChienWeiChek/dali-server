import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { useDevices } from "../hooks/useDevices";
import MqttSettingsCard from "../components/MqttSettingsCard";
import ProfileSchedulerCard from "../components/ProfileSchedulerCard";

export default function Settings() {
  const { liveDevices, loading } = useDevices();
  const [activeTab, setActiveTab] = useState(0);

  // Get list of controllers from liveDevices
  const controllers = Object.keys(liveDevices || {});

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (controllers.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No controllers found
        </Typography>
      </Container>
    );
  }

  const currentController = controllers[activeTab];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings - MQTT & Profile Configuration
      </Typography>

      {controllers.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            {controllers.map((controller) => (
              <Tab key={controller} label={controller} />
            ))}
          </Tabs>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <MqttSettingsCard controller={currentController} />
        <ProfileSchedulerCard controller={currentController} />
      </Box>
    </Container>
  );
}

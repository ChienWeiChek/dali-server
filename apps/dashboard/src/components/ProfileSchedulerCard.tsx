import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import {
  useProfiles,
  activateProfile,
  deactivateProfile,
} from "../hooks/useMqttSettings";
import { useToast } from "./ToastProvider";
import ProfileEditor from "./ProfileEditor";

interface ProfileSchedulerCardProps {
  controller: string;
}

export default function ProfileSchedulerCard({
  controller,
}: ProfileSchedulerCardProps) {
  const { profiles, activeProfiles, loading, refresh } =
    useProfiles(controller);
  const { showToast } = useToast();
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleToggleActive = async (
    profileName: string,
    isActive: boolean,
  ) => {
    setActionLoading(profileName);
    try {
      if (isActive) {
        await deactivateProfile(controller, profileName);
        showToast("Profile deactivated", "success");
      } else {
        await activateProfile(controller, profileName);
        showToast("Profile activated", "success");
      }
      refresh();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="📊 Property Scheduler Profiles"
          action={
            <Button variant="contained" size="small" disabled>
              + Create New Profile
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : profiles.length === 0 ? (
            <Box p={3}>
              <Box textAlign="center" color="text.secondary">
                No profiles found
              </Box>
            </Box>
          ) : (
            <List>
              {profiles.map((profileName) => {
                const isActive = activeProfiles.includes(profileName);
                const isLoading = actionLoading === profileName;

                return (
                  <ListItem
                    key={profileName}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemText
                      primary={profileName}
                      secondary={
                        <Chip
                          label={isActive ? "Active" : "Inactive"}
                          color={isActive ? "primary" : "default"}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => setEditingProfile(profileName)}
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleToggleActive(profileName, isActive)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <CircularProgress size={20} />
                        ) : isActive ? (
                          "Deactivate"
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {editingProfile && (
        <ProfileEditor
          controller={controller}
          profileName={editingProfile}
          open={!!editingProfile}
          onClose={() => {
            setEditingProfile(null);
            refresh();
          }}
        />
      )}
    </>
  );
}

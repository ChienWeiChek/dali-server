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
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  useProfiles,
  activateProfile,
  deactivateProfile,
  deleteProfile,
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
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

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

  const handleDeleteClick = (profileName: string, isActive: boolean) => {
    if (isActive) {
      showToast("Cannot delete active profile. Deactivate it first.", "error");
      return;
    }

    if (deletingProfile === profileName) {
      // Second click - confirm deletion
      handleDeleteProfile(profileName);
    } else {
      // First click - set to confirm state
      setDeletingProfile(profileName);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => {
        setDeletingProfile(null);
      }, 3000);
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    setActionLoading(profileName);
    setDeletingProfile(null);
    try {
      await deleteProfile(controller, profileName);
      showToast("Profile deleted successfully", "success");
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
            <Button
              variant="contained"
              size="small"
              onClick={() => setCreatingProfile(true)}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              + Create New Profile
            </Button>
          }
        />
        <CardContent>
          <Button
            variant="contained"
            size="small"
            onClick={() => setCreatingProfile(true)}
            fullWidth
            sx={{ display: { xs: "flex", sm: "none" }, mb: 2 }}
          >
            + Create New Profile
          </Button>
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
              {profiles
                .sort((a, b) => {
                  const aActive = activeProfiles.includes(a);
                  const bActive = activeProfiles.includes(b);
                  
                  // Sort by active status first (active profiles first)
                  if (aActive && !bActive) return -1;
                  if (!aActive && bActive) return 1;
                  
                  // Then sort alphabetically
                  return a.localeCompare(b);
                })
                .map((profileName) => {
                const isActive = activeProfiles.includes(profileName);
                const isLoading = actionLoading === profileName;
                const isDefaultProfile = profileName === "DeviceError";

                return (
                  <ListItem
                    key={profileName}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "stretch", sm: "center" },
                      justifyContent: { sm: "space-between" },
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: { xs: "space-between", sm: "flex-start" },
                        alignItems: "center",
                        gap: { sm: 2 },
                        mb: { xs: isDefaultProfile ? 0 : 1.5, sm: 0 },
                      }}
                    >
                      <Box sx={{ fontWeight: 500 }}>{profileName}</Box>
                      <Chip
                        label={isActive ? "Active" : "Inactive"}
                        color={isActive ? "primary" : "default"}
                        size="small"
                      />
                    </Box>
                    {!isDefaultProfile && (
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: { xs: "wrap", sm: "nowrap" },
                          "& > button": {
                            flex: { xs: "1 1 auto", sm: "0 0 auto" },
                            minWidth: { xs: "0", sm: "auto" },
                          }
                        }}
                      >
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
                        <Button
                          size="small"
                          color={deletingProfile === profileName ? "error" : "inherit"}
                          onClick={() => handleDeleteClick(profileName, isActive)}
                          disabled={isLoading}
                          startIcon={<DeleteIcon />}
                        >
                          {deletingProfile === profileName ? "Confirm" : "Delete"}
                        </Button>
                      </Box>
                    )}
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

      {creatingProfile && (
        <ProfileEditor
          controller={controller}
          profileName=""
          open={creatingProfile}
          isCreating={true}
          onClose={() => {
            setCreatingProfile(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

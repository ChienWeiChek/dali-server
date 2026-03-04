import { useEffect, useState } from "react";
import { useParams } from "react-router";
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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import {
  Groups as GroupsIcon,
  Lightbulb as LightbulbIcon,
  Info as InfoIcon,
  Tune as TuneIcon,
  TheaterComedy as TheaterComedyIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { apiFetch } from "../lib/apiClient";
import { useToast } from "../components/ToastProvider";
import LevelControl from "../components/LevelControl";
import TemperatureControl from "../components/TemperatureControl";
import RGBControl from "../components/RGBControl";
import RGBWControl from "../components/RGBWControl";

type Scene = {
  title: string;
  sceneNr: number;
};

type Group = {
  groupId: number;
  colorType: string;
  title: string;
  scenes?: Scene[];
};

type GroupState = {
  groupId: number;
  lightState: boolean;
  level?: number;
  levelDali?: number;
  scene?: string;
  sceneNr?: number;
  twMired?: number;
  twKelvin?: number;
  rgb?: number;
  red?: number;
  green?: number;
  blue?: number;
  white?: number;
};

type EditingState = {
  level: number;
  twKelvin: number;
  twMired: number;
  red: number;
  green: number;
  blue: number;
  white: number;
};

export default function GroupsPage() {
  const { controller } = useParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupState, setGroupState] = useState<GroupState | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { showToast } = useToast();

  // Fetch group list
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await apiFetch(`/api/groups/${controller}`, {
          method: "GET",
        });
        if (!res.ok) throw new Error(`Failed to load groups (${res.status})`);
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load groups.");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [controller]);

  const fetchGroupDetails = async (groupId: number) => {
    try {
      setError("");
      const res = await apiFetch(`/api/groups/${controller}/${groupId}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(`Failed to get group info (${res.status})`);
      const data = await res.json();
      setSelectedGroup(data);

      const stateRes = await apiFetch(
        `/api/groups/${controller}/${groupId}/state`,
        {
          method: "GET",
        },
      );
      if (!stateRes.ok) throw new Error("Failed to get group state");
      const stateData = await stateRes.json();
      setGroupState(stateData);

      // Initialize editing state with current values
      if (stateData) {
        setEditingState({
          level: stateData.level || 0,
          twKelvin: stateData.twKelvin || 4000,
          twMired:
            stateData.twMired ||
            Math.round(1000000 / (stateData.twKelvin || 4000)),
          red: stateData.red || 0,
          green: stateData.green || 0,
          blue: stateData.blue || 0,
          white: stateData.white || 0,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching group details.");
      showToast("Failed to fetch group details", "error");
    }
  };

  const recallScene = async (groupId: number, sceneNr: number) => {
    try {
      await apiFetch(`api/groups/${controller}/${groupId}/state`, {
        method: "PUT",
        body: JSON.stringify({ sceneNr }),
      });
      await fetchGroupDetails(groupId);
      showToast(`Scene recalled successfully`, "success");
    } catch (err) {
      console.error(err);
      setError("Failed to recall scene.");
      showToast("Failed to recall scene", "error");
    }
  };

  const updateGroupState = async () => {
    if (!selectedGroup || !editingState || !groupState) return;

    setIsApplying(true);
    try {
      const payload: Record<string, number> = {
        level: editingState.level,
      };

      // Add color-specific parameters based on colorType
      switch (selectedGroup.colorType) {
        case "tw":
          payload.twKelvin = editingState.twKelvin;
          payload.twMired = editingState.twMired;
          break;
        case "rgb":
          payload.red = editingState.red;
          payload.green = editingState.green;
          payload.blue = editingState.blue;
          // Calculate RGB decimal value
          payload.rgb =
            (editingState.red << 16) |
            (editingState.green << 8) |
            editingState.blue;
          break;
        case "rgbw":
          payload.red = editingState.red;
          payload.green = editingState.green;
          payload.blue = editingState.blue;
          payload.white = editingState.white;
          // Calculate RGB decimal value
          payload.rgb =
            (editingState.red << 16) |
            (editingState.green << 8) |
            editingState.blue;
          break;
        // For 'nothing' colorType, only level is sent
      }

      await apiFetch(`/api/bmsapi/groups/${selectedGroup.groupId}/state`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await fetchGroupDetails(selectedGroup.groupId);
      showToast("Custom values applied successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to apply custom values", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const resetEditingState = () => {
    if (groupState) {
      setEditingState({
        level: groupState.level || 0,
        twKelvin: groupState.twKelvin || 4000,
        twMired:
          groupState.twMired ||
          Math.round(1000000 / (groupState.twKelvin || 4000)),
        red: groupState.red || 0,
        green: groupState.green || 0,
        blue: groupState.blue || 0,
        white: groupState.white || 0,
      });
    }
  };

  const handleLevelChange = (level: number) => {
    if (editingState) {
      setEditingState({ ...editingState, level });
    }
  };

  const handleTemperatureChange = (kelvin: number, mired: number) => {
    if (editingState) {
      setEditingState({ ...editingState, twKelvin: kelvin, twMired: mired });
    }
  };

  const handleRGBChange = (red: number, green: number, blue: number) => {
    if (editingState) {
      setEditingState({ ...editingState, red, green, blue });
    }
  };

  const handleRGBWChange = (
    red: number,
    green: number,
    blue: number,
    white: number,
  ) => {
    if (editingState) {
      setEditingState({ ...editingState, red, green, blue, white });
    }
  };

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
          <GroupsIcon sx={{ fontSize: 40, color: "#1976d2" }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {controller} Light Groups
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control and manage light groups
            </Typography>
          </Box>
        </Box>

        {/* Summary Card */}
        <Card sx={{ bgcolor: "#1976d210" }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <GroupsIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Groups
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {groups.length}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LightbulbIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Selected Group
                    </Typography>
                    <Typography variant="h6">
                      {selectedGroup ? selectedGroup.title : "None"}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Available Groups List */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <GroupsIcon color="primary" />
                <Typography variant="h6">
                  Available Groups
                </Typography>
                <Chip
                  label={groups.length}
                  size="small"
                  color="primary"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  flex: 1,
                  maxHeight: "calc(100vh - 400px)",
                  overflowY: "auto",
                }}
              >
                {groups.length === 0 ? (
                  <Paper
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "#f5f5f5",
                    }}
                  >
                    <GroupsIcon sx={{ fontSize: 60, color: "#9e9e9e", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No groups available
                    </Typography>
                  </Paper>
                ) : (
                  <List disablePadding>
                    {groups.map((group) => (
                      <ListItem
                        key={group.groupId}
                        disablePadding
                        sx={{
                          borderBottom: "1px solid #e0e0e0",
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <ListItemButton
                          selected={selectedGroup?.groupId === group.groupId}
                          onClick={() => fetchGroupDetails(group.groupId)}
                          sx={{
                            "&.Mui-selected": {
                              bgcolor: "#1976d210",
                              "&:hover": {
                                bgcolor: "#1976d220",
                              },
                            },
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mr={2}>
                            <LightbulbIcon
                              sx={{
                                color: selectedGroup?.groupId === group.groupId
                                  ? "#1976d2"
                                  : "#9e9e9e",
                              }}
                            />
                          </Box>
                          <ListItemText
                            primary={group.title}
                            secondary={`Type: ${group.colorType}`}
                            primaryTypographyProps={{
                              fontWeight: selectedGroup?.groupId === group.groupId
                                ? "bold"
                                : "normal",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Group Details and Controls */}
        <Grid item xs={12} md={7}>
          {!selectedGroup ? (
            <Paper sx={{ p: 6, textAlign: "center" }}>
              <GroupsIcon sx={{ fontSize: 80, color: "#9e9e9e", mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Group Selected
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a group from the list to view details and controls
              </Typography>
            </Paper>
          ) : (
            <Card>
              <CardContent>
                {/* Group Header */}
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <LightbulbIcon color="primary" />
                  <Typography variant="h6">
                    {selectedGroup.title}
                  </Typography>
                  <Chip
                    label={selectedGroup.colorType}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />

                {/* Current State */}
                {groupState && (
                  <Card sx={{ mb: 3, bgcolor: "#f5f5f5" }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <InfoIcon color="action" />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Current State
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Light State
                          </Typography>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Chip
                              label={groupState.lightState ? "On" : "Off"}
                              size="small"
                              color={groupState.lightState ? "success" : "default"}
                            />
                          </Box>
                        </Grid>
                        {groupState.level !== undefined && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Level
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {groupState.level}%
                            </Typography>
                          </Grid>
                        )}
                        {groupState.scene && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Active Scene
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {groupState.scene}
                            </Typography>
                          </Grid>
                        )}
                        {groupState.twKelvin && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Color Temperature
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {groupState.twKelvin} K
                            </Typography>
                          </Grid>
                        )}
                        {groupState.rgb !== undefined && (
                          <Grid item xs={12} sm={8}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              RGB Values
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              R:{groupState.red} G:{groupState.green} B:{groupState.blue}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Scenes */}
                {selectedGroup.scenes && selectedGroup.scenes.length > 0 && (
                  <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <TheaterComedyIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Scenes
                      </Typography>
                      <Chip
                        label={selectedGroup.scenes.length}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedGroup.scenes.map((scene) => (
                        <Button
                          key={scene.sceneNr}
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() =>
                            recallScene(selectedGroup.groupId, scene.sceneNr)
                          }
                          sx={{
                            bgcolor: groupState?.sceneNr === scene.sceneNr
                              ? "#2e7d32"
                              : "#1976d2",
                            "&:hover": {
                              bgcolor: groupState?.sceneNr === scene.sceneNr
                                ? "#1b5e20"
                                : "#1565c0",
                            },
                          }}
                        >
                          {scene.title}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Custom Controls Section */}
                {groupState && editingState && (
                  <Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <TuneIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight="medium">
                        Custom Controls
                      </Typography>
                    </Box>

                    <Box display="flex" flexDirection="column" gap={3}>
                      {/* Level Control - Always visible */}
                      <Card variant="outlined">
                        <CardContent>
                          <LevelControl
                            level={editingState.level}
                            onChange={handleLevelChange}
                            disabled={isApplying}
                          />
                        </CardContent>
                      </Card>

                      {/* Color Type Specific Controls */}
                      {selectedGroup.colorType === "tw" && (
                        <Card variant="outlined">
                          <CardContent>
                            <TemperatureControl
                              kelvin={editingState.twKelvin}
                              mired={editingState.twMired}
                              onChange={handleTemperatureChange}
                              disabled={isApplying}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {selectedGroup.colorType === "rgb" && (
                        <Card variant="outlined">
                          <CardContent>
                            <RGBControl
                              red={editingState.red}
                              green={editingState.green}
                              blue={editingState.blue}
                              onChange={handleRGBChange}
                              disabled={isApplying}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {selectedGroup.colorType === "rgbw" && (
                        <Card variant="outlined">
                          <CardContent>
                            <RGBWControl
                              red={editingState.red}
                              green={editingState.green}
                              blue={editingState.blue}
                              white={editingState.white}
                              onChange={handleRGBWChange}
                              disabled={isApplying}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {/* Apply/Cancel Buttons */}
                      <Box display="flex" gap={2}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={isApplying ? <CircularProgress size={20} /> : <CheckIcon />}
                          onClick={updateGroupState}
                          disabled={isApplying}
                          fullWidth
                        >
                          {isApplying ? "Applying..." : "Apply Custom Values"}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={resetEditingState}
                          disabled={isApplying}
                        >
                          Reset
                        </Button>
                      </Box>

                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Changes are only sent to the device when you click "Apply Custom Values".
                        </Typography>
                        <Typography variant="caption" display="block">
                          Scenes will override custom values when recalled.
                        </Typography>
                      </Alert>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

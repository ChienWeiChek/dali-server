import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import {
  useProfileDetail,
  updateProfile,
} from "../hooks/useMqttSettings";
import { useToast } from "./ToastProvider";
import { PROPERTY_LABELS, AVAILABLE_PROPERTIES, ProfileItem } from "../types/mqtt";

interface ProfileEditorProps {
  controller: string;
  profileName: string;
  open: boolean;
  onClose: () => void;
}

export default function ProfileEditor({
  controller,
  profileName,
  open,
  onClose,
}: ProfileEditorProps) {
  const { profile, loading } = useProfileDetail(controller, profileName);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ProfileItem[]>([]);
  const [newProperty, setNewProperty] = useState("");
  const [newInterval, setNewInterval] = useState("60");

  useEffect(() => {
    if (profile) {
      setItems(profile.profileItems || []);
    }
  }, [profile]);

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!newProperty) {
      showToast("Please select a property", "error");
      return;
    }

    // Check if property already exists
    if (items.some((item) => item.property === newProperty)) {
      showToast("Property already exists in this profile", "error");
      return;
    }

    const interval = parseInt(newInterval);
    if (isNaN(interval) || interval < 1) {
      showToast("Interval must be a positive number", "error");
      return;
    }

    setItems([...items, { property: newProperty, interval }]);
    setNewProperty("");
    setNewInterval("60");
  };

  const handleUpdateInterval = (index: number, value: string) => {
    const interval = parseInt(value);
    if (isNaN(interval) || interval < 1) return;

    const newItems = [...items];
    newItems[index].interval = interval;
    setItems(newItems);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      showToast("Profile must have at least one property", "error");
      return;
    }

    setSaving(true);
    try {
      await updateProfile(controller, profileName, { profileItems: items });
      showToast("Profile updated successfully", "success");
      onClose();
    } catch (error: any) {
      showToast(error.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // Get available properties (not already in the list)
  const availableProperties = AVAILABLE_PROPERTIES.filter(
    (prop) => !items.some((item) => item.property === prop),
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Profile: {profileName}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Profile Name"
                value={profileName}
                disabled
                sx={{ mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box fontWeight="bold" mb={1}>
                Properties & Intervals
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Property</TableCell>
                      <TableCell width="150px">Interval (seconds)</TableCell>
                      <TableCell width="80px">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Box color="text.secondary" py={2}>
                            No properties configured
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {PROPERTY_LABELS[item.property] || item.property}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.interval}
                              onChange={(e) =>
                                handleUpdateInterval(index, e.target.value)
                              }
                              inputProps={{ min: 1, max: 86400 }}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(index)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box fontWeight="bold" mb={1}>
                Add New Property
              </Box>
              <Box display="flex" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Select Property</InputLabel>
                  <Select
                    value={newProperty}
                    onChange={(e) => setNewProperty(e.target.value)}
                    label="Select Property"
                    disabled={availableProperties.length === 0}
                  >
                    {availableProperties.map((prop) => (
                      <MenuItem key={prop} value={prop}>
                        {PROPERTY_LABELS[prop]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Interval (s)"
                  type="number"
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value)}
                  inputProps={{ min: 1, max: 86400 }}
                  sx={{ width: "150px" }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddItem}
                  startIcon={<AddIcon />}
                  disabled={availableProperties.length === 0}
                >
                  Add
                </Button>
              </Box>
              {availableProperties.length === 0 && (
                <Box color="text.secondary" fontSize="0.875rem" mt={1}>
                  All available properties have been added
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || loading}
          startIcon={saving && <CircularProgress size={20} />}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

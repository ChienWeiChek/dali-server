import { useEffect, useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { useToast } from "../components/ToastProvider";
import LevelControl from "../components/LevelControl";
import TemperatureControl from "../components/TemperatureControl";
import RGBControl from "../components/RGBControl";
import RGBWControl from "../components/RGBWControl";
import { useParams } from "react-router";

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
  }, []);

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
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading groups...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold mb-4 text-gray-800">
        {controller} Light Groups
      </h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-3 text-gray-800">
            Available Groups
          </h2>
          <div className="flex-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {groups.map((group) => (
              <button
                key={group.groupId}
                className={`w-full text-left p-3 border-b hover:bg-gray-100 ${
                  selectedGroup?.groupId === group.groupId ? "bg-gray-100" : ""
                }`}
                onClick={() => fetchGroupDetails(group.groupId)}
              >
                <p className="font-semibold text-gray-800">{group.title}</p>
                <p className="text-sm text-gray-500">Type: {group.colorType}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedGroup && (
          <div className="bg-white rounded shadow p-4 flex flex-col">
            <h2 className="text-lg font-bold mb-2 text-gray-800">
              {selectedGroup.title}
            </h2>

            {groupState && (
              <div className="mb-4 text-sm text-gray-700">
                <p>
                  <strong>Light State:</strong>{" "}
                  {groupState.lightState ? "On" : "Off"}
                </p>
                {groupState.level !== undefined && (
                  <p>
                    <strong>Level:</strong> {groupState.level}%
                  </p>
                )}
                {groupState.scene && (
                  <p>
                    <strong>Scene:</strong> {groupState.scene}
                  </p>
                )}
                {groupState.twKelvin && (
                  <p>
                    <strong>Color Temp:</strong> {groupState.twKelvin} K
                  </p>
                )}
                {groupState.rgb && (
                  <p>
                    <strong>RGB:</strong> R:{groupState.red} G:
                    {groupState.green} B:{groupState.blue}
                  </p>
                )}
              </div>
            )}

            {selectedGroup.scenes && selectedGroup.scenes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2 text-gray-700">Scenes</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.scenes.map((scene) => (
                    <button
                      key={scene.sceneNr}
                      onClick={() =>
                        recallScene(selectedGroup.groupId, scene.sceneNr)
                      }
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {scene.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Controls Section */}
            {groupState && editingState && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-700">
                  Custom Controls
                </h3>

                <div className="space-y-6">
                  {/* Level Control - Always visible */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <LevelControl
                      level={editingState.level}
                      onChange={handleLevelChange}
                      disabled={isApplying}
                    />
                  </div>

                  {/* Color Type Specific Controls */}
                  {selectedGroup.colorType === "tw" && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <TemperatureControl
                        kelvin={editingState.twKelvin}
                        mired={editingState.twMired}
                        onChange={handleTemperatureChange}
                        disabled={isApplying}
                      />
                    </div>
                  )}

                  {selectedGroup.colorType === "rgb" && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <RGBControl
                        red={editingState.red}
                        green={editingState.green}
                        blue={editingState.blue}
                        onChange={handleRGBChange}
                        disabled={isApplying}
                      />
                    </div>
                  )}

                  {selectedGroup.colorType === "rgbw" && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <RGBWControl
                        red={editingState.red}
                        green={editingState.green}
                        blue={editingState.blue}
                        white={editingState.white}
                        onChange={handleRGBWChange}
                        disabled={isApplying}
                      />
                    </div>
                  )}

                  {/* Apply/Cancel Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={updateGroupState}
                      disabled={isApplying}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                    >
                      {isApplying ? "Applying..." : "Apply Custom Values"}
                    </button>
                    <button
                      onClick={resetEditingState}
                      disabled={isApplying}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>
                      Note: Changes are only sent to the device when you click
                      "Apply Custom Values".
                    </p>
                    <p className="mt-1">
                      Scenes will override custom values when recalled.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

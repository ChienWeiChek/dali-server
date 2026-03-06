import { BrowserRouter, Routes, Route } from "react-router-dom";
import Devices from "./pages/DevicesList";
import Device from "./pages/Device";
import Dashboard from "./pages/Dashboard";
import Group from "./pages/Group";
import Errors from "./pages/Errors";
import Settings from "./pages/Settings";
import HealthCheck from "./pages/HealthCheck";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import ClientLayout from "./components/ClientLayout";

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<ClientLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/devices/:controller/:guid" element={<Device />} />
            <Route path="/groups/:controller" element={<Group/>} />
            <Route path="/errors" element={<Errors />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/health" element={<HealthCheck />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

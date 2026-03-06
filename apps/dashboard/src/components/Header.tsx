import { light } from "@mui/material/styles/createPalette";
import { useDevices } from "../hooks/useDevices";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router";
import { NavLink } from "react-router-dom";
import HealthIndicator from "./HealthIndicator";

export default function Header() {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGroupsDropdownOpen, setIsGroupsDropdownOpen] = useState(false);
  const [isMobileGroupsOpen, setIsMobileGroupsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Initialize current profile directly since getCurrentProfile() is synchronous
  const { liveDevices, loading } = useDevices();

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Devices", href: "/devices" },
    { name: "Groups", href: "/groups" },
    { name: "Errors", href: "/errors" },
    { name: "Settings", href: "/settings" },
  ];

  const groupsSubMenu = [
    { name: "All Groups", href: "/groups" },
    { name: "Create Group", href: "/groups/create" },
    { name: "Manage Groups", href: "/groups/manage" },
  ];

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsGroupsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsGroupsDropdownOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand and Health Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">DALI IoT</h1>
                <p className="text-xs text-gray-500">Light Control System</p>
              </div>
            </div>
            
            {/* Health Indicator - visible on all screen sizes */}
            <HealthIndicator />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              if (item.name === "Groups") {
                return (
                  <div
                    key={item.name}
                    className="relative"
                    ref={dropdownRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300`}
                    >
                      {item.name}
                      <svg
                        className="ml-1 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {isGroupsDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                        <div className="py-1" role="menu">
                          {loading ? (
                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                              Loading...
                            </div>
                          ) : (
                            Object.keys(liveDevices).map((subItem) => (
                              <NavLink
                                key={subItem}
                                to={`/groups/${subItem}`}
                                className={`block px-4 py-2 text-sm ${
                                  isActive(`/groups/${subItem}`)
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                                role="menuitem"
                              >
                                {subItem}
                              </NavLink>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive(item.href)
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                if (item.name === "Groups") {
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() =>
                          setIsMobileGroupsOpen(!isMobileGroupsOpen)
                        }
                        className={`w-full flex items-center justify-between pl-3 pr-4 py-2 text-base font-medium ${
                          isActive(item.href)
                            ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}
                      >
                        <span>{item.name}</span>
                        <svg
                          className={`h-5 w-5 transition-transform ${
                            isMobileGroupsOpen ? "rotate-180" : ""
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {isMobileGroupsOpen && (
                        <div className="bg-gray-50">
                          {loading ? (
                            <div className="px-4 py-2 text-sm text-gray-500 italic">
                              Loading...
                            </div>
                          ) : (
                            Object.keys(liveDevices).map((subItem) => (
                              <NavLink
                                key={subItem}
                                to={`/groups/${subItem}`}
                                className={`block px-4 py-2 text-sm ${
                                  isActive(`/groups/${subItem}`)
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                                role="menuitem"
                              >
                                {subItem}
                              </NavLink>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`block pl-3 pr-4 py-2 text-base font-medium ${
                      isActive(item.href)
                        ? "bg-blue-50 border-l-4 border-blue-600 text-blue-700"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

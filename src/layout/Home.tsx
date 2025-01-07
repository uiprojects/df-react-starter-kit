/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { getDiligenceFabricSDK } from "../services/DFService";
import { DefaultIcon } from "../assets/icons";
import config from "../config/default.json";
import logo from "../images/your-logo.png";

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [appMenuItems, setAppMenuItems] = useState<any[]>([]);
  const [nestedMenuItems, setNestedMenuItems] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string>("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuLocation = config.PUBLIC_MENU_LOCATION;

  const fetchDataMenu = async () => {
    try {
      const client = getDiligenceFabricSDK();
      const data = JSON.parse(localStorage.getItem("userData") || "{}");
      const token = data.Token;
      if (!token) {
        console.error("User token not set. Redirecting to login...");
        navigate("/login");
        return;
      }

      const appMenuListResponse = await client
        .getApplicationRoleService()
        .getAllAccessibleMenus();

      if (!appMenuListResponse || !Array.isArray(appMenuListResponse)) {
        console.error("Invalid menu response:", appMenuListResponse);
        setAppMenuItems([]);
        return;
      }

      console.log(appMenuListResponse);

      setAppMenuItems(appMenuListResponse);
    } catch (error) {
      console.error("Error fetching data:", error);
      navigate("/login");
    }
  };

  const organizeMenuHierarchy = (items: any[]) => {
    const itemMap: { [key: number]: any } = {};
    const roots: any[] = [];

    items.forEach((item) => {
      itemMap[item.AppMenuID] = { ...item, children: [] };
    });

    items.forEach((item) => {
      if (item.ParenAppMenuID === 0) {
        roots.push(itemMap[item.AppMenuID]);
      } else if (itemMap[item.ParenAppMenuID]) {
        itemMap[item.ParenAppMenuID].children.push(itemMap[item.AppMenuID]);
      }
    });

    return roots;
  };

  useEffect(() => {
    fetchDataMenu();
  }, []);

  useEffect(() => {
    if (appMenuItems.length > 0) {
      const structuredMenu = organizeMenuHierarchy(appMenuItems);
      const sidebarItems = structuredMenu.filter(
        (item) =>
          !["Profile", "Settings", "Notifications"].includes(item.AppMenuLabel)
      );
      setNestedMenuItems(sidebarItems);
    }
  }, [appMenuItems]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleItemClick = (item: any) => {
    const menuUrl = `/${item.AppMenuLabel.toLowerCase()}`;
    navigate(menuUrl);
  };

  const renderSidebarMenuItems = (menuItems: any[]) => {
    return menuItems.map((item: any) => {
      const icon = <DefaultIcon />;
      const isActive = item.AppMenuID === activeMenu;

      const handleToggle = () => {
        if (item.children?.length) {
          setIsOpen(!isOpen);
        } else {
          handleItemClick(item);
        }
      };

      return (
        <div key={item.AppMenuID} className="relative flex flex-col space-y-2">
          <div
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
              item.children?.length
                ? "cursor-pointer text-gray-600"
                : "cursor-pointer hover:text-blue-500"
            } ${isActive ? "bg-blue-100 text-blue-600 font-bold" : ""}`}
            onClick={handleToggle}
          >
            <div className="w-6 h-6">{icon}</div>
            <span className="text-lg ml-3">{item.AppMenuLabel}</span>
            {item.children?.length > 0 && (
              <span
                className={`ml-auto transition-transform transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ▼
              </span>
            )}
          </div>

          {isOpen && item.children?.length > 0 && (
            <div className="ml-6 pl-4 border-l border-gray-300">
              {renderSidebarMenuItems(item.children)}
            </div>
          )}
        </div>
      );
    });
  };
  const renderTopMenuItems = (menuItems: any[]) => {
    return menuItems.map((item: any) => {
      // const icon = <DefaultIcon />;
      const isActive = item.AppMenuID === activeMenu;

      const handleTopMenuClick = () => {
        if (item.children?.length) {
          setActiveMenu(item.AppMenuID === activeMenu ? "" : item.AppMenuID);
        } else {
          handleItemClick(item);
        }
      };

      return (
        <div key={item.AppMenuID} className="relative">
          <div
            className={`flex items-center cursor-pointer ${
              isActive ? "text-blue-600 font-bold" : ""
            }`}
            onClick={handleTopMenuClick}
          >
            {/* <div className="w-6 h-6">{icon}</div> */}
            <span className="text-lg ml-5">{item.AppMenuLabel}</span>
          </div>

          {item.children?.length > 0 && isActive && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50">
              {item.children.map((child: any) => (
                <div
                  key={child.AppMenuID}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleItemClick(child)}
                >
                  {child.AppMenuLabel}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };
  const renderProfileDropdown = () => (
    <div className="relative">
      <div
        className="cursor-pointer"
        onClick={() => setDropdownOpen(!isDropdownOpen)}
      >
        <CgProfile size={40} style={{color : 'white'}} />
      </div>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50">
          <ul className="py-2">
            <li
              onClick={() => navigate("/profile")}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              My Profile
            </li>
            <li
              onClick={() => navigate("/change-password")}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Change Password
            </li>
            <li
              onClick={handleLogout}
              className="px-4 py-2 text-red-500 hover:bg-gray-100 cursor-pointer"
            >
              Logout
            </li>
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      {menuLocation === "side" ? (
        <aside className="flex flex-col p-5 bg-blue-800 h-full w-64">
          <div className="mb-8 cursor-pointer">
            <img src={logo} className="h-24" alt="Logo" />
          </div>
          <nav>{renderSidebarMenuItems(nestedMenuItems)}</nav>
        </aside>
      ) : (
        <header className="flex justify-between text-white items-center p-4 shadow-md border-b border-gray-200 bg-blue-800">
          <div className="flex items-center space-x-4">
            <img src={logo} className="h-12" alt="Logo" />
            <nav className="flex space-x-4">
              {renderTopMenuItems(nestedMenuItems)}
            </nav>
          </div>
        </header>
      )}

      <div className="absolute top-4 right-4">{renderProfileDropdown()}</div>

      <main className="flex flex-col flex-grow">
        <div className="p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Main;

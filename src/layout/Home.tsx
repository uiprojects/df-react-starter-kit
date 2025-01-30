/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { getDiligenceFabricSDK } from "../services/DFService";
import { DefaultIcon } from "../assets/icons";
import config from "../config/default.json";
import logo from "../assets/DF-Logo.svg";
import { FaChevronDown } from 'react-icons/fa';

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [appMenuItems, setAppMenuItems] = useState<any[]>([]);
  const [nestedMenuItems, setNestedMenuItems] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string>("");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuLocation = config.PUBLIC_MENU_LOCATION;
  let userName: string = ""
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const toggleDropdown = () => {
    setOpen(!open);
  };

  const fetchDataMenu = async () => {
    try {
      const client = getDiligenceFabricSDK();
      const data = JSON.parse(localStorage.getItem("userData") || "{}");
      userName = data.UserName
      if (userName) {
        setUsername(userName)
      }
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
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${item.children?.length
              ? "cursor-pointer text-gray-600"
              : "cursor-pointer hover:text-blue-500"
              } ${isActive ? "bg-blue-100 text-blue-600 font-bold" : ""}`}
            onClick={handleToggle}
          >
            <div className="w-6 h-6">{icon}</div>
            <span className="text-lg ml-3">{item.AppMenuLabel}</span>
            {item.children?.length > 0 && (
              <span
                className={`ml-auto transition-transform transform ${isOpen ? "rotate-90" : ""
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
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const dropdownRef = useRef(null);

    //needs work behaviour to be checked
    const handleClickOutside = (event : any) => {
        setHoveredMenu(null);
      
    };
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

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
        <div key={item.AppMenuID} className="relative"
          onMouseEnter={() => setHoveredMenu(item.AppMenuID)}
        //  onMouseLeave={ () => setHoveredMenu(null)}
        >
          <div
            className={`flex items-center cursor-pointer  `}
            onClick={handleTopMenuClick}
          >
            {/* <div className="w-6 h-6">{icon}</div> */}
            <span className={`text-base  ml-5  font-bold hover:bg-primary-50 hover:text-white  ${isActive ? "text-white bg-primary-50" : ""}  `}>{item.AppMenuLabel}</span>
            {item.children?.length > 0 && <FaChevronDown className="ml-2" />}
          </div>

          {hoveredMenu === item.AppMenuID && item.children?.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50">
              {item.children.map((child: any) => (
                <div key={child.AppMenuID} className="relative">
                  <div
                    key={child.AppMenuID}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleItemClick(child)}
                  >
                    {child.AppMenuLabel}
                  </div>
                  {/* needs work */}
                  {/* {child.children?.length > 0 && ( 
                    <div className="absolute left-full top-0 mt-1 w-48 bg-white shadow-lg rounded-md z-50">
                      {child.children.map((subChild: any) => (
                        <div
                          key={subChild.AppMenuID}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleItemClick(subChild)}
                        >
                          {subChild.AppMenuLabel}
                        </div>
                      ))}
                    </div>
                  )} */}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };
  const renderProfileDropdown = () => (
    <div className="relative ">
      <div
        className="cursor-pointer"
        onClick={toggleDropdown}
      >
        <CgProfile size={35} style={{ color: 'white' }} />
      </div>
      {open && (
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
        <header className="flex justify-between text-black items-center p-4 shadow-md border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-4">
            <img src={logo} className="h-12" alt="Logo" />
            <nav className="flex space-x-4">
              {renderTopMenuItems(nestedMenuItems)}
            </nav>
          </div>
        </header>
      )}

      <div className="absolute top-4 right-4 rounded-full mt-2 bg-primary-50 ">{renderProfileDropdown()}</div>

      <main className="flex flex-col bg-primary-100 flex-grow">
        <div className="p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Main;

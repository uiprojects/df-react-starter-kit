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
  const [openMenus , setOpenMenus] = useState<{ [key : number] : boolean}>({})
  const toggleDropdown = () => {
    setOpen(!open);
  };

  const handleToggle = (menuId : number) => {
    setOpenMenus((prevState) => ({
      ...prevState,
      [menuId]: !prevState[menuId]
    }) );
  };

  const sideMenuhandleItemClick = (item : any) => {
    if(item.AppMenuURL){
      navigate(item.AppMenuURL)
    }
    setActiveMenu(item.AppMenuID)
  }


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
      const isSubmenuOpen = openMenus[item.AppMenuID] || false;

      return (
        <div key={item.AppMenuID} className="relative flex flex-col space-y-2 bg-primary-100">
          <div
            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${item.children?.length
              ? "cursor-pointer text-black"
              : "cursor-pointer hover:text-primary-200"
              } ${isActive ? "bg-primary-50 text-white font-bold  hover:text-white" : ""}`}
            onClick={ () => sideMenuhandleItemClick(item)}
          >
            <div className="w-6 h-6">{icon}</div>
            <span className="text-base ml-3">{item.AppMenuLabel}</span>
            {item.children?.length > 0 && (
              <span
                className={`ml-auto transition-transform transform ${isSubmenuOpen ? "rotate-90" : ""
                  }`}
                  onClick={ () => handleToggle(item.AppMenuID)}
              >
                <FaChevronDown></FaChevronDown>
              </span>
            )}
          </div>

          {isSubmenuOpen && item.children?.length > 0 && (
            <div className="ml-6 pl-4 border-l border-gray-300">
              {renderSidebarMenuItems(item.children)}
            </div>
          )}
        </div>
      );
    });
  };


  const DropdownMenu = ({ items }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
      <div
        className="relative group"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <button className="py-2 px-4 hover:bg-primary-50 text-white">
          {items.AppMenuLabel}
        </button>
        {items.childMenus && (
          <div className={`absolute left-1 mt-2 bg-white border rounder shadow-lg ${isMenuOpen ? "block" : "hidden"}  `}>
            <ul className="py-2">
              {items.childMenus.map((childItem, index) => (
                <li key={index} className="relative group">
                  <a href={childItem.link} className="block px-4 py-2 hover:bg-gray-100">
                    {childItem.AppMenuLabel}
                  </a>
                  {childItem.child_Menus && (
                    <div className="absolute left-full top-0 mt-0 bg-white border rounded shadow-lg hidden group-hover:block">
                      <DropdownMenu items={childItem}></DropdownMenu>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  const renderTopMenuItems = (menuItems: any[]) => {
    const [openMenu, setOpenMenu] = useState<number | null>(null); 
    const menuRef = useRef<HTMLDivElement | null>(null); 
    const toggleChildMenu = (menuId: number) => {
      if (openMenu === menuId) {
        setOpenMenu(null); 
      } else {
        setOpenMenu(menuId); 
      }
    };
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setOpenMenu(null); 
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
    return (
      <div className="relative" ref={menuRef}>
        <ul className="flex items-center space-x-4">
          {menuItems.map((item, index) => (
            <li key={index} className="relative">
              {/* Top-level menu label */}
              <div className="flex items-center">
                <span
                  className="text-base font-bold cursor-pointer hover:text-primary-50"
                  onClick={() => toggleChildMenu(item.AppMenuID)} 
                >
                  {item.AppMenuLabel}
                </span>
                
                {item.childMenus && item.childMenus.length > 0 && (
                  <FaChevronDown className="ml-2 text-sm cursor-pointer" />
                )}
              </div>
           
              {openMenu === item.AppMenuID && item.childMenus && item.childMenus.length > 0 && (
                <ul className="absolute left-0 mt-2 bg-white border rounded shadow-lg">
                  {item.childMenus.map((child, childIndex) => (
                    <li key={childIndex} className="relative group">
                      <div className="flex items-center px-4 py-2 hover:bg-gray-200 cursor-pointer">
                        <span>{child.AppMenuLabel}</span>
                        {child.child_Menus && child.child_Menus.length > 0 && (
                          <FaChevronDown className="ml-2 text-sm" />
                        )}
                      </div>
                      {child.child_Menus && child.child_Menus.length > 0 && (
                        <ul className="absolute left-full top-0 mt-0 bg-white border rounded shadow-lg hidden group-hover:block">
                          {child.child_Menus.map((subChild, subChildIndex) => (
                            <li key={subChildIndex} className="px-4 py-2 hover:bg-gray-200">
                              {subChild.AppMenuLabel}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
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
        <aside className="flex flex-col p-5  h-full w-64 bg-primary-100">
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

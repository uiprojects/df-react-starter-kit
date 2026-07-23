/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { getDiligenceFabricSDK } from "../services/DFService";
import config from "../config/default.json";
import logo from "../assets/DF-Logo.svg";
import { FaChevronDown } from 'react-icons/fa';

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [appMenuItems, setAppMenuItems] = useState<any[]>([]);
  const [nestedMenuItems, setNestedMenuItems] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string>("");
  const menuLocation = config.PUBLIC_MENU_LOCATION;
  const [open, setOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: number]: boolean }>({})
  const toggleDropdown = () => {
    setOpen(!open);
  };

  const handleToggle = (menuId: number) => {
    setOpenMenus((prevState) => ({
      ...prevState,
      [menuId]: !prevState[menuId]
    }));
  };

  const sideMenuhandleItemClick = (item: any) => {
    if (item.AppMenuActionUrl) {
      navigate(item.AppMenuActionUrl)
    }
    setActiveMenu(item.AppMenuId)
  }


  const fetchDataMenu = async () => {
    try {
      const client = getDiligenceFabricSDK();
      const data = JSON.parse(localStorage.getItem("userData") || "{}");
      console.log('[Home] userData from localStorage:', data);
      
      const token = data.token || data.Token;
      if (!token) {
        console.error("User token not set. Redirecting to login...");
        navigate("/login");
        return;
      }

      // ✅ Extract required data for role-based menus
      const appId = data.app?.appId || data.appId;
      const userId = data.userId;
      const tenantId = data.tenantId;
      const appEnvironmentCode = data.appEnvironmentCode || "PROD";
      
      console.log('[Home] User data:', { appId, userId, tenantId, appEnvironmentCode });
      
      if (!client) {
        console.error('[Home] ❌ Client is null - cannot fetch menus');
        setAppMenuItems([]);
        return;
      }
      
      // ✅ Use role-based menu endpoint
      if (appId && userId && tenantId) {
        console.log('[Home] ✅ Fetching role-based menus for appId:', appId);
        
        const queryParams: any = {
          tenantId: tenantId,
          userId: userId,
          appId: appId,
          appEnvironmentCode: appEnvironmentCode,  // ✅ From MS login response
          pageSize: 100
        };
        
        const response = await client.api.v3.userAppRole.menus.get({
          queryParameters: queryParams
        });
        
        console.log('[Home] 🔍 Role-based menu response:', response);
        
        // V3 SDK returns data directly as array
        let appMenuListResponse = response || [];
        
        if (!appMenuListResponse || !Array.isArray(appMenuListResponse)) {
          console.error("[Home] ❌ Invalid menu response - expected array, got:", typeof appMenuListResponse, appMenuListResponse);
          setAppMenuItems([]);
          return;
        }

        console.log('[Home] ✅ Setting', appMenuListResponse.length, 'role-based menu items');
        setAppMenuItems(appMenuListResponse);
      } else {
        console.warn('[Home] ⚠️ Missing required data (appId, userId, or tenantId) - cannot fetch role-based menus');
        setAppMenuItems([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      navigate("/login");
    }
  };

  const organizeMenuHierarchy = (items: any[]) => {
    const itemMap: { [key: number]: any } = {};
    const roots: any[] = [];

    // Handle both camelCase (from userAppRole.menus) and PascalCase (from appMenu) responses
    items.forEach((item) => {
      const menuId = item.appMenuId || item.AppMenuId;
      itemMap[menuId] = { 
        ...item, 
        children: [],
        // Normalize to PascalCase for consistency with existing component code
        AppMenuId: menuId,
        AppMenuLabel: item.appMenuLabel || item.AppMenuLabel,
        AppMenuActionUrl: item.appMenuActionUrl || item.AppMenuActionUrl,
        ParentAppMenuId: item.parentAppMenuId || item.ParentAppMenuId || 0
      };
    });

    items.forEach((item) => {
      const menuId = item.appMenuId || item.AppMenuId;
      const parentMenuId = item.parentAppMenuId || item.ParentAppMenuId || 0;
      
      if (parentMenuId === 0 || parentMenuId === null) {
        roots.push(itemMap[menuId]);
      } else if (itemMap[parentMenuId]) {
        itemMap[parentMenuId].children.push(itemMap[menuId]);
      }
    });

    return roots;
  };

  useEffect(() => {
    fetchDataMenu();
  }, []);

  useEffect(() => {
    if (appMenuItems.length > 0) {
      // console.log('[Home] 🔧 Organizing menu hierarchy for', appMenuItems.length, 'items');
      // console.log('[Home] 🔧 First menu item sample:', appMenuItems[0]);
      // console.log('[Home] 🔧 First menu item keys:', appMenuItems[0] ? Object.keys(appMenuItems[0]) : 'none');
      
      const structuredMenu = organizeMenuHierarchy(appMenuItems);
      // console.log('[Home] 🔧 Structured menu result:', structuredMenu);
      // console.log('[Home] 🔧 Root menu count:', structuredMenu.length);
      
      setNestedMenuItems(structuredMenu);
    } else {
      // console.log('[Home] 🔧 No menu items to organize');
    }
  }, [appMenuItems]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const renderSidebarMenuItems = (menuItems: any[]) => {
    return menuItems.map((item: any) => {
      const isActive = item.AppMenuId === activeMenu;
      const isSubmenuOpen = openMenus[item.AppMenuId] || false;

      return (
        <div key={item.AppMenuId} className="relative flex flex-col space-y-2 bg-white">
          <div
            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${item.children?.length
              ? "cursor-pointer text-black"
              : "cursor-pointer hover:text-primary-200"
              } ${isActive ? "bg-primary-50 text-white font-bold  hover:text-white" : ""}`}
            onClick={() => sideMenuhandleItemClick(item)}
          >
            <ul className="list-none">
              <li className="text-base ml-3 inline">
              {item.AppMenuLabel}
              </li>
            </ul>
            {item.children?.length > 0 && (
              <span
                className={`ml-auto transition-transform transform ${isSubmenuOpen ? "rotate-90" : ""
                  }`}
                onClick={() => handleToggle(item.AppMenuId)}
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


  const DropdownMenu = ({ items }: { items: any }) => {
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
              {items.childMenus.map((childItem: any, index: number) => (
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
                  onClick={() => toggleChildMenu(item.AppMenuId)}
                >
                  {item.AppMenuLabel}
                </span>

                {item.childMenus && item.childMenus.length > 0 && (
                  <FaChevronDown className="ml-2 text-sm cursor-pointer" />
                )}
              </div>

              {openMenu === item.AppMenuId && item.childMenus && item.childMenus.length > 0 && (
                <ul className="absolute left-0 mt-2 bg-white border rounded shadow-lg">
                  {item.childMenus.map((child: any, childIndex: number) => (
                    <li key={childIndex} className="relative group">
                      <div className="flex items-center px-4 py-2 hover:bg-gray-200 cursor-pointer">
                        <span>{child.AppMenuLabel}</span>
                        {child.child_Menus && child.child_Menus.length > 0 && (
                          <FaChevronDown className="ml-2 text-sm" />
                        )}
                      </div>
                      {child.child_Menus && child.child_Menus.length > 0 && (
                        <ul className="absolute left-full top-0 mt-0 bg-white border rounded shadow-lg hidden group-hover:block">
                          {child.child_Menus.map((subChild: any, subChildIndex: number) => (
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
        <div className="flex h-full">
          <aside className="flex flex-col p-5 h-full w-64 bg-white">
            <div className="mb-8 cursor-pointer">
              <img src={logo} className="h-24" alt="Logo" />
            </div>
            <nav>{renderSidebarMenuItems(nestedMenuItems)}</nav>
          </aside>

          <main className="flex-grow bg-primary-100 p-4 relative">
          <div className="absolute top-4 right-4 rounded-full mt-2 bg-primary-50 ">{renderProfileDropdown()}</div>

            <div className="p-5">
              <Outlet />
            </div>
          </main>

        </div>
      ) : (
        <>
          <header className="flex justify-between text-black items-center p-4 shadow-md border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-4">
              <img src={logo} className="h-12" alt="Logo" />
              <nav className="flex space-x-4">
                {renderTopMenuItems(nestedMenuItems)}
              </nav>
            </div>
          </header>
          <div className="absolute top-4 right-4 rounded-full mt-2 bg-primary-50 ">{renderProfileDropdown()}</div>

          <main className="flex flex-col bg-primary-100 flex-grow">
            <div className="p-5">
              <Outlet />
            </div>
          </main>
        </>
      )}

    </div>

  );
};

export default Main;

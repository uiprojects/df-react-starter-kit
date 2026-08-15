/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
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
      } else {
        // Diagnostic only: parentMenuId is set but that parent isn't in this
        // response, so this item would otherwise silently disappear.
        console.warn(`[Home] Orphaned menu item: id=${menuId} ("${item.appMenuLabel || item.AppMenuLabel}") references missing parentAppMenuId=${parentMenuId} (not present in the API response)`);
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

  // ---- UI-only change starts here: renderTopMenuItems now renders the
  // second-level dropdown through a portal, positioned with fixed coords,
  // so it floats over the page instead of being pushed/clipped by the
  // horizontally scrolling nav. No menu-building or click logic changed. ----
  const renderTopMenuItems = (menuItems: any[]) => {
    const [openMenu, setOpenMenu] = useState<number | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    // Tracks which 2nd-level child (if any) has its own nested children expanded below it.
    const [openChild, setOpenChild] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    // Ref for the portaled dropdown <ul> (it lives on document.body, outside menuRef's
    // DOM subtree) so the outside-click check below can recognize clicks inside it as
    // "inside" instead of closing the menu.
    const dropdownRef = useRef<HTMLUListElement | null>(null);

    const toggleChildMenu = (menuId: number) => {
      if (openMenu === menuId) {
        setOpenMenu(null);
        setOpenChild(null);
        return;
      }
      const el = itemRefs.current[menuId];
      if (el) {
        const rect = el.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left });
      }
      setOpenMenu(menuId);
      setOpenChild(null);
    };

    // Click handler for the arrow on a child that itself has children (grandchildren).
    // stopPropagation so it doesn't also trigger the outer "click outside" close handler.
    const toggleNestedChild = (e: React.MouseEvent, childId: number) => {
      e.stopPropagation();
      setOpenChild((prev) => (prev === childId ? null : childId));
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const clickedInsideTrigger = menuRef.current && menuRef.current.contains(target);
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
        if (!clickedInsideTrigger && !clickedInsideDropdown) {
          setOpenMenu(null);
          setOpenChild(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const activeItem = menuItems.find((item) => item.AppMenuId === openMenu);

    return (
      <div className="relative" ref={menuRef}>
        <ul className="flex items-center space-x-1.5">
          {menuItems.map((item, index) => (
            <li key={index} className="relative">
              {/* Top-level menu label */}
              <div
                ref={(el) => { itemRefs.current[item.AppMenuId] = el; }}
                className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer text-sm font-medium ${openMenu === item.AppMenuId ? "bg-primary-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-600"}`}
                onClick={() => toggleChildMenu(item.AppMenuId)}
              >
                <span className="cursor-pointer">
                  {item.AppMenuLabel}
                </span>

                {item.children && item.children.length > 0 && (
                  <FaChevronDown className={`ml-2 text-xs cursor-pointer transition-transform duration-200 ${openMenu === item.AppMenuId ? "rotate-180" : ""}`} />
                )}
              </div>
            </li>
          ))}
        </ul>

        {openMenu !== null && activeItem?.children && activeItem.children.length > 0 &&
          ReactDOM.createPortal(
            <ul
              ref={dropdownRef}
              className="fixed min-w-[200px] bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1.5 overflow-hidden"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              {activeItem.children.map((child: any, childIndex: number) => {
                const hasGrandChildren = child.children && child.children.length > 0;
                const isChildOpen = openChild === child.AppMenuId;
                return (
                  <li key={childIndex} className="relative">
                    <div
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-colors duration-150"
                      onClick={(e) => hasGrandChildren && toggleNestedChild(e, child.AppMenuId)}
                    >
                      {hasGrandChildren ? (
                        <FaChevronDown
                          className={`text-xs text-gray-400 transition-transform duration-200 ${isChildOpen ? "" : "-rotate-90"}`}
                        />
                      ) : (
                        <span className="w-3" />
                      )}
                      <span>{child.AppMenuLabel}</span>
                    </div>
                    {hasGrandChildren && isChildOpen && (
                      <ul className="ml-4 pl-3 border-l border-gray-200 py-1">
                        {child.children.map((subChild: any, subChildIndex: number) => (
                          <li
                            key={subChildIndex}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 hover:bg-primary-100 hover:text-primary-600 cursor-pointer transition-colors duration-150"
                          >
                            <span className="w-3" />
                            <span>{subChild.AppMenuLabel}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>,
            document.body
          )}
      </div>
    );
  };
  // ---- UI-only change ends here ----

  const renderProfileDropdown = () => (
    <div className="relative ">
      <div
        className="cursor-pointer"
        onClick={toggleDropdown}
      >
        <CgProfile size={35} style={{ color: menuLocation === "side" ? 'white' : '#374151' }} />
      </div>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50">
          <ul className="py-2">

            {/* UI-only: hidden per request, logic/route left intact */}
            <li
              onClick={() => navigate("/change-password")}
              className="hidden px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <img src={logo} className="h-12 flex-shrink-0" alt="Logo" />
              <nav className="flex items-center space-x-1.5 overflow-x-auto overflow-y-visible min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {renderTopMenuItems(nestedMenuItems)}
              </nav>
            </div>
            <div className="flex-shrink-0 ml-4">{renderProfileDropdown()}</div>
          </header>

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

"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
  subs?: {
    title: string;
    link: string;
    icon?: React.ReactNode;
  }[];
};

export type NavigationSection = {
  id: string;
  title?: string;
  routes: Route[];
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
};

type DashboardNavigationProps =
  | { routes: Route[]; sections?: undefined }
  | { sections: NavigationSection[]; routes?: undefined };

export default function DashboardNavigation(
  props: DashboardNavigationProps
) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedOpenCollapsible = localStorage.getItem("dashboard-nav-open");
    if (savedOpenCollapsible) {
      setOpenCollapsible(savedOpenCollapsible);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isHydrated) {
      if (openCollapsible) {
        localStorage.setItem("dashboard-nav-open", openCollapsible);
      } else {
        localStorage. removeItem("dashboard-nav-open");
      }
    }
  }, [openCollapsible, isHydrated]);

  const renderRoutes = (routes: Route[]) => (
    routes.map((route, routeIndex) => {
        const isOpen = !isCollapsed && openCollapsible === route.id;
        const hasSubRoutes = !!route.subs?. length;

        return (
          <motion.div
            key={route. id}
            initial={{ x:  -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: routeIndex * 0.05, duration: 0.2 }}
          >
            <SidebarMenuItem>
              {hasSubRoutes ? (
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) =>
                    setOpenCollapsible(open ? route. id : null)
                  }
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "flex w-full items-center rounded-lg px-2 transition-colors",
                        isOpen
                          ?  "bg-sidebar-muted text-foreground"
                          :  "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                        isCollapsed && "justify-center"
                      )}
                    >
                      {route.icon}
                      {! isCollapsed && (
                        <span className="ml-2 flex-1 text-sm font-medium">
                          {route.title}
                        </span>
                      )}
                      {!isCollapsed && hasSubRoutes && (
                        <motion.span
                          className="ml-auto"
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="size-4" />
                        </motion.span>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {!isCollapsed && (
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <CollapsibleContent forceMount asChild>
                          <motion.div
                            initial={{ height: 0, opacity:  0 }}
                            animate={{ height: "auto", opacity:  1 }}
                            exit={{ height: 0, opacity:  0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            style={{ overflow:  "hidden" }}
                          >
                            <SidebarMenuSub className="my-1 ml-3.5">
                              {route.subs?.map((subRoute, subIndex) => (
                                <motion.div
                                  key={`${route.id}-${subRoute.title}`}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{
                                    delay: subIndex * 0.05,
                                    duration: 0.2,
                                  }}
                                >
                                  <SidebarMenuSubItem className="h-auto">
                                    <SidebarMenuSubButton asChild>
                                      <Link
                                        href={subRoute.link}
                                        prefetch={true}
                                        className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                                      >
                                        {subRoute.icon}
                                        <span className="truncate">{subRoute.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                </motion.div>
                              ))}
                            </SidebarMenuSub>
                          </motion.div>
                        </CollapsibleContent>
                      )}
                    </AnimatePresence>
                  )}
                </Collapsible>
              ) : (
                <SidebarMenuButton tooltip={route.title} asChild>
                  <Link
                    href={route.link}
                    prefetch={true}
                    className={cn(
                      "flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    {route.icon}
                    {!isCollapsed && (
                      <span className="ml-2 text-sm font-medium">
                        {route.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </motion.div>
        );
      })
  );

  // Sections mode: when collapsed, render a single flat menu without section labels
  if (props.sections) {
    if (isCollapsed) {
      const flatRoutes = props.sections.flatMap((s) => s.routes);
      return <SidebarMenu>{renderRoutes(flatRoutes)}</SidebarMenu>;
    }

    return (
      <div className="flex w-full flex-col gap-4">
        {props.sections.map((section, idx) => (
          <div key={section.id} className="px-2">
            {section.title && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                className="text-xs font-semibold mb-2 px-2 uppercase tracking-wide"
              >
                <div className="flex items-center text-muted-foreground">
                  <span className="flex-1">{section.title}</span>
                  {section.actionIcon && section.onActionClick && (
                    <button
                      type="button"
                      onClick={section.onActionClick}
                      aria-label={`${section.title} action`}
                      className="inline-flex items-center justify-center size-4 rounded hover:text-foreground"
                    >
                      {section.actionIcon}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
            <SidebarMenu>{renderRoutes(section.routes)}</SidebarMenu>
          </div>
        ))}
      </div>
    );
  }

  // Backward-compatible: routes array only
  return <SidebarMenu>{renderRoutes(props.routes ?? [])}</SidebarMenu>;
}
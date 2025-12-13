"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Binoculars, BriefcaseBusiness, Calendar, ChartNoAxesGantt,
  CheckSquare, Code,
  Hammer, Handshake,
  Home, Inbox, Kanban,
  LayoutDashboard, ListTree,
  MessageSquare, NotepadText,
  PieChart, RefreshCcw, RefreshCcwDot,
  Settings,
  Users, View, Zap, Plus,
} from "lucide-react";

import type { NavigationSection } from "./nav-main";
import DashboardNavigation from "./nav-main";
import { NotificationsPopover } from "./nav-notifications";
import { ProgramSwitcher } from "./program-switcher";
import LogoSvg from "@/components/logo/logo-svg";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New order received.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Server upgrade completed.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "New user signed up.",
    time: "2h ago",
  },
];

const programs = [
  { id: "1", name: "Alpha Inc.", logo: LogoSvg, plan: "Free" },
  { id: "2", name: "Beta Corp.", logo: LogoSvg, plan: "Free" },
  { id: "3", name: "Gamma Tech", logo: LogoSvg, plan: "Free" },
];

export const defaultSections: NavigationSection[] = [
  {
    id: "main",
    routes: [
      {
        id: "program",
        title: "Program",
        icon: <Home className="size-4" />,
        link: "#",
      },
      {
        id: "inbox",
        title: "Inbox",
        icon: <Inbox className="size-4" />,
        link: "#",
      },
      {
        id: "this-cycle",
        title: "This Cycle",
        icon: <RefreshCcwDot className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ],
      },
      {
        id: "all-cycles",
        title: "All Cycles",
        icon: <RefreshCcw className="size-4" />,
        link: "#",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    routes: [
      {
        id: "people",
        title: "People",
        icon: <Users className="size-4" />,
        link: "#",
      },
      {
        id: "views",
        title: "Views",
        icon: <View className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Kanban",
            icon: <Kanban className={'size-4'} />,
            link: "#",
          },
          {
            title: "Gantt",
            icon: <ChartNoAxesGantt className={"size-4"} />,
            link: "#",
          },
          {
            title: "Calendar",
            icon: <Calendar className={'size-4'} />,
            link: "#",
          },
          {
            title: "List",
            icon: <ListTree className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "insights",
        title: "Insights",
        icon: <Binoculars className="size-4" />,
        link: "#",
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    routes: [
      {
        id: "project-1",
        title: "Shooter",
        icon: <PieChart className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      }
    ]
  },
  {
    id: "teams",
    title: "Teams",
    onActionClick: () => console.log("Add Team action"),
    actionIcon: <Plus className="size-4" />,
    routes: [
      {
        id: "mechanical",
        title: "Mechanical",
        icon: <Hammer className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "programming",
        title: "Programming",
        icon: <Code className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "electrical",
        title: "Electrical",
        icon: <Zap className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "strategy",
        title: "Strategy",
        icon: <NotepadText className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "e-team",
        title: "Entrepreneurship",
        icon: <BriefcaseBusiness className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
      {
        id: "ops",
        title: "Operations",
        icon: <Handshake className="size-4" />,
        link: "#",
        subs: [
          {
            title: "Overview",
            icon: <LayoutDashboard className="size-4" />,
            link: "#",
          },
          {
            title: "Tasks",
            icon: <CheckSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Updates",
            icon: <MessageSquare className="size-4" />,
            link: "#",
          },
          {
            title: "Views",
            icon: <View className="size-4" />,
            link: "#",
          }
        ]
      },
    ]
  },
  {
    id: "admin",
    title: "Admin",
    routes: [
      {
        id: "settings",
        title: "Settings",
        icon: <Settings className="size-4" />,
        link: "#"
      },
    ],
  },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between"
        )}
      >
        <a href="#" className="flex items-center gap-2">
          <LogoSvg className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-semibold text-black dark:text-white">
              Pulse
            </span>
          )}
        </a>

        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation sections={defaultSections} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <ProgramSwitcher programs={programs} />
      </SidebarFooter>
    </Sidebar>
  );
}

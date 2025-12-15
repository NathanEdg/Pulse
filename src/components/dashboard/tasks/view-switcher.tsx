"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, Calendar, List, GanttChart } from "lucide-react";

export type ViewType = "kanban" | "timeline" | "list" | "calendar";

type ViewSwitcherProps = {
  value: ViewType;
  onValueChange: (value: ViewType) => void;
};

export function ViewSwitcher({ value, onValueChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(newValue) => {
        if (newValue) onValueChange(newValue as ViewType);
      }}
      variant="outline"
      spacing={0}
    >
      <ToggleGroupItem value="kanban" aria-label="Kanban view">
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Kanban</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="timeline" aria-label="Timeline view">
        <GanttChart className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Timeline</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">List</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="calendar" aria-label="Calendar view">
        <Calendar className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Calendar</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

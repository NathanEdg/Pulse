"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Palette, Text, Hash, Plus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTable } from "@/hooks/use-data-table";
import { ConfirmDeleteDialog } from "@/components/util/dialogs/confirm-deletion";
import { api } from "@/trpc/react";
import { CreatePriorityDialog } from "@/components/dashboard/settings/task-management/create-priority-dialog";
import { EditPriorityDialog } from "@/components/dashboard/settings/task-management/edit-priority-dialog";
import { Spinner } from "@/components/ui/spinner";

interface TaskPriority {
  id: string;
  name: string;
  color: string;
  description?: string;
  sort_order: string;
}

export function TaskPriorityTable() {
  const utils = api.useUtils();
  const { data: priorities = [], isLoading } =
    api.settings.getPriorities.useQuery({
      program_id: "4287f030-7ee1-4025-bb03-0074fff9afd9",
    });
  const { mutate: deletePriorityMutate } =
    api.settings.deletePriority.useMutation({
      onSuccess: () => {
        void utils.settings.getPriorities.invalidate();
      },
    });
  const { mutate: createPriorityMutate } =
    api.settings.createPriority.useMutation({
      onSuccess: () => {
        void utils.settings.getPriorities.invalidate();
      },
    });
  const { mutate: editPriorityMutate } = api.settings.editPriority.useMutation({
    onSuccess: () => {
      void utils.settings.getPriorities.invalidate();
    },
  });
  const [deletePriority, setDeletePriority] =
    React.useState<TaskPriority | null>(null);
  const [editPriority, setEditPriority] = React.useState<TaskPriority | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name] = useQueryState("name", parseAsString.withDefault(""));

  const filteredData = React.useMemo(() => {
    return priorities.filter((taskPriority) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const matchesName =
        name === "" ||
        taskPriority.name.toLowerCase().includes(name.toLowerCase()) ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (taskPriority.description ?? "")
          .toLowerCase()
          .includes(name.toLowerCase());

      return matchesName;
    });
  }, [name, priorities]);

  const columns = React.useMemo<ColumnDef<TaskPriority>[]>(
    () => [
      {
        id: "order",
        accessorKey: "sort_order",
        header: ({ column }: { column: Column<TaskPriority, unknown> }) => (
          <DataTableColumnHeader
            column={column}
            label="Order"
            hideActions={true}
          />
        ),
        cell: ({ cell }) => (
          <div className="flex items-center gap-1 font-medium">
            <Hash className="size-4" />
            {cell.getValue<TaskPriority["sort_order"]>()}
          </div>
        ),
        size: 80,
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }: { column: Column<TaskPriority, unknown> }) => (
          <DataTableColumnHeader
            column={column}
            label="Priority Name"
            hideActions={true}
          />
        ),
        cell: ({ row }) => {
          const name = row.getValue<TaskPriority["name"]>("name");
          const color = row.original.color;

          return (
            <Badge
              variant="outline"
              className="font-medium"
              style={{
                borderColor: color,
                color: color,
              }}
            >
              {name}
            </Badge>
          );
        },
        meta: {
          label: "Priority Name",
          placeholder: "Search priorities...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter: true,
      },
      {
        id: "color",
        accessorKey: "color",
        header: ({ column }: { column: Column<TaskPriority, unknown> }) => (
          <DataTableColumnHeader
            column={column}
            label="Color"
            hideActions={true}
          />
        ),
        cell: ({ cell }) => {
          const color = cell.getValue<TaskPriority["color"]>();

          return (
            <div className="flex items-center gap-2">
              <div
                className="border-border size-6 rounded-md border"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-sm">{color}</span>
            </div>
          );
        },
        meta: {
          icon: Palette,
        },
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }: { column: Column<TaskPriority, unknown> }) => (
          <DataTableColumnHeader
            column={column}
            label="Description"
            hideActions={true}
          />
        ),
        cell: ({ cell }) => (
          <div className="text-muted-foreground max-w-md text-sm">
            {cell.getValue<TaskPriority["description"]>()}
          </div>
        ),
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          const priority = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditPriority(priority)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeletePriority(priority)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 32,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: isLoading ? [] : filteredData,
    columns,
    pageCount: 1,
    initialState: {
      sorting: [{ id: "order", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="data-table-container">
      <DataTable table={table} showPagination={false}>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-8" />
          </div>
        )}
      </DataTable>
      <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
        <Plus />
        Add Priority
      </Button>

      <ConfirmDeleteDialog
        open={!!deletePriority}
        onOpenChange={(open) => !open && setDeletePriority(null)}
        title="Delete Priority"
        description={
          deletePriority
            ? `Are you sure you want to delete the priority ${deletePriority.name}? This action cannot be undone.`
            : ""
        }
        onConfirm={() => {
          if (deletePriority) {
            deletePriorityMutate({ id: deletePriority.id });
            setDeletePriority(null);
          }
        }}
      />

      <CreatePriorityDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (payload) => {
          const priority = {
            name: payload.name,
            color: payload.color,
            description: payload.description,
            sort_order: payload.order.toString(),
            program_id: "4287f030-7ee1-4025-bb03-0074fff9afd9",
          };
          createPriorityMutate(priority);
          setIsCreateOpen(false);
        }}
      />

      <EditPriorityDialog
        open={!!editPriority}
        onOpenChange={(open) => !open && setEditPriority(null)}
        priority={
          editPriority
            ? {
                id: editPriority.id,
                name: editPriority.name,
                color: editPriority.color,
                description: editPriority.description,
                order: parseInt(editPriority.sort_order, 10),
              }
            : null
        }
        onSubmit={(id, payload) => {
          editPriorityMutate({
            id,
            name: payload.name,
            color: payload.color,
            description: payload.description,
            sort_order: payload.order.toString(),
          });
          setEditPriority(null);
        }}
      />
    </div>
  );
}

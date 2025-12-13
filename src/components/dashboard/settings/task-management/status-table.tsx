"use client";
 
import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Palette,
  Text,
  Hash,
  Plus,
} from "lucide-react";
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

import { ConfirmDeleteDialog } from "@/components/util/confirm-deletion";
import { useDataTable } from "@/hooks/use-data-table";
import { api } from "@/trpc/react";
import { CreateStatusDialog } from "@/components/dashboard/settings/task-management/create-status-dialog";
import { EditStatusDialog } from "@/components/dashboard/settings/task-management/edit-status-dialog";
import { Spinner } from "@/components/ui/spinner";
 
interface TaskStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  sort_order: string;
}
 
export function TaskStatusTable() {
  const utils = api.useUtils();
  const { data: statuses = [], isLoading } = api.settings.getStatuses.useQuery({ program_id: "4287f030-7ee1-4025-bb03-0074fff9afd9" });
  const { mutate: deleteStatusMutate } = api.settings.deleteStatus.useMutation({
    onSuccess: () => {
      void utils.settings.getStatuses.invalidate();
    },
  });
  const { mutate: createStatusMutate } = api.settings.createStatus.useMutation({
    onSuccess: () => {
      void utils.settings.getStatuses.invalidate();
    },
  });
  const { mutate: editStatusMutate } = api.settings.editStatus.useMutation({
    onSuccess: () => {
      void utils.settings.getStatuses.invalidate();
    },
  });
  const [deleteStatus, setDeleteStatus] = React.useState<TaskStatus | null>(null);
  const [editStatus, setEditStatus] = React.useState<TaskStatus | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name] = useQueryState("name", parseAsString.withDefault(""));
 
  const filteredData = React.useMemo(() => {
    return statuses.filter((taskStatus) => {
      const matchesName =
        name === "" ||
        taskStatus.name.toLowerCase().includes(name.toLowerCase()) ||
        (taskStatus.description ?? "").toLowerCase().includes(name.toLowerCase());
 
      return matchesName;
    });
  }, [name, statuses, statuses]);
 
  const columns = React.useMemo<ColumnDef<TaskStatus>[]>(
    () => [
      {
        id: "order",
        accessorKey: "sort_order",
        header: ({ column }: { column: Column<TaskStatus, unknown> }) => (
          <DataTableColumnHeader column={column} label="Order" hideActions={true} />
        ),
        cell: ({ cell }) => (
          <div className="flex items-center gap-1 font-medium">
            <Hash className="size-4" />
            {cell.getValue<TaskStatus["sort_order"]>()}
          </div>
        ),
        size: 80,
      },
      {
        id: "name",
        accessorKey:  "name",
        header: ({ column }: { column: Column<TaskStatus, unknown> }) => (
          <DataTableColumnHeader column={column} label="Status Name" hideActions={true} />
        ),
        cell: ({ row }) => {
          const name = row.getValue<TaskStatus["name"]>("name");
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
          label: "Status Name",
          placeholder: "Search statuses...",
          variant: "text",
          icon: Text,
        },
        enableColumnFilter:  true,
      },
      {
        id: "color",
        accessorKey: "color",
        header: ({ column }:  { column: Column<TaskStatus, unknown> }) => (
          <DataTableColumnHeader column={column} label="Color" hideActions={true} />
        ),
        cell: ({ cell }) => {
          const color = cell. getValue<TaskStatus["color"]>();
 
          return (
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-md border border-border"
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
        header: ({ column }: { column:  Column<TaskStatus, unknown> }) => (
          <DataTableColumnHeader column={column} label="Description" hideActions={true} />
        ),
        cell: ({ cell }) => (
          <div className="text-sm text-muted-foreground max-w-md">
            {cell.getValue<TaskStatus["description"]>()}
          </div>
        ),
      },
      {
        id: "actions",
        cell: function Cell({ row }) {
          const status = row.original;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditStatus(status)}>Edit</DropdownMenuItem>
                <DropdownMenuItem 
                  variant="destructive"
                  onClick={() => setDeleteStatus(status)}
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
      sorting:  [{ id: "order", desc:  false }],
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
        <Plus />Add Status
      </Button>

      <ConfirmDeleteDialog
        open={!!deleteStatus}
        onOpenChange={(open) => !open && setDeleteStatus(null)}
        title="Delete Status"
        description={deleteStatus ? `Are you sure you want to delete the status ${deleteStatus.name}? This action cannot be undone.` : ""}
        onConfirm={() => {
          if (deleteStatus) {
            deleteStatusMutate({ id: deleteStatus.id });
            setDeleteStatus(null);
          }
        }}
      />

      <CreateStatusDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (payload) => {
          const status = {
            name: payload.name,
            color: payload.color,
            description: payload.description,
            sort_order: payload.order.toString(),
            program_id: "4287f030-7ee1-4025-bb03-0074fff9afd9"
          }
          createStatusMutate(status);
          setIsCreateOpen(false);
        }}
      />

      <EditStatusDialog
        open={!!editStatus}
        onOpenChange={(open) => !open && setEditStatus(null)}
        status={editStatus ? {
          id: editStatus.id,
          name: editStatus.name,
          color: editStatus.color,
          description: editStatus.description,
          order: parseInt(editStatus.sort_order, 10)
        } : null}
        onSubmit={(id, payload) => {
          editStatusMutate({
            id,
            name: payload.name,
            color: payload.color,
            description: payload.description,
            sort_order: payload.order.toString(),
          });
          setEditStatus(null);
        }}
      />
    </div>
  );
}
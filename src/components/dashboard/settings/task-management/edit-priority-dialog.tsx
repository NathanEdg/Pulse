"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditPriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priority: {
    id: string;
    name: string;
    color: string;
    description?: string;
    order: number;
  } | null;
  onSubmit: (
    id: string,
    priority: {
      name: string;
      color: string;
      description: string;
      order: number;
    }
  ) => Promise<void> | void;
}

export function EditPriorityDialog({
  open,
  onOpenChange,
  priority,
  onSubmit,
}: EditPriorityDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#EF4444");
  const [description, setDescription] = React.useState("");
  const [order, setOrder] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (priority) {
      setName(priority.name);
      setColor(priority.color);
      setDescription(priority.description ?? "");
      setOrder(priority.order);
    }
  }, [priority]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !priority) return;

    setIsSubmitting(true);
    try {
      await onSubmit(priority.id, {
        name: name.trim(),
        color: color.trim(),
        description: description.trim(),
        order,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Priority</DialogTitle>
          <DialogDescription>
            Update the priority settings below.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-priority-name">Name</Label>
            <Input
              id="edit-priority-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="High Priority"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-priority-color">Color</Label>
            <Input
              id="edit-priority-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-priority-order">Order</Label>
            <Input
              id="edit-priority-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-priority-description">Description</Label>
            <Textarea
              id="edit-priority-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should this priority be used?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

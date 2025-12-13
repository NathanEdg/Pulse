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

interface EditStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: {
    id: string;
    name: string;
    color: string;
    description?: string;
    order: number;
  } | null;
  onSubmit: (
    id: string,
    status: {
      name: string;
      color: string;
      description: string;
      order: number;
    }
  ) => Promise<void> | void;
}

export function EditStatusDialog({
  open,
  onOpenChange,
  status,
  onSubmit,
}: EditStatusDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#3B82F6");
  const [description, setDescription] = React.useState("");
  const [order, setOrder] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (status) {
      setName(status.name);
      setColor(status.color);
      setDescription(status.description ?? "");
      setOrder(status.order);
    }
  }, [status]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !status) return;

    setIsSubmitting(true);
    try {
      await onSubmit(status.id, {
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
          <DialogTitle>Edit Status</DialogTitle>
          <DialogDescription>
            Update the status settings below.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-status-name">Name</Label>
            <Input
              id="edit-status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="In Progress"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status-color">Color</Label>
            <Input
              id="edit-status-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status-order">Order</Label>
            <Input
              id="edit-status-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status-description">Description</Label>
            <Textarea
              id="edit-status-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When should this status be used?"
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

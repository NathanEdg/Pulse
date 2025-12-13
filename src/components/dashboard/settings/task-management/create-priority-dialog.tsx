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

interface CreatePriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (priority: {
    name: string;
    color: string;
    description: string;
    order: number;
  }) => Promise<void> | void;
}

export function CreatePriorityDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePriorityDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#EF4444");
  const [description, setDescription] = React.useState("");
  const [order, setOrder] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setName("");
    setColor("#EF4444");
    setDescription("");
    setOrder(1);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        color: color.trim(),
        description: description.trim(),
        order,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Priority</DialogTitle>
          <DialogDescription>
            Define a new priority with a label, color, and order.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="priority-name">Name</Label>
            <Input
              id="priority-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="High Priority"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-color">Color</Label>
            <Input
              id="priority-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-order">Order</Label>
            <Input
              id="priority-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-description">Description</Label>
            <Textarea
              id="priority-description"
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
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

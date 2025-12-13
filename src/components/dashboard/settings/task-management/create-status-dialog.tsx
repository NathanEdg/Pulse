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

interface CreateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (status: {
    name: string;
    color: string;
    description: string;
    order: number;
  }) => Promise<void> | void;
}

export function CreateStatusDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateStatusDialogProps) {
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#3B82F6");
  const [description, setDescription] = React.useState("");
  const [order, setOrder] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setName("");
    setColor("#3B82F6");
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
          <DialogTitle>Create Status</DialogTitle>
          <DialogDescription>
            Define a new status with a label, color, and order.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="status-name">Name</Label>
            <Input
              id="status-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="In Progress"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-color">Color</Label>
            <Input
              id="status-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-order">Order</Label>
            <Input
              id="status-order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-description">Description</Label>
            <Textarea
              id="status-description"
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
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

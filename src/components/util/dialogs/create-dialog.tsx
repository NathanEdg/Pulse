import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Custom field component type
export type CustomFieldComponent = React.ComponentType<{
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}>;

// Field configuration for customization
export interface FieldConfig {
  label?: string;
  description?: string;
  placeholder?: string;
  component?: CustomFieldComponent;
  componentProps?: Record<string, any>;
  hidden?: boolean;
}

export interface CreateDialogProps<T extends z.ZodObject<any>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  defaultValues?: Partial<z.infer<T>>;
  editValues?: Partial<z.infer<T>> | null;
  fieldConfigs?: Partial<Record<keyof z.infer<T>, FieldConfig>>;
  submitLabel?: string;
  cancelLabel?: string;
}

export function CreateDialog<T extends z.ZodObject<any>>({
  open,
  onOpenChange,
  title,
  description,
  schema,
  onSubmit,
  defaultValues,
  editValues,
  fieldConfigs = {},
  submitLabel = "Create",
  cancelLabel = "Cancel",
}: CreateDialogProps<T>) {
  const isEditMode = !!editValues;

  const form = useForm<z.output<T>>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
  });

  // Reset form with edit values when they change
  React.useEffect(() => {
    if (editValues) {
      form.reset(editValues as any);
    } else if (defaultValues) {
      form.reset(defaultValues as any);
    }
  }, [editValues, defaultValues, form]);

  const handleSubmit = async (data: z.output<T>) => {
    try {
      await onSubmit(data);
      if (!isEditMode) {
        form.reset();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const getFieldType = (fieldSchema: any): string => {
    let current = fieldSchema;

    // Unwrap ZodOptional, ZodNullable, ZodDefault
    while (current._def.innerType || current._def.schema) {
      current = current._def.innerType || current._def.schema;
    }

    return current._def.typeName;
  };

  const renderField = (fieldName: string, fieldSchema: any) => {
    const config = fieldConfigs[fieldName as keyof z.infer<T>] || {};

    if (config.hidden) {
      return null;
    }

    // Use custom component if provided
    if (config.component) {
      const CustomComponent = config.component;
      return (
        <FormField
          key={fieldName}
          control={form.control}
          name={fieldName as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{config.label || fieldName}</FormLabel>
              <FormControl>
                <CustomComponent
                  value={field.value}
                  onChange={field.onChange}
                  disabled={form.formState.isSubmitting}
                  {...(config.componentProps || {})}
                />
              </FormControl>
              {config.description && (
                <FormDescription>{config.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    // Default field rendering based on type
    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{config.label || fieldName}</FormLabel>
            <FormControl>
              {getDefaultInputComponent(fieldSchema, field, config)}
            </FormControl>
            {config.description && (
              <FormDescription>{config.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const getDefaultInputComponent = (
    fieldSchema: any,
    field: any,
    config: FieldConfig,
  ) => {
    const type = getFieldType(fieldSchema);

    // Handle boolean (checkbox)
    if (type === "ZodBoolean") {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            disabled={form.formState.isSubmitting}
            checked={field.value || false}
            onChange={(e) => field.onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
        </div>
      );
    }

    // Handle number
    if (type === "ZodNumber") {
      return (
        <Input
          type="number"
          placeholder={config.placeholder}
          disabled={form.formState.isSubmitting}
          name={field.name}
          ref={field.ref}
          value={field.value ?? ""}
          onChange={(e) => {
            const numValue = e.target.valueAsNumber;
            field.onChange(isNaN(numValue) ? undefined : numValue);
          }}
          onBlur={field.onBlur}
        />
      );
    }

    // Handle string - use textarea for fields with "description" in name or long placeholders
    if (type === "ZodString") {
      const useTextarea =
        fieldSchema._def.checks?.some(
          (c: any) => c.kind === "min" && c.value > 100,
        ) || config.placeholder?.toLowerCase().includes("description");

      if (useTextarea) {
        return (
          <Textarea
            placeholder={config.placeholder}
            disabled={form.formState.isSubmitting}
            {...field}
            value={field.value ?? ""}
          />
        );
      }

      return (
        <Input
          type="text"
          placeholder={config.placeholder}
          disabled={form.formState.isSubmitting}
          {...field}
          value={field.value ?? ""}
        />
      );
    }

    // Default fallback
    return (
      <Input
        placeholder={config.placeholder}
        disabled={form.formState.isSubmitting}
        {...field}
        value={field.value ?? ""}
      />
    );
  };

  // Extract field names and schemas from Zod object
  const fields = React.useMemo(() => {
    const shape = schema.shape;
    return Object.entries(shape).map(([name, fieldSchema]) => ({
      name,
      schema: fieldSchema,
    }));
  }, [schema]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-4">
              {fields.map(({ name, schema: fieldSchema }) =>
                renderField(name, fieldSchema),
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                {cancelLabel}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

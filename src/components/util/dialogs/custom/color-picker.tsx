import { type CustomFieldComponent } from "../create-dialog";
import { Input } from "@/components/ui/input";

export const ColorPicker: CustomFieldComponent = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-20 cursor-pointer rounded border"
      />
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#000000"
        className="flex-1"
      />
    </div>
  );
};

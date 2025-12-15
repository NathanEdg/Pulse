import { Checkbox } from "@/components/ui/checkbox";
import { type CustomFieldComponent } from "../create-dialog";

export const CheckboxType: CustomFieldComponent = ({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

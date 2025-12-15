import { type CustomFieldComponent } from "../create-dialog";
import { IconPicker, type IconName } from "@/components/ui/icon-picker";

export const IconPickerType: CustomFieldComponent = ({
  value,
  onChange,
  disabled,
}: {
  value: IconName;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex items-center gap-2">
      <IconPicker value={value} onValueChange={onChange} disabled={disabled} />
    </div>
  );
};

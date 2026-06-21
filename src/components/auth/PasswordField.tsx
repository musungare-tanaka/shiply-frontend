import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  name?: string;
  disabled?: boolean;
}

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  autoComplete,
  name,
  disabled = false,
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-600">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          required={required}
          disabled={disabled}
          value={value}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 pr-11 focus:outline-none focus:ring-2 focus:ring-[#474b4f] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#474b4f]"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;

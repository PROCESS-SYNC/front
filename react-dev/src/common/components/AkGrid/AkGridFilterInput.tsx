import { useState } from "react";
import { X } from "lucide-react";

interface AkGridFilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AkGridFilterInput = ({
  value: externalValue,
  onChange,
  placeholder = "검색...",
}: AkGridFilterInputProps) => {
  const [value, setValue] = useState(externalValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange(e.target.value);
  };

  const handleClear = () => {
    setValue("");
    onChange("");
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full px-2 py-1 pr-6 text-xs
          border border-gray-200 rounded
          focus:outline-none focus:border-blue-400
          bg-white text-gray-700
        "
      />
      {/* 초기화 버튼 - 값 있을 때만 표시 */}
      {value && (
        <button
          onClick={handleClear}
          className="
            absolute right-1
            text-gray-400 hover:text-gray-600
            transition-colors
          "
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default AkGridFilterInput;

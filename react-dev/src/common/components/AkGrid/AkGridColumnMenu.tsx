import { useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface ColumnVisibility {
  id: string;
  header: string;
  visible: boolean;
}

interface AkGridColumnMenuProps {
  x: number;
  y: number;
  columns: ColumnVisibility[];
  onToggle: (columnId: string) => void;
  onClose: () => void;
}

const AkGridColumnMenu = ({
  x,
  y,
  columns,
  onToggle,
  onClose,
}: AkGridColumnMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(
    y,
    window.innerHeight - (columns.length * 36 + 60),
  );

  return (
    <div
      ref={menuRef}
      className="
        fixed z-50 bg-white rounded-lg shadow-lg
        border border-gray-200 py-1 min-w-[200px]
      "
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* 타이틀 */}
      <div className="px-4 py-2 text-xs font-semibold text-gray-400 border-b border-gray-100">
        컬럼 보이기 / 숨기기
      </div>

      {/* 컬럼 목록 */}
      {columns.map((col) => (
        <button
          key={col.id}
          onClick={() => onToggle(col.id)}
          className="
            w-full flex items-center justify-between
            px-4 py-2 text-sm text-gray-700
            hover:bg-gray-50 transition-colors
          "
        >
          <span>{col.header}</span>
          {col.visible ? (
            <Eye size={14} className="text-blue-500" />
          ) : (
            <EyeOff size={14} className="text-gray-400" />
          )}
        </button>
      ))}

      {/* 전체 보이기 */}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <button
          onClick={() => {
            columns.forEach((col) => {
              if (!col.visible) onToggle(col.id);
            });
            onClose();
          }}
          className="
            w-full flex items-center gap-2
            px-4 py-2 text-sm text-blue-500
            hover:bg-blue-50 transition-colors
          "
        >
          <Eye size={14} />
          전체 보이기
        </button>
      </div>
    </div>
  );
};

export default AkGridColumnMenu;

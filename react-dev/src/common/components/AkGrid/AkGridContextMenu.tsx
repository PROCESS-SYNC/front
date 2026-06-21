import { useEffect, useRef } from "react";
import { Download, CheckSquare } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onExportAll: () => void;
  onExportSelected: () => void;
  onExportAllVisible: () => void;
  onExportSelectedVisible: () => void;
  onClose: () => void;
}

const AkGridContextMenu = ({
  x,
  y,
  hasSelection,
  onExportAll,
  onExportSelected,
  onExportAllVisible,
  onExportSelectedVisible,
  onClose,
}: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
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

  // 화면 밖으로 나가지 않도록 위치 조정
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 100);

  return (
    <div
      ref={menuRef}
      className="
        fixed z-50 bg-white rounded-lg shadow-lg
        border border-gray-200 py-1 min-w-[180px]
      "
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* 전체 내보내기 */}
      <div className="px-4 py-1.5 text-xs font-semibold text-gray-400">
        전체 내보내기
      </div>
      <button
        onClick={() => {
          onExportAll();
          onClose();
        }}
        className="
          w-full flex items-center gap-2
          px-4 py-2 text-sm text-gray-700
          hover:bg-gray-50 transition-colors
        "
      >
        <Download size={14} />
        전체 행.xlsx (숨김 포함)
      </button>
      <button
        onClick={() => {
          onExportAllVisible();
          onClose();
        }}
        className="
          w-full flex items-center gap-2
          px-4 py-2 text-sm text-gray-700
          hover:bg-gray-50 transition-colors
        "
      >
        <Download size={14} className="text-blue-500" />
        전체 행.xlsx (숨김 제외)
      </button>

      {/* 선택 행 내보내기 */}
      {hasSelection && (
        <>
          <div className="border-t border-gray-100 mt-1 pt-1 px-4 py-1.5 text-xs font-semibold text-gray-400">
            선택 행 내보내기
          </div>
          <button
            onClick={() => {
              onExportSelected();
              onClose();
            }}
            className="
              w-full flex items-center gap-2
              px-4 py-2 text-sm text-gray-700
              hover:bg-gray-50 transition-colors
            "
          >
            <CheckSquare size={14} />
            선택 행.xlsx (숨김 포함)
          </button>
          <button
            onClick={() => {
              onExportSelectedVisible();
              onClose();
            }}
            className="
              w-full flex items-center gap-2
              px-4 py-2 text-sm text-gray-700
              hover:bg-gray-50 transition-colors
            "
          >
            <CheckSquare size={14} className="text-blue-500" />
            선택 행.xlsx (숨김 제외)
          </button>
        </>
      )}
    </div>
  );
};

export default AkGridContextMenu;

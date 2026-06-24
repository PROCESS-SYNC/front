import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface AkGridPaginationProps<T> {
  table: Table<T>;
}

const AkGridPagination = <T extends object>({
  table,
}: AkGridPaginationProps<T>) => {
  return (
    <div className="flex items-center justify-between px-2 py-3 mt-2">
      {/* 데이터 정보 */}
      <span className="text-sm text-gray-500">
        전체 {table.getFilteredRowModel().rows.length}건 &nbsp;/&nbsp;
        {table.getState().pagination.pageIndex + 1} /{table.getPageCount()}{" "}
        페이지
      </span>

      {/* 페이지 버튼 */}
      <div className="flex items-center gap-1">
        {/* 처음 */}
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* 이전 */}
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>

        {/* 페이지 번호 */}
        {Array.from({ length: table.getPageCount() }, (_, i) => i)
          .filter((i) => {
            const current = table.getState().pagination.pageIndex;
            const pageCount = table.getPageCount();
            let start = current - 2;
            let end = current + 2;
            if (start < 0) {
              end = Math.min(pageCount - 1, end - start);
              start = 0;
            }
            if (end >= pageCount) {
              start = Math.max(0, start - (end - pageCount + 1));
              end = pageCount - 1;
            }
            return i >= start && i <= end;
          })
          .map((i) => (
            <button
              key={i}
              onClick={() => table.setPageIndex(i)}
              className={`
                w-8 h-8 text-sm rounded
                ${
                  table.getState().pagination.pageIndex === i
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              {i + 1}
            </button>
          ))}

        {/* 다음 */}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>

        {/* 마지막 */}
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* 페이지 크기 */}
      <select
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
        className="text-sm border border-gray-200 rounded px-2 py-1 text-gray-700"
      >
        {[10, 20, 50, 100].map((size) => (
          <option key={size} value={size}>
            {size}건
          </option>
        ))}
      </select>
    </div>
  );
};

export default AkGridPagination;

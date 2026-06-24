import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import type {
  SortingState,
  RowSelectionState,
  ColumnPinningState,
  Column,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { EditingCell, AkGridProps, AkGridRef } from "./types";
import AkGridPagination from "./AkGridPagination";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  FilterX,
  RotateCcw,
} from "lucide-react";
import AkGridColumnMenu from "./AkGridColumnMenu";
import AkGridFilterInput from "./AkGridFilterInput";
import AkGridContextMenu from "./AkGridContextMenu";
import { exportExcel } from "./utils/exportExcel";

// 셀 정렬 클래스 헬퍼 함수
const getAlignClass = (align?: "left" | "center" | "right") => {
  switch (align) {
    case "left":
      return "text-left";
    case "right":
      return "text-right";
    case "center":
    default:
      return "text-center";
  }
};

const AkGridInner = <T extends object>(
  // 기본값
  {
    data,
    columns,
    isLoading = false,
    emptyMessage = "데이터가 없습니다.",
    pagination = false,
    pageSize = 10,
    selectable = false,
    selectColumnWidth = 40,
    cellSelectable = false,
    columnResizable = false,
    freezeColumns,
    showFilter = false,
    columnFilter = false,
    isReadOnly = true,
    onRowSelect,
    onRowClick,
    onRowDoubleClick,
    sortable = true,
    height,
    className = "",
    virtualScroll = false,
    rowHeight = 45,
  }: AkGridProps<T>,
  ref: React.Ref<AkGridRef>,
) => {
  // freezeColumns 설정을 ColumnPinnigStat로 변환
  const resolveFreezeColumns = (): ColumnPinningState => {
    if (!freezeColumns) return { left: [], right: [] };

    const resolveKeys = (
      config: string[] | number | undefined,
      side: "left" | "right",
    ): string[] => {
      if (!config) return [];

      // 갯수 방식
      if (typeof config === "number") {
        if (side === "left") {
          return columns
            .slice(0, config)
            .map((col) => (col as { accessorKey?: string }).accessorKey ?? "")
            .filter(Boolean);
        } else {
          return columns
            .slice(-config)
            .map((col) => (col as { accessorKey?: string }).accessorKey ?? "")
            .filter(Boolean);
        }
      }

      // key 배열 방식
      return config;
    };

    return {
      left: resolveKeys(freezeColumns.left, "left"),
      right: resolveKeys(freezeColumns.right, "right"),
    };
  };

  // 고정 컬럼 스타일 헬퍼 함수
  const getPinnedStyles = (column: Column<T>): React.CSSProperties => {
    const isPinnedLeft = column.getIsPinned() === "left";
    const isPinnedRight = column.getIsPinned() === "right";

    return {
      position: isPinnedLeft || isPinnedRight ? "sticky" : "relative",
      left: isPinnedLeft ? `${column.getStart("left")}px` : undefined,
      right: isPinnedRight ? `${column.getAfter("right")}px` : undefined,
      zIndex: isPinnedLeft || isPinnedRight ? 1 : 0,
      width: column.getSize(),
    };
  };

  // 헤더 th 스타일: 세로 sticky + 고정 컬럼 가로 sticky 동시 적용
  const getHeaderThStyles = (column: Column<T>): React.CSSProperties => {
    const isPinnedLeft = column.getIsPinned() === "left";
    const isPinnedRight = column.getIsPinned() === "right";
    return {
      position: "sticky",
      top: 0,
      left: isPinnedLeft ? `${column.getStart("left")}px` : undefined,
      right: isPinnedRight ? `${column.getAfter("right")}px` : undefined,
      zIndex: isPinnedLeft || isPinnedRight ? 11 : 10,
      width: column.getSize(),
    };
  };

  // 마지막 고정 컬럼 판별 헬퍼 함수
  const isLastLeftPinned = (column: Column<T>): boolean => {
    const leftCols = table.getLeftLeafColumns();
    return (
      column.getIsPinned() === "left" &&
      leftCols[leftCols.length - 1]?.id === column.id
    );
  };

  const isLastRightPinned = (column: Column<T>): boolean => {
    const rightCols = table.getRightLeafColumns();
    return column.getIsPinned() === "right" && rightCols[0]?.id === column.id;
  };

  // isReadOnly false면 cellSelectable 자동 true
  const isCellSelectable = !isReadOnly ? true : cellSelectable;

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    resolveFreezeColumns(),
  );
  const [selectedCell, setSelectedCell] = useState<{
    rowId: string;
    cellId: string;
    value: string;
  } | null>(null);
  const [filterVisible, setFilterVisible] = useState(showFilter);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // 편집 중인 셀 상태
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  // 내부 data 상태 (편집 반영용)
  const [internalData, setInternalData] = useState<T[]>(data);
  const [originalData, setOriginalData] = useState<T[]>(data);
  const [modifiedCells, setModifiedCells] = useState<Set<string>>(new Set());
  // 엑셀 내보내기용 상태
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // 컬럼(헤더) 보이기/숨기기 상태
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});
  const [columnMenu, setColumnMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 셀 편집 시작
  const handleStartEdit = (
    rowId: string,
    columnId: string,
    currentValue: string,
  ) => {
    setEditingCell({ rowId, columnId, value: currentValue });
    setEditingValue(currentValue);
  };

  // 셀 편집 저장
  const handleSaveEdit = (rowIndex: number) => {
    if (!editingCell) return;

    if (editingValue !== editingCell.value) {
      setInternalData((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          [editingCell.columnId]: editingValue,
        };
        return updated;
      });

      // 원본 값 기준으로 수정 여부 판단 (A→AA→A 복원 시 수정 취소)
      const originalValue = String(
        (originalData[rowIndex] as Record<string, unknown>)[
          editingCell.columnId
        ] ?? "",
      );
      const key = `${rowIndex}-${editingCell.columnId}`;
      setModifiedCells((prev) => {
        const next = new Set(prev);
        if (editingValue !== originalValue) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    }

    setEditingCell(null);
    setEditingValue("");
  };

  // 셀 편집 취소
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  // 외부 data 변경 시 내부 상태 동기화
  useEffect(() => {
    setInternalData(data);
    setOriginalData(data);
    setModifiedCells(new Set());
  }, [data]);

  useEffect(() => {
    if (!isCellSelectable || !selectedCell) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c") {
        navigator.clipboard.writeText(selectedCell.value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCellSelectable, selectedCell]);

  // columns 전처리 (align, readOnly 등 -> meta로 변환)
  const processedColumns = useMemo(() => {
    return columns.map(({ align, readOnly, reset, height, ...rest }) => ({
      ...rest,
      meta: {
        align,
        readOnly,
        reset,
        height,
      },
    })) as ColumnDef<T>[];
  }, [columns]);

  const table = useReactTable({
    data: internalData,
    columns: processedColumns,
    state: {
      sorting,
      rowSelection,
      columnPinning,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    initialState: {
      pagination: { pageSize },
    },
    columnResizeMode: "onChange",
    enableColumnResizing: columnResizable,
    enableRowSelection: selectable,
    enableFilters: true,
    enableColumnFilters: true,
    defaultColumn: {
      filterFn: "includesString",
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: virtualScroll && !pagination ? table.getRowModel().rows.length : 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // 행 선택 변경 시 콜백
  useEffect(() => {
    if (!onRowSelect) return;
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);
    onRowSelect(selectedRows);
  }, [rowSelection]);

  // ref로 외부에서 제어 가능
  useImperativeHandle(ref, () => ({
    // 체크박스 선택된 행 반환
    getSelectedRows: () =>
      table.getSelectedRowModel().rows.map((row) => row.original),
    // 체크박스 전체 해제
    clearSelection: () => setRowSelection({}),
    // 전체 데이터 반환
    getData: () => internalData,
    // 변경된 행만 반환
    getModifiedRows: () =>
      internalData.filter((_, index) =>
        // 해당 행에 수정된 셀이 하나라도 있으면 포함
        [...modifiedCells].some((key) => key.startsWith(`${index}-`)),
      ),
  }));

  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      {/* 툴바 */}
      {columnFilter && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setFilterVisible((prev) => !prev)}
            className={`
            flex items-center gap-1.5 px-3 py-1.5
            text-sm rounded border transition-colors
            ${
              filterVisible
                ? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }
          `}
          >
            {filterVisible ? (
              <>
                <FilterX size={14} /> 필터 닫기
              </>
            ) : (
              <>
                <Filter size={14} /> 필터
              </>
            )}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div
        className="w-full overflow-hidden border border-gray-200 rounded-lg flex flex-col"
        style={{ height: height ?? undefined }}
      >
        <div
          ref={tableContainerRef}
          className="w-full overflow-auto flex-1 min-h-0"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          <table
            className="text-sm text-left border-collapse"
            style={
              virtualScroll && !pagination
                ? {
                    tableLayout: "fixed",
                    width:
                      (selectable ? selectColumnWidth : 0) +
                      table
                        .getVisibleLeafColumns()
                        .reduce((sum, col) => sum + col.getSize(), 0),
                  }
                : {
                    width: "100%",
                    minWidth:
                      (selectable ? selectColumnWidth : 0) +
                      table
                        .getVisibleLeafColumns()
                        .reduce((sum, col) => sum + col.getSize(), 0),
                  }
            }
          >
            {virtualScroll && !pagination && (
              <colgroup>
                {selectable && <col style={{ width: selectColumnWidth }} />}
                {table.getVisibleLeafColumns().map((col) => (
                  <col key={col.id} style={{ width: col.getSize() }} />
                ))}
              </colgroup>
            )}
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {selectable && (
                    <th
                      style={{
                        width: selectColumnWidth,
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                      }}
                      className="px-3 py-3 border border-gray-200 bg-gray-100 text-center"
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={table.getIsAllPageRowsSelected()}
                          onChange={table.getToggleAllPageRowsSelectedHandler()}
                          className="w-4 h-4 cursor-pointer accent-blue-500"
                        />
                      </div>
                    </th>
                  )}
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`
                      relative px-4 py-3 font-semibold text-gray-700
                      border border-gray-200 whitespace-nowrap
                      ${header.column.getIsPinned() ? "bg-yellow-50" : "bg-gray-100"}
                      ${isLastLeftPinned(header.column) ? "border-r-2 border-r-yellow-400" : ""}
                      ${isLastRightPinned(header.column) ? "border-l-2 border-l-yellow-400" : ""}
                      ${sortable && header.column.getCanSort() ? "cursor-pointer select-none hover:bg-yellow-100" : ""}
                    `}
                      style={{
                        ...getHeaderThStyles(header.column),
                        height: header.column.columnDef.meta?.height,
                      }}
                      onClick={
                        sortable
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setColumnMenu({ x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div
                        className={`flex items-center gap-1 ${
                          header.column.columnDef.meta?.align === "right"
                            ? "justify-end"
                            : header.column.columnDef.meta?.align === "left"
                              ? "justify-start"
                              : "justify-center"
                        }`}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {sortable && header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp size={14} />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronsUpDown size={14} />
                            )}
                          </span>
                        )}
                      </div>
                      {columnResizable && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`
                          absolute top-0 right-0 w-1 h-full cursor-col-resize
                          hover:bg-blue-400
                          ${header.column.getIsResizing() ? "bg-blue-500" : "bg-transparent"}
                        `}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* 바디 */}
            <tbody>
              {/* 필터 입력 행 */}
              {columnFilter && filterVisible && (
                <tr className="bg-white">
                  {selectable && (
                    <td className="px-3 py-2 border border-gray-200" />
                  )}
                  {table.getAllLeafColumns().map((column) => (
                    <td
                      key={column.id}
                      className={`
                      px-2 py-1.5 border border-gray-200
                      ${column.getIsPinned() ? "bg-yellow-50" : "bg-white"}
                      ${isLastLeftPinned(column) ? "border-r-2 border-r-yellow-400" : ""}
                      ${isLastRightPinned(column) ? "border-l-2 border-l-yellow-400" : ""}
                    `}
                      style={getPinnedStyles(column)}
                    >
                      {column.getCanFilter() ? (
                        <AkGridFilterInput
                          value={(column.getFilterValue() as string) ?? ""}
                          onChange={(val) => column.setFilterValue(val)}
                        />
                      ) : null}
                    </td>
                  ))}
                </tr>
              )}

              {isLoading ? (
                // 로딩
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-16 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>로딩 중...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                // 빈 데이터
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-16 text-center text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : virtualScroll && !pagination ? (
                // 가상 스크롤 모드 (padding-row 방식 - stacking context 문제 없음)
                <>
                  {(() => {
                    const virtualItems = rowVirtualizer.getVirtualItems();
                    const paddingTop =
                      virtualItems.length > 0 ? virtualItems[0].start : 0;
                    const paddingBottom =
                      virtualItems.length > 0
                        ? rowVirtualizer.getTotalSize() -
                          virtualItems[virtualItems.length - 1].end
                        : 0;
                    const colSpan = columns.length + (selectable ? 1 : 0);
                    return (
                      <>
                        {paddingTop > 0 && (
                          <tr>
                            <td
                              colSpan={colSpan}
                              style={{
                                height: paddingTop,
                                padding: 0,
                                border: 0,
                              }}
                            />
                          </tr>
                        )}
                        {virtualItems.map((virtualRow) => {
                          const row =
                            table.getRowModel().rows[virtualRow.index];
                          const rowIndex = virtualRow.index;
                          return (
                            <tr
                              key={row.id}
                              style={{ height: `${virtualRow.size}px` }}
                              className={`
                        border-b border-gray-100 transition-colors
                        ${onRowClick || onRowDoubleClick ? "cursor-pointer" : ""}
                        ${!isCellSelectable && row.getIsSelected() ? "bg-blue-50" : ""}
                        hover:bg-gray-50
                      `}
                              onClick={() => {
                                if (selectable) row.toggleSelected();
                                if (onRowClick) onRowClick(row.original);
                              }}
                              onDoubleClick={() => {
                                if (isReadOnly && onRowDoubleClick)
                                  onRowDoubleClick(row.original);
                              }}
                            >
                              {/* 체크박스 */}
                              {selectable && (
                                <td
                                  style={{ width: selectColumnWidth }}
                                  className="px-3 py-3 border border-gray-100"
                                >
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={row.getIsSelected()}
                                      onChange={row.getToggleSelectedHandler()}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 cursor-pointer accent-blue-500"
                                    />
                                  </div>
                                </td>
                              )}

                              {row.getVisibleCells().map((cell) => {
                                const isColumnReadOnly =
                                  cell.column.columnDef.meta?.readOnly;
                                const isSelectedCell =
                                  isCellSelectable &&
                                  selectedCell?.rowId === row.id &&
                                  selectedCell?.cellId === cell.id;
                                const isEditingCell =
                                  editingCell?.rowId === row.id &&
                                  editingCell?.columnId === cell.column.id;
                                const isCellModified = modifiedCells.has(
                                  `${rowIndex}-${cell.column.id}`,
                                );

                                return (
                                  <td
                                    key={cell.id}
                                    id={`cell-${row.id}-${cell.id}`}
                                    className={`
                              px-4 py-3 text-gray-700 whitespace-nowrap
                              border border-gray-100 cursor-pointer
                              ${getAlignClass(cell.column.columnDef.meta?.align)}
                              ${cell.column.getIsPinned() ? "bg-yellow-50" : ""}
                              ${isLastLeftPinned(cell.column) ? "border-r-2 border-r-yellow-400" : ""}
                              ${isLastRightPinned(cell.column) ? "border-l-2 border-l-yellow-400" : ""}
                              ${
                                isEditingCell
                                  ? "p-0 bg-white"
                                  : isCellModified
                                    ? "bg-red-50"
                                    : isSelectedCell
                                      ? "bg-blue-50"
                                      : isCellSelectable
                                        ? "hover:bg-gray-50"
                                        : ""
                              }
                            `}
                                    style={{
                                      ...getPinnedStyles(cell.column),
                                      height:
                                        cell.column.columnDef.meta?.height,
                                    }}
                                    onClick={(e) => {
                                      if (isEditingCell) {
                                        e.stopPropagation();
                                        return;
                                      }
                                      if (isCellSelectable) {
                                        e.stopPropagation();
                                        setSelectedCell({
                                          rowId: row.id,
                                          cellId: cell.id,
                                          value: String(cell.getValue() ?? ""),
                                        });
                                      }
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      if (!isReadOnly && !isColumnReadOnly) {
                                        const currentValue = String(
                                          cell.getValue() ?? "",
                                        );
                                        handleStartEdit(
                                          row.id,
                                          cell.column.id,
                                          currentValue,
                                        );
                                      }
                                    }}
                                  >
                                    {isEditingCell ? (
                                      <div className="relative flex items-center w-full h-full">
                                        <input
                                          type="text"
                                          value={editingValue}
                                          autoFocus
                                          onChange={(e) =>
                                            setEditingValue(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                              handleSaveEdit(rowIndex);
                                            if (e.key === "Escape")
                                              handleCancelEdit();
                                            e.stopPropagation();
                                          }}
                                          onBlur={() =>
                                            handleSaveEdit(rowIndex)
                                          }
                                          className={`
                                    w-full h-full px-4 py-3
                                    border-2 border-blue-400
                                    focus:outline-none text-sm text-gray-700
                                    ${cell.column.columnDef.meta?.reset !== false ? "pr-8" : ""}
                                  `}
                                        />
                                        {cell.column.columnDef.meta?.reset !==
                                          false && (
                                          <button
                                            type="button"
                                            tabIndex={-1}
                                            title="원본 값으로 복원"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              const originalValue = String(
                                                (
                                                  originalData[
                                                    rowIndex
                                                  ] as Record<string, unknown>
                                                )[cell.column.id] ?? "",
                                              );
                                              setEditingValue(originalValue);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-1 p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-100"
                                          >
                                            <RotateCcw size={12} />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext(),
                                      )
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                        {paddingBottom > 0 && (
                          <tr>
                            <td
                              colSpan={colSpan}
                              style={{
                                height: paddingBottom,
                                padding: 0,
                                border: 0,
                              }}
                            />
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                // 일반 모드 - 기존 코드 유지
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={`
                    border-b border-gray-100 transition-colors
                    ${onRowClick || onRowDoubleClick ? "cursor-pointer" : ""}
                    ${!isCellSelectable && row.getIsSelected() ? "bg-blue-50" : ""}
                    hover:bg-gray-50
                  `}
                    onClick={() => {
                      if (selectable) row.toggleSelected();
                      if (onRowClick) onRowClick(row.original);
                    }}
                    onDoubleClick={() => {
                      if (isReadOnly && onRowDoubleClick)
                        onRowDoubleClick(row.original);
                    }}
                  >
                    {/* 체크박스 */}
                    {selectable && (
                      <td
                        style={{ width: selectColumnWidth }}
                        className="px-3 py-3 border border-gray-100"
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={row.getIsSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 cursor-pointer accent-blue-500"
                          />
                        </div>
                      </td>
                    )}

                    {row.getVisibleCells().map((cell) => {
                      const isColumnReadOnly =
                        cell.column.columnDef.meta?.readOnly;
                      const isSelectedCell =
                        isCellSelectable &&
                        selectedCell?.rowId === row.id &&
                        selectedCell?.cellId === cell.id;
                      const isEditingCell =
                        editingCell?.rowId === row.id &&
                        editingCell?.columnId === cell.column.id;
                      const isCellModified = modifiedCells.has(
                        `${rowIndex}-${cell.column.id}`,
                      );

                      return (
                        <td
                          key={cell.id}
                          id={`cell-${row.id}-${cell.id}`}
                          className={`
                          px-4 py-3 text-gray-700 whitespace-nowrap
                          border border-gray-100 cursor-pointer
                          ${getAlignClass(cell.column.columnDef.meta?.align)}
                          ${cell.column.getIsPinned() ? "bg-yellow-50" : ""}
                          ${isLastLeftPinned(cell.column) ? "border-r-2 border-r-yellow-400" : ""}
                          ${isLastRightPinned(cell.column) ? "border-l-2 border-l-yellow-400" : ""}
                          ${
                            isEditingCell
                              ? "p-0 bg-white"
                              : isCellModified
                                ? "bg-red-50"
                                : isSelectedCell
                                  ? "bg-blue-50"
                                  : isCellSelectable
                                    ? "hover:bg-gray-50"
                                    : ""
                          }
                        `}
                          style={{
                            ...getPinnedStyles(cell.column),
                            height: cell.column.columnDef.meta?.height,
                          }}
                          onClick={(e) => {
                            if (isEditingCell) {
                              e.stopPropagation();
                              return;
                            }
                            if (isCellSelectable) {
                              e.stopPropagation();
                              setSelectedCell({
                                rowId: row.id,
                                cellId: cell.id,
                                value: String(cell.getValue() ?? ""),
                              });
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!isReadOnly && !isColumnReadOnly) {
                              const currentValue = String(
                                cell.getValue() ?? "",
                              );
                              handleStartEdit(
                                row.id,
                                cell.column.id,
                                currentValue,
                              );
                            }
                          }}
                        >
                          {isEditingCell ? (
                            <div className="relative flex items-center w-full h-full">
                              <input
                                type="text"
                                value={editingValue}
                                autoFocus
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveEdit(rowIndex);
                                  if (e.key === "Escape") handleCancelEdit();
                                  e.stopPropagation();
                                }}
                                onBlur={() => handleSaveEdit(rowIndex)}
                                className={`
                                w-full h-full px-4 py-3
                                border-2 border-blue-400
                                focus:outline-none text-sm text-gray-700
                                ${cell.column.columnDef.meta?.reset !== false ? "pr-8" : ""}
                              `}
                              />
                              {cell.column.columnDef.meta?.reset !== false && (
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  title="원본 값으로 복원"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const originalValue = String(
                                      (
                                        originalData[rowIndex] as Record<
                                          string,
                                          unknown
                                        >
                                      )[cell.column.id] ?? "",
                                    );
                                    setEditingValue(originalValue);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-1 p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-100"
                                >
                                  <RotateCcw size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 엑셀 내보내기 컨텍스트 메뉴 */}
      {contextMenu && (
        <AkGridContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={
            selectable && table.getSelectedRowModel().rows.length > 0
          }
          // 기존 (숨김 포함)
          onExportAll={() => {
            exportExcel({
              data: internalData,
              columns,
              fileName: "전체데이터",
            });
          }}
          onExportSelected={() => {
            const selectedRows = table
              .getSelectedRowModel()
              .rows.map((row) => row.original);
            exportExcel({
              data: selectedRows,
              columns,
              fileName: "선택데이터",
            });
          }}
          // 숨김 제외
          onExportAllVisible={() => {
            const visibleColumnIds = table
              .getVisibleLeafColumns()
              .map((col) => col.id);
            exportExcel({
              data: internalData,
              columns,
              fileName: "전체데이터_숨김제외",
              visibleColumnIds,
            });
          }}
          onExportSelectedVisible={() => {
            const visibleColumnIds = table
              .getVisibleLeafColumns()
              .map((col) => col.id);
            const selectedRows = table
              .getSelectedRowModel()
              .rows.map((row) => row.original);
            exportExcel({
              data: selectedRows,
              columns,
              fileName: "선택데이터_숨김제외",
              visibleColumnIds,
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* 컬럼 보이기/숨기기 메뉴 */}
      {columnMenu && (
        <AkGridColumnMenu
          x={columnMenu.x}
          y={columnMenu.y}
          columns={table
            .getAllLeafColumns()
            .filter((col) => col.id !== "__select__") // 체크박스 컬럼 제외
            .map((col) => ({
              id: col.id,
              header:
                typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : col.id,
              visible: col.getIsVisible(),
            }))}
          onToggle={(columnId) => {
            table.getColumn(columnId)?.toggleVisibility();
          }}
          onClose={() => setColumnMenu(null)}
        />
      )}

      {/* 페이지네이션 */}
      {pagination && <AkGridPagination table={table} />}
    </div>
  );
};

const AkGrid = forwardRef(AkGridInner) as <T extends object>(
  props: AkGridProps<T> & { ref?: React.Ref<AkGridRef> },
) => React.ReactElement;

export default AkGrid;

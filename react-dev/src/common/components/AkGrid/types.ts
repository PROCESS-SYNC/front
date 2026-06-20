import type { ColumnDef, RowData } from "@tanstack/react-table";

// ColumnDef 확장 타입
export type AkColumnDef<T> = ColumnDef<T> & {
  align?: "left" | "center" | "right";
  readOnly?: boolean;
};

// TanStack Table meta 타입 확장 (내부 처리용)
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right";
    readOnly?: boolean;
  }
}

// 컬럼 freeze 타입 정의
export type FreezeColumnConfig = {
  left?: string[] | number; // key 배열 or 갯수
  right?: string[] | number;
};

export type { ColumnDef };

export interface AkGridProps<T extends object> {
  data: T[];
  columns: AkColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  selectColumnWidth?: number;
  cellSelectable?: boolean;
  columnResizable?: boolean;
  freezeColumns?: FreezeColumnConfig;
  showFilter?: boolean;
  columnFilter?: boolean;
  isReadOnly?: boolean;
  onRowSelect?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  sortable?: boolean;
  height?: string;
  className?: string;
}

export interface AkGridRef {
  getSelectedRows: () => unknown[];
  clearSelection: () => void;
  getData: () => unknown[];
  getModifiedRows: () => unknown[];
}

export interface EditingCell {
  rowId: string;
  columnId: string;
  value: string;
}

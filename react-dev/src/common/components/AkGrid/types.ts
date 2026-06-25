import type { ColumnDef, RowData } from "@tanstack/react-table";

// 컬럼 freeze 타입 정의
export type FreezeColumnConfig = {
  left?: string[] | number; // key 배열 or 갯수
  right?: string[] | number;
};

// 단독 컬럼. ColumnDef 확장 타입
export type AkColumnDef<T> = ColumnDef<T> & {
  align?: "left" | "center" | "right";
  readOnly?: boolean;
  reset?: boolean; // 편집 모드 시 원본 값 복원 버튼 표시
  height?: number; // 컬럼 셀 높이
};

// 그룹 컬럼
export interface AkColumnGroup<T> {
  header: string;
  align?: "left" | "center" | "right";
  columns: AkColumnDef<T>[];
}

// TanStack Table meta 타입 확장 (내부 처리용)
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "center" | "right";
    readOnly?: boolean;
    reset?: boolean;
    height?: number;
  }
}

export type { ColumnDef };

// columnGroups 항목 = 단독 컬럼 or 그룹 컬럼
export type AkColumnGroupItem<T> = AkColumnDef<T> | AkColumnGroup<T>;

// 그룹 컬럼 여부 판별 타입 가드
export const isColumnGroup = <T>(
  item: AkColumnGroupItem<T>,
): item is AkColumnGroup<T> => {
  return "columns" in item && Array.isArray((item as AkColumnGroup<T>).columns);
};

export interface AkGridProps<T extends object> {
  data: T[];
  columns?: AkColumnDef<T>[];
  columnGroups?: AkColumnGroupItem<T>[];
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
  virtualScroll?: boolean;
  rowHeight?: number;
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

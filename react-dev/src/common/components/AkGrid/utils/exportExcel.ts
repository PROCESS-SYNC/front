import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { AkColumnDef } from "../types";

interface ExportOptions<T> {
  data: T[];
  columns: AkColumnDef<T>[];
  fileName?: string;
  sheetName?: string;
  visibleColumnIds?: string[];
}

export const exportExcel = <T extends object>({
  data,
  columns,
  fileName = "내보내기",
  sheetName = "Sheet1",
  visibleColumnIds,
}: ExportOptions<T>) => {
  // accessorKey 추출 헬퍼
  const getAccessorKey = (col: AkColumnDef<T>): string => {
    return (
      ((col as unknown as Record<string, unknown>)["accessorKey"] as string) ??
      ""
    );
  };

  // visibleColumnIds 있으면 보이는 컬럼만 필터링
  const filteredColumns = visibleColumnIds
    ? columns.filter((col) => visibleColumnIds.includes(getAccessorKey(col)))
    : columns;

  // 헤더 추출
  const headers = filteredColumns
    .filter((col) => typeof col.header === "string")
    .map((col) => col.header as string);

  // accessorKey 추출
  const keys = filteredColumns
    .filter((col) => !!getAccessorKey(col))
    .map((col) => getAccessorKey(col));

  // 데이터 변환
  const rows = data.map((row) =>
    keys.reduce(
      (acc, key, index) => {
        acc[headers[index]] = (row as Record<string, unknown>)[key] ?? "";
        return acc;
      },
      {} as Record<string, unknown>,
    ),
  );

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 자동 설정
  const colWidths = headers.map((header) => ({
    wch: Math.max(header.length * 2, 10),
  }));
  worksheet["!cols"] = colWidths;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일 저장
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
};

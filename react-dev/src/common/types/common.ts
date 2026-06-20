// ================================
// 공통 API 응답 타입
// ================================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errorCode: string | null;
}

// ================================
// 공통 페이지네이션 타입
// ================================
export interface PageRequest {
  page: number;
  size: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ================================
// 공통 선택 옵션 타입 (드롭다운 등)
// ================================
export interface SelectOption {
  label: string;
  value: string;
}

// ================================
// 공통 상태 타입
// ================================
export type LoadingState = "idle" | "loading" | "success" | "error";

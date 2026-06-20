import axiosInstance from "@/common/api/axiosInstance";
import type { ApiResponse } from "@/common/types/common";

// ================================
// 요청/응답 타입
// ================================
export interface LoginRequest {
  userId: string;
  loginPw: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userNm: string;
  userRole: string;
}

export interface RefreshResponse {
  accessToken: string;
}

// ================================
// 인증 API
// ================================
export const authApi = {
  // 로그인
  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>("/api/auth/login", data),

  // 로그아웃
  logout: () => axiosInstance.post<ApiResponse<null>>("/api/auth/logout"),

  // Access Token 재발급
  refresh: (refreshToken: string) =>
    axiosInstance.post<ApiResponse<RefreshResponse>>("/api/auth/refresh", {
      refreshToken,
    }),
};

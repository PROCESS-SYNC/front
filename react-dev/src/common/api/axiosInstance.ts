import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import type { ApiResponse } from "@/common/types/common";
import { tokenUtils } from "@/common/utils/tokenutils";

// ================================
// axios 인스턴스 생성
// ================================
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000, // 30초 (AI 분석 시간 고려)
  headers: {
    "Content-Type": "application/json",
  },
});

// ================================
// 요청 interceptor
// ================================
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenUtils.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ================================
// 응답 interceptor
// ================================
let isRefreshing = false; // 토큰 재발급 중복 방지

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<ApiResponse<null>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Access Token 만료 (401) + 재시도 안 한 요청
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 재발급 중복 방지
      if (isRefreshing) return Promise.reject(error);
      isRefreshing = true;

      try {
        const refreshToken = tokenUtils.getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        // Refresh Token으로 Access Token 재발급
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
        );

        const newAccessToken = response.data.data.accessToken;
        tokenUtils.setAccessToken(newAccessToken);

        // 실패했던 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료 → 로그아웃
        tokenUtils.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoginRequest } from "@/common/api/authApi";
import { authApi } from "@/common/api/authApi";
import { tokenUtils } from "@/common/utils/tokenutils";

// ================================
// 상태 타입
// ================================
interface AuthState {
  userId: string | null;
  userNm: string | null;
  userRole: string | null;
  isAuthenticated: boolean;

  // 액션
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

// ================================
// Zustand 스토어
// ================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      userNm: null,
      userRole: null,
      isAuthenticated: false,

      // 로그인
      login: async (data: LoginRequest) => {
        const response = await authApi.login(data);
        const { accessToken, refreshToken, userId, userNm, userRole } =
          response.data.data!;

        tokenUtils.setAccessToken(accessToken);
        tokenUtils.setRefreshToken(refreshToken);

        set({
          userId,
          userNm,
          userRole,
          isAuthenticated: true,
        });
      },

      // 로그아웃
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          tokenUtils.clearTokens();
          set({
            userId: null,
            userNm: null,
            userRole: null,
            isAuthenticated: false,
          });
        }
      },

      // 강제 초기화 (토큰 만료 시)
      clearAuth: () => {
        tokenUtils.clearTokens();
        set({
          userId: null,
          userNm: null,
          userRole: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        userId: state.userId,
        userNm: state.userNm,
        userRole: state.userRole,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

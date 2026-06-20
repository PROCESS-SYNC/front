// ================================
// 토큰 키 상수
// ================================
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ================================
// Access Token
// ================================
export const tokenUtils = {
  // 저장
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  // 조회
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // 삭제
  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // ================================
  // Refresh Token
  // ================================
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // ================================
  // 전체 삭제 (로그아웃)
  // ================================
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // ================================
  // 로그인 여부 확인
  // ================================
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

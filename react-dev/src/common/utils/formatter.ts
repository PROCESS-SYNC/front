import dayjs from "dayjs";

// ================================
// 날짜 포맷
// ================================
export const formatDate = (
  date: string | Date,
  format = "YYYY-MM-DD",
): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

// ================================
// 파일 크기 포맷
// ================================
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

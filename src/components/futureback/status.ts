import type { GoalStatus } from "@/types/domain";

export const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "진행 중",
  achieved: "달성",
  archived: "보류",
  failed: "실패",
};

export const STATUS_ORDER: GoalStatus[] = [
  "active",
  "achieved",
  "archived",
  "failed",
];

// hex 값을 직접 사용 — 테마 토큰과 별개로 상태별 식별색을 유지.
// 선택됐을 때 fg/bg, 비선택일 때는 dot 색으로 사용.
export const STATUS_COLOR: Record<
  GoalStatus,
  { fg: string; bg: string; dot: string }
> = {
  active: { fg: "#ffffff", bg: "#2563eb", dot: "#2563eb" }, // 파랑
  achieved: { fg: "#ffffff", bg: "#16a34a", dot: "#16a34a" }, // 초록
  archived: { fg: "#1f2937", bg: "#f59e0b", dot: "#f59e0b" }, // 호박
  failed: { fg: "#ffffff", bg: "#dc2626", dot: "#dc2626" }, // 빨강
};

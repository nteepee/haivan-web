import { Nunito } from "next/font/google";

/**
 * Nunito cho trang 404 gốc và global-error: hai trang này nằm ngoài `[lang]/layout` (nơi đặt biến --font-nunito) nên không thừa hưởng phông;
 * thiếu biến thì token --font-display mất hiệu lực và trình duyệt rơi về phông serif. Cùng cấu hình với layout nên dùng chung file phông.
 */
export const statusFont = Nunito({ subsets: ["vietnamese", "latin"], display: "swap" });

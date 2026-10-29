// Cho `node --import ./scripts/register-ts.mjs script.ts` import mã nguồn app (alias "@/", đường dẫn không đuôi)
// mà không cần thêm bundler. Node 22.18+ tự bỏ kiểu TypeScript; hook này chỉ lo phần phân giải module.
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);

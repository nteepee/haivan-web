import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APP = new URL("../", import.meta.url);
const SRC = new URL("src/", APP);
const EXTENSIONS = [".ts", ".tsx", "/index.ts"];
// Hai module chỉ có nghĩa trong Next; ở script Node thuần chúng phải là no-op.
const STUBS = new Map([
  ["server-only", "data:text/javascript,export {}"],
  ["next/cache", "data:text/javascript,export const cacheLife = () => {}; export const cacheTag = () => {}"],
]);

function withExtension(base) {
  for (const ext of EXTENSIONS) {
    const candidate = new URL(base.href + ext);
    if (existsSync(fileURLToPath(candidate))) return candidate.href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS.get(specifier);
  if (stub) return { url: stub, shortCircuit: true };
  let target = null;
  if (specifier.startsWith("@/")) target = new URL(specifier.slice(2), SRC);
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith(APP.href) && !context.parentURL.includes("/node_modules/") && !/\.\w+$/.test(specifier)) {
    target = new URL(specifier, context.parentURL);
  }
  if (target) {
    const url = existsSync(fileURLToPath(target)) && /\.\w+$/.test(target.pathname) ? target.href : withExtension(target);
    if (url) return { url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

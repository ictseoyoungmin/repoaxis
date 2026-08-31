import { service } from "./service.js";
import "./service.js";
import { helper } from "./lib";
import chalk from "chalk";
export { value } from "./reexport.js";
export * from "./reexport.js";
const common = require("./common.cjs");
export async function loadLazy() {
  return import("./lazy.js");
}
export async function missing() {
  return import("./missing.js");
}
console.log(service, helper, chalk, common);

import assert from "node:assert/strict";
import { companyPrefix, formatDocumentNumber, shanghaiStamp, shortNumber } from "./contract-number.ts";

const when = new Date("2026-11-01T02:30:00.000Z");

assert.equal(companyPrefix("Magpie Studio"), "MAGPIE-STUDIO");
assert.equal(companyPrefix("Shenzhen Magpie Technology Co., Ltd."), "SHENZHEN-MAGPIE");
assert.equal(companyPrefix("深圳市喜鹊派科技有限公司"), "MAGPIE-STUDIO");
assert.equal(companyPrefix("Acme"), "ACME-CO");

const stamp = shanghaiStamp(when);
assert.equal(stamp.year, "2026");
assert.equal(stamp.date, "1101");

assert.equal(
  formatDocumentNumber("Magpie Studio", when, "8F2K"),
  "MAGPIE-STUDIO-2026-1101-8F2K",
);
assert.equal(
  formatDocumentNumber("Sample Studio", when, "3Q9P", "NDA"),
  "NDA-SAMPLE-STUDIO-2026-1101-3Q9P",
);
assert.equal(shortNumber("REQ", when, "A1B2"), "REQ-2026-1101-A1B2");

console.log("contract number format ok");

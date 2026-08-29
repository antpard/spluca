import test from "node:test";
import assert from "node:assert/strict";

import { absoluteUrl, sameAsLinks } from "../src/lib/seo.ts";

test("absoluteUrl normalizes site paths without trailing slashes", () => {
  assert.equal(absoluteUrl("/blog/example"), "https://spluca.org/blog/example");
  assert.equal(absoluteUrl("/"), "https://spluca.org");
  assert.equal(absoluteUrl("https://example.com/page"), "https://example.com/page");
});

test("sameAsLinks excludes empty social profiles", () => {
  assert.deepEqual(sameAsLinks(), [
    "https://github.com/antpard",
    "https://www.linkedin.com/in/antpard",
  ]);
});

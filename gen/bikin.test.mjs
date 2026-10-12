import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { bikin } from "./bikin.mjs"

const stat = { repos: 186, stars: 4, followers: 18, since: "2021-12-29" }
const rang = readFileSync(new URL("./rang.txt", import.meta.url), "utf8").split("\n").filter(Boolean)
const svg = bikin({ stat, rang, today: new Date("2026-10-12T00:00:00Z") })

test("size under 60 KB", () => {
  assert.ok(Buffer.byteLength(svg) < 60000)
})

test("no scripts, no external refs", () => {
  for (const bad of ["<script", "foreignObject", "href=", "<image", "@import", "url(http"]) {
    assert.ok(!svg.includes(bad), bad)
  }
  const urls = svg.match(/https?:\/\/[^"'\s<]+/g) ?? []
  assert.deepEqual(urls, ["http://www.w3.org/2000/svg"])
})

test("no token shapes", () => {
  assert.ok(!/ghp_|gho_|ghs_|github_pat_/.test(svg))
})

test("mono text stays inside the card", () => {
  const re = /<text class="(?!thai)[^"]*" x="(\d+)"[^>]*>([^<]*)/g
  let n = 0
  for (const [, x, body] of svg.matchAll(re)) {
    n++
    assert.ok(Number(x) + [...body].length * 8 <= 810, `${x} ${body}`)
  }
  assert.ok(n > 10)
})

test("portrait lines stay inside the card", () => {
  for (const l of rang) assert.ok(32 + l.length * 6.7 <= 415, l)
})

test("computed values show up", () => {
  assert.match(svg, /4y 9m · since 2021-12-29/)
  assert.match(svg, /186 \(private \+ public\)/)
})

test("xml special chars are escaped", () => {
  const out = bikin({ stat, rang: ["<&>"], today: new Date("2026-10-12T00:00:00Z") })
  assert.ok(out.includes("&lt;&amp;&gt;"))
})

test("missing stat field throws", () => {
  for (const k of ["repos", "stars", "followers", "since"]) {
    const bad = { ...stat }
    delete bad[k]
    assert.throws(() => bikin({ stat: bad, rang }), new RegExp(k))
  }
  assert.throws(() => bikin({ stat: { ...stat, repos: NaN }, rang }), /repos/)
})

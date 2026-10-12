import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dustat } from "./dustat.mjs"

const W = 830
const KOB = 14
const RANGX = 32
const RANGY = 52
const KEYX = 420
const VALX = 500
const TOPKUE = 52
const HEADH = 30
const ROWH = 21
const SAIJAI = 798

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function umur(since, today) {
  const [sy, sm, sd] = since.split("-").map(Number)
  const m = (today.getUTCFullYear() - sy) * 12 + (today.getUTCMonth() + 1 - sm) - (today.getUTCDate() < sd ? 1 : 0)
  return `${Math.floor(m / 12)}y ${m % 12}m`
}

function chek(stat) {
  for (const k of ["repos", "stars", "followers"]) {
    if (typeof stat?.[k] !== "number" || !Number.isFinite(stat[k])) throw new Error(`stat missing: ${k}`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(stat?.since))) throw new Error("stat missing: since")
}

const CSS = `text{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;white-space:pre}
.thai{font-family:Thonburi,"Leelawadee UI","Noto Sans Thai",ui-sans-serif,sans-serif;font-size:14px}
.rang text{font-size:11px}
.k{fill:#9A95AD}.v{fill:#E9E6F2}.a{fill:#FF8DB9}
@media (prefers-reduced-motion:no-preference){
.rang text{animation:ban .35s ease-out both;animation-delay:calc(var(--i)*45ms)}
.kursor{animation:kip 1.1s steps(1) infinite}
}
@keyframes ban{from{opacity:0}to{opacity:1}}
@keyframes kip{50%{opacity:0}}`

export function bikin({ stat, rang, today = new Date() }) {
  chek(stat)
  const meaw = [
    ["head", "me"],
    ["row", "box", "macOS"],
    ["row", "editor", "VS Code"],
    ["row", "online", `${umur(stat.since, today)} · since ${stat.since}`],
    ["row", "job", "software engineer + freelance"],
    ["head", "code"],
    ["row", "daily", "Lua, C#, TS, JS, Python"],
    ["row", "stack", "FiveM/RedM, React, Vue, .NET"],
    ["head", "reach"],
    ["row", "mail", "peachchziza@gmail.com"],
    ["row", "fb, ig", "tarkliyy"],
    ["head", "github"],
    ["row", "repos", `${stat.repos} (private + public)`],
    ["row", "stars", stat.stars],
    ["row", "followers", stat.followers],
  ]
  let y = TOPKUE + 22
  const info = []
  for (const [kind, a, b] of meaw) {
    if (kind === "head") {
      y += HEADH - ROWH + 9
      info.push(`<text class="a" x="${KEYX}" y="${y}">${esc(a)}</text>`)
      info.push(
        `<line x1="${KEYX + a.length * 8 + 12}" y1="${y - 4}" x2="${SAIJAI}" y2="${y - 4}" stroke="#6F6A82" stroke-opacity=".6"/>`,
      )
      y += ROWH
    } else {
      info.push(`<text class="k" x="${KEYX}" y="${y}">${esc(a)}</text>`)
      info.push(`<text class="v" x="${VALX}" y="${y}">${esc(b)}</text>`)
      y += ROWH
    }
  }
  const rangEnd = RANGY + (rang.length - 1) * KOB
  const lineY = rangEnd + 26
  const thaiY = lineY + 28
  const H = thaiY + 30
  const portrait = rang
    .map((l, i) => `<text x="${RANGX}" y="${RANGY + i * KOB}" style="--i:${i}" xml:space="preserve">${esc(l)}</text>`)
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="tarkliyy profile card">
<title>tarkliyy@thailand</title>
<style>${CSS}</style>
<defs><linearGradient id="kradat" gradientUnits="userSpaceOnUse" x1="0" y1="${RANGY - 12}" x2="0" y2="${rangEnd}"><stop offset="0" stop-color="#FF8DB9"/><stop offset="1" stop-color="#B84F7C"/></linearGradient></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="#0C0B10" stroke="#6F6A82" stroke-opacity=".6"/>
<g class="rang" fill="url(#kradat)">${portrait}</g>
<text class="a" x="${KEYX}" y="${TOPKUE}" xml:space="preserve">tarkliyy@thailand<tspan class="kursor"> █</tspan></text>
${info.join("\n")}
<line x1="${RANGX}" y1="${lineY}" x2="${SAIJAI}" y2="${lineY}" stroke="#6F6A82" stroke-opacity=".6"/>
<text class="thai v" x="${RANGX}" y="${thaiY}">&gt; กูนี่แหละ Batman ในชีวิตจริงแทนที่กูจะล้างแค้นกูล้างจาน</text>
</svg>
`
}

async function main() {
  const login = process.env.GITHUB_REPOSITORY_OWNER || "tarkliyy"
  const stat = await dustat(process.env.PROFILE_TOKEN, login)
  const rang = readFileSync(new URL("./rang.txt", import.meta.url), "utf8").split("\n").filter(Boolean)
  const svg = bikin({ stat, rang })
  mkdirSync("out", { recursive: true })
  writeFileSync("out/neofetch.svg", svg)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`bikin failed: ${e.message}`)
    process.exit(1)
  })
}

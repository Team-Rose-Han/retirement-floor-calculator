# Your Safe Retirement Floor

A members-only tool for the 30 Minute Money community (Week 8). It answers one
question: what's the minimum your Money Flywheel needs to invest for retirement
every month so Future You is covered? Everything above that floor is guilt-free
money for living now, which is the program's "floor-then-dreams" framework.

Static site: no server, no database, no login, no data stored. Same look, gate
and deploy as the Cashflow Planner and the Money Flywheel Mapper.

## What it does

Six inputs, one screen, results update live as you type:

1. Your age
2. What you've already saved for retirement
3. What your retirement will cost per month (today's dollars)
4. When you want retirement to start (slider, 55 to 75, can't go at or below your age)
5. What you're putting in monthly right now
6. Monthly Social Security or pension you expect (prefilled at $2,000)

The result card shows the floor in big type, then one of three states:

| State | When | What shows |
|---|---|---|
| Above the floor | contributions ≥ floor | Green check. Dream money = contributions minus floor. |
| Already funded | floor = $0 | Savings alone grow past the target (or benefits cover the retirement month). |
| Below the floor | contributions < floor | The gap in $/month. No percentage, no shame. |

Under that, "What your money grows into" projects the starting amount plus
monthly contributions year by year (starting amount, contributions, growth) as a
stacked chart with the 25x target drawn as a dashed line. Two chips switch the
projection between what the student puts in now and their floor.

Under 60 months to retirement, a short-runway line suggests a fee-only fiduciary
advisor.

## The math

All math in today's dollars with one fixed real return (nothing adjustable by the
student; the two numbers live in `config.js` and are printed on the card).

- Real annual return `r = 6%` (about 8% average market growth minus inflation). Monthly `i = r / 12`.
- Months to retirement `n = (retirement age − age) × 12`.
- Target portfolio `T = max(0, monthly spend − monthly SS/pension) × 12 × 25`.
- Projected value of what's already saved `FV = balance × (1 + i)^n`.
- Gap `G = max(0, T − FV)`.
- Floor `= G × i / ((1 + i)^n − 1)`, rounded up to the nearest $10.

The 4% rule (25x) handles inflation after retirement; the real return handles it
before. Keeping both in today's dollars is consistent, not double-counting.

## Files

| File | What it is |
|---|---|
| `index.html` | Page shell: gate, inputs, result card, disclaimer |
| `app.js` | The logic: gate, math, live rendering, projection chart, iframe height |
| `config.js` | Words and numbers Rose's team can edit safely: tool name, tagline, bullets, access code hash, embed hosts, return rate, multiple, Social Security prefill, state copy, disclaimer |
| `styles.css` | Look and feel (teal / purple on near-white; dark mode has its own tokens) |
| `logo.png` | The 30 Minute Money logo |

## Publish (GitHub Pages)

The public version is served from the `main` branch of the
`Team-Rose-Han/retirement-floor-calculator` repo at
https://team-rose-han.github.io/retirement-floor-calculator/

To publish a new version, put the contents of this folder (not the folder itself)
at the root of that repo and push to `main`; GitHub Pages picks it up within a
minute or two. Bump the `?v=` number on the two script tags and the stylesheet
link in `index.html` with each release so members' browsers load the new files
instead of cached ones.

First-time setup: in the repo, Settings → Pages → Source: "Deploy from a branch",
Branch: `main`, folder `/ (root)`, Save.

## Put it inside Circle (custom page)

```html
<div style="max-width:720px;margin:0 auto">
  <iframe id="floor" src="https://team-rose-han.github.io/retirement-floor-calculator/" title="Your Safe Retirement Floor"
    style="width:100%;height:1900px;border:0;border-radius:16px;background:#ffffff"
    loading="lazy"></iframe>
</div>
<script>
  window.addEventListener("message", function (e) {
    if (e.data && e.data.floorHeight) {
      document.getElementById("floor").style.height = (e.data.floorHeight + 40) + "px";
    }
  });
</script>
<p style="font-size:13px;color:#6b6661">On the phone app, or if the tool doesn't load,
  <a href="https://team-rose-han.github.io/retirement-floor-calculator/" target="_blank" rel="noopener">open it full screen</a>
  and use the access code <b>FREEDOM</b>.</p>
```

If Circle strips the `<script>` part, the iframe keeps a fixed height and scrolls
inside itself; raise the `height` value if the bottom is cut off. Restrict the page
to the spaces or access groups that should see it.

## How the gate works

Same as the Mapper and the Planner: embedded on an allowed host (`allowedEmbedHosts`)
it asks for nothing; opened directly it asks for the access code once and remembers
the unlock in that browser (shared with the other tools when they're on the same
domain). The page is marked `noindex`. To change the code, run
`printf 'NEWCODE' | shasum -a 256` and paste the result into `accessCodeHash`.

## Copy rules

Student-facing copy follows the program voice: no em dashes, contractions always,
second person, zero shame. Banned words: just, really, very, actually, honestly,
kind of, manage, stability, discipline.

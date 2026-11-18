// ============================================================
//  Your Safe Retirement Floor — settings Rose's team can edit safely
//  Everything in this file is words and numbers. No logic lives here.
// ============================================================
window.FLOOR_CONFIG = {
  brand: "30 Minute Money",
  toolName: "Your Safe Retirement Floor",
  eyebrow: "Week 8",
  tagline: "This tool finds the minimum that your Money Flywheel needs to invest for retirement every month so that Future You will be covered no matter what.",
  // Two bullets under the tagline. "lead" is the bold part, "text" follows the arrow.
  bullets: [
    { lead: "Above the floor", text: "everything extra is eligible to put into the Spending, Upcoming, or Dream Fund guilt-free, hence “floor-then-dreams”" },
    { lead: "Below the floor", text: "hitting this becomes your next Financial Goal after getting 1 month ahead on bills, paying off credit card debt, maxing out 401(k) match, and saving up a 6-month emergency fund" },
  ],

  // ---- Gate -------------------------------------------------
  // Same access code as the Money Flywheel Mapper and the Cashflow Planner. Change it by hashing a new code:
  //   printf 'NEWCODE' | shasum -a 256      (Mac terminal)
  // The code is compared in UPPERCASE, so "freedom" and "FREEDOM" both work.
  accessCodeHash: "ecdee7b6d15473195b595217a51932ca794692632c77bb37059209c4e82e02fb",
  // When the tool is embedded (iframe) on one of these hosts, no code is asked.
  allowedEmbedHosts: ["programs.rosehan.com", "rosehan.com", "circle.so"],
  gateLede: "This tool is for members. Enter the access code from the community page to continue.",
  gateWrong: "That code didn't match. It's on the Safe Retirement Floor page inside the community.",
  gateNeedsHttps: "This page needs to be opened over https to check the code.",

  // ---- The math (fixed, printed on the tool's face) ------------
  realReturn: 0.06,        // real annual return: about 8% market growth minus inflation
  spendingMultiple: 25,    // target portfolio = 25x yearly spending (the 4% rule)
  ssPrefill: 2000,         // Social Security / pension prefill, $/month
  shortRunwayMonths: 60,   // under this many months to retirement, show the fiduciary line
  assumptionsLine: "Fixed assumptions: 6% real return (assumes about 8% average market growth minus inflation, so every number stays in today's dollars). Target of 25x your yearly spending (the level where growth outruns what you take out).",

  // ---- Result copy ----------------------------------------------
  aboveTitle: "Future You is covered.",
  aboveLine: "Everything above your floor is dream money.",
  fundedTitle: "Already funded.",
  fundedLine: "What you've saved will grow past your target on its own. Your floor is $0. Anything you keep adding is extra safety or dream money.",
  benefitsCoverLine: "Your expected benefits cover your retirement month. Your floor is $0. Anything you keep adding is extra safety or dream money.",
  shortRunwayLine: "Short runway. This close to retirement, a session with a fee-only fiduciary advisor is worth it.",

  // ---- Disclaimer (always visible at the bottom) ----------------
  disclaimer: "Illustrative, based on long-run US market history. Not a prediction and not financial advice. Your real plan depends on your situation. Revisit this number at your Annual Money Date.",
};

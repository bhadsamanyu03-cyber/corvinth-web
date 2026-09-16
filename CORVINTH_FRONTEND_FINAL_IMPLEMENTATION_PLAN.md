# Global precedence rules

## Semantic-sweep capability-publication gate — applies to every public surface

Until Semantic sweep has real deployed-DINO calibration evidence, is enabled,
and has validated fixtures supporting public claims, **no public surface may
render semantic, DINO, or transformed-variant claims or UI anywhere on the
site.** This includes, without limitation, screen copy, product visuals,
demos, FAQs, founder copy, access-form fields and mappings, metadata,
navigation, footer copy, social/link-preview metadata, and any other public
surface.

Where downstream material is subject to this gate, **omit it**. Do not invent
replacement capability claims. This global rule supersedes every conflicting
or stale downstream instruction until the capability-publication gate passes.

## Fixed integration-duration claims — applies globally

`Deploy this afternoon`, `within 24 hours`, `live in a day`, and every
equivalent fixed-duration integration or access promise are superseded.
Do not replace them with another unsupported duration. Preserve only the
positioning: **bounded integration surface**.

## Resolved architecture findings — applies to every screen

- **Platform scope remains locked public architecture.** Keep platform-scoped
  matching, references, evidence, and metadata as the frontend direction. The
  Shield-isolation reconciliation proceeds separately in the backend before
  release; do not weaken or remove the public platform-scope boundary here.
- **`remove_content` is advisory.** It is a requested action returned by
  Corvinth, not proof that Corvinth executes removal or obligates the platform
  to do so. The platform controls the actual enforcement outcome. Do not render
  backend action values as Corvinth-executed moderation.
- **Durable-fetch finding resolved.** The legacy durable-URL path is verified
  unreachable. Keep the locked ephemeral-fetch architecture and associated
  public claims; no frontend retreat or backend change follows from that
  legacy path.
- **No durable image-byte storage is verified.** Keep and publish that exact
  claim. Verified testing covers the worker path as well as Corvinth compute;
  do not substitute the broader and inaccurate `NO IMAGE STORAGE` wording.

---

# Screen 01 

# SCREEN 01 — HERO / FIRST IMPRESSION — FINAL IMPLEMENTATION PLAN

## 1. Job of the screen

The first screen has one job:

> **Make a platform CTO understand what Corvinth is, what pain it solves, and why they should keep scrolling — within a few seconds.**

Screen 01 should establish:

> **Reported content can return. Corvinth gives platforms detection infrastructure to find copies of content they choose to track.**

The visitor should leave the first viewport understanding:

> **Corvinth is image-safety detection infrastructure for platforms with user-generated content.**

Do not explain yet:

-  TIDA 
-  FTC / penalties 
-  PDQ 
-  DINOv2 
-  semantic sweep 
-  Managed vs Customer Compute architecture in depth 
-  data retention mechanics 
-  case architecture 
-  evidence architecture 
-  tenant-isolation implementation details 

Those belong to later screens.

---

## 2. Remove the current hero positioning

Delete:

> `Protect your platform from known NCII — before it spreads.`

This incorrectly makes NCII the product category and implies prevention/enforcement.

Delete:

> `Privacy-first image and video safety infrastructure`

Do not advertise video unless separately approved as a current capability.

Delete:

> `Deploy in an afternoon.`

No unsupported integration-time promise.

Delete:

> `No images ever leave your servers.`

This is false for Managed Compute.

Delete the current:

> `POWERED BY PDQ + DINOV2`

hero emphasis.

The underlying detection technologies belong on the Technical Foundation screen, not in the first product impression.

---

## 3. Category label

Use:

> `IMAGE SAFETY INFRASTRUCTURE`

Do not use:

-  NCII 
-  TIDA 
-  compliance-ready 
-  AI-powered 
-  privacy-first 
-  PDQ / DINOv2 
-  Shield 
-  Pulse 

in the primary hero story.

---

## 4. Headline

Lock:

# **Reported content comes back.**

# **Corvinth helps you find the copies.**

This is intentionally problem-first.

It communicates the recurrence/reupload pain without implying that Corvinth itself moderates or removes content.

Do not change this to:

> `Corvinth catches it.`

The final wording should avoid implying universal detection success.

---

## 5. Supporting copy

Use:

> **Image safety infrastructure for platforms with user-generated content. Corvinth helps your team find copies of content it has chosen to track — across existing platform content and new uploads.**

Then:

> **Corvinth returns the detection result. Your platform decides what happens next.**

The supporting copy should establish:

-  what Corvinth is; 
-  who it is for; 
-  the job it performs; 
-  the detection/enforcement boundary. 

Do not make the hero explain the underlying matching methods.

Do not imply every report automatically becomes a Corvinth reference.

---

## 6. Desktop composition — two-column hero

Do **not** return to the old narrow centered stack.

Desktop should use a deliberate two-column layout.

### LEFT

Contains:

1.  category label; 
2.  pain-first headline; 
3.  supporting copy; 
4.  CTA pair; 
5.  compact trust strip. 

### RIGHT

Contains:

> **a compact Corvinth detection-result / product-proof card**

not code, not a dashboard, and not a full interactive demo.

Conceptually:

```
```

```
┌─────────────────────────────────────┐
│ PLATFORM-SCOPED DETECTION           │
│                                     │
│ PLATFORM-SELECTED IMAGE             │
│            ↓                        │
│ DETECTION REFERENCE                 │
│            ↓                        │
│ PLATFORM-SCOPED MATCHING            │
│ existing content · new uploads      │
│            ↓                        │
│ MATCH FOUND                         │
│                                     │
│ Matched object    obj_••92          │
│ Platform scope    same platform     │
└─────────────────────────────────────┘
```

The purpose of this visual is:

> **show the product outcome before explaining the architecture.**

---

## 7. Remove the current SDK/code hero completely

The current Node/Python code card must not survive.

Do not repair or modernize it.

Delete:

- `npm install @corvinth/sdk` 
-  Python installation example 
-  SDK-only presentation 
-  local-only hash-compute framing 
- `no pixels sent` 
- `checkHash` 
- `result.action` 
- `content_removed` 
- `blocked: true` 
- `classification` 
- `review_queue` 
-  stale response fields 
-  implied automatic enforcement 

The current code visual makes Corvinth look like a **Customer-Compute / Mode-B-only SDK product**.

That is incorrect.

Screen 01 must remain compatible with both:

> **Managed Compute**

and:

> **Customer Compute**

The detailed compute-model explanation belongs later.

---

## 8. Product-proof visual rules

The right-side card should demonstrate:

> **platform-selected content → detection reference → platform-scoped matching → match found**

It should **not** show:

-  case evidence as a universal result; 
-  moderation controls; 
- `allow / review / block`; 
-  content removal; 
-  policy decisions; 
-  legal status; 
-  compliance status; 
-  fake latency; 
-  fake accuracy; 
-  fake customer names; 
-  fake usage counts; 
-  fake case queues; 
-  PDQ / DINOv2; 
-  dashboard analytics. 

Do not show:

> `Evidence available`

as a universal contract.

Screen 06 owns the richer detection-result/evidence presentation.

The hero needs only enough proof to show what Corvinth does.

> Keep the existing Screen 01 proof content:
>
> **PLATFORM-SELECTED IMAGE**
>
> ↓
>
> **PLATFORM-SCOPED MATCHING**
>
> ↓
>
> **MATCH FOUND / MATCHED OBJECT**
>
> But present it visually as:
>
> **Three clean cards connected horizontally or vertically.**
>
> **Visually, not literally as terminal text.**
>
> This should make the product outcome understandable immediately rather than presenting it as one dense technical panel.
>
> Do **not** import:
>
> - `s3://...` 
> -  version IDs 
> - `VIEW EVIDENCE` 
> -  fake score 
> -  report ID 
>
> The underlying Screen 01 product-proof contract remains unchanged.

---

## 9. CTA hierarchy

Primary:

> **See it work**

Secondary:

> **Request access**

This ordering is intentional.

A cold technical buyer should be invited to inspect the product before being asked to submit an access request.

`See it work` must route to the real controlled Corvinth demo/product proof.

Do not replace it with:

> `See how it works`

because that sounds like explanatory navigation rather than product proof.

Do not use:

> `Request early access`

Standardize public terminology on:

> **Request access**

---

## 10. Trust strip

Under the CTAs, use:

> `PLATFORM-SCOPED MATCHING · MANAGED OR CUSTOMER COMPUTE · NO DURABLE IMAGE-BYTE STORAGE`

Keep this visually secondary.

Its purpose is to indicate that real architecture exists underneath the product without turning Screen 01 into an architecture lesson.

Do not shorten:

> `NO DURABLE IMAGE-BYTE STORAGE`

to:

> `NO IMAGE STORAGE`

because Corvinth does durably retain detection representations and associated product state.

---

## 11. Navigation

Remove stale public product terminology:

- `Shield` 
- `Pulse` 

Recommended navigation:

> `How it works`

> `Architecture`

> `Live demo`

> `Docs`

> **Request access**

`Pricing` is absent from this rebuild.

Delete the current pricing section and do not include `Pricing` in primary
navigation, the mobile menu, the footer, or access-form copy. Do not publish
`$99 / $299` or infer replacement commercial terms. Pricing may return only
after a separately locked current pricing section and commercial strategy exist.

---

## 12. Category boundary

The hero must remain category-agnostic.

Do not use:

-  NCII 
-  revenge porn 
-  CSAM 
-  abuse category 
-  consent classification 
-  harmful-content classifier 

as the primary product definition.

Corvinth operates on:

> **content the platform chooses to track**

The product does not need to know the substantive reason the platform selected that content.

---

## 13. Enforcement boundary

The hero must never imply that Corvinth decides what happens to content.

Do not show:

-  blocked 
-  removed 
-  violation 
-  allow 
-  review 
-  quarantine 
-  policy outcome 

The product proof ends at:

> **MATCH FOUND**

and the supporting boundary remains:

> **Corvinth returns the detection result. Your platform decides what happens next.**

### Resolved backend interpretation

`remove_content` is an advisory/requested backend action. It does not mean
Corvinth executes removal or obligates the platform to remove anything. No
backend removal-action rewrite follows from this frontend reconciliation.

Keep the public boundary above: Corvinth returns detection; the platform owns
the actual enforcement outcome. Do not render `content_removed`,
`remove_content`, or another backend action value as Corvinth-executed
moderation.

---

## 14. Do not make Screen 01 a compliance page

Do not include:

- `48 HOURS` 
-  FTC 
-  TIDA 
-  civil-penalty figures 
-  statutory timelines 
-  regulator logos 
-  compliance-ready 
-  legal urgency 

The first impression should be driven by the **product problem**, not regulatory fear.

The regulatory screens later in the page own that context.

---

## 15. Visual direction

Preserve the current Corvinth visual identity:

-  near-black background; 
-  green accent; 
-  white primary typography; 
-  restrained technical aesthetic; 
-  monospace micro-labels; 
-  thin borders; 
-  generous negative space; 
-  serious infrastructure feel. 

But improve the current composition:

> I would move to a roughly **55 / 45 desktop composition**:
>
> **Left:** positioning + headline + copy + CTAs
>
> **Right:** live-looking detection result
>
> Treat the roughly **55 / 45** split as composition guidance, not a rigid pixel rule.
>
> The goal is to avoid either making the proof card tiny or letting it overpower the headline.

-  use more horizontal width; 
-  make the headline visually confident; 
-  give the right-side product card meaningful presence; 
-  remove excessive empty space; 
-  avoid decorative SaaS illustrations; 
-  avoid cyber-security/neon theatrics; 
-  avoid giant gradients; 
-  avoid fake terminal UI. 

The screen should feel like:

> **serious platform infrastructure with an observable product outcome.**

---

## 16. Product-proof imagery

If imagery is used inside the reference/result card, use controlled benign demo assets.

Do not use:

-  intimate imagery; 
-  blurred abuse imagery; 
-  victim imagery; 
-  red danger overlays. 

The visual job is simply:

> **selected reference → corresponding platform match**

---

## 17. Motion

If motion is used, keep it minimal.

A simple sequence is enough:

```
```

```
REFERENCE
   ↓
MATCHING
   ↓
MATCH FOUND
```

Do not invent:

-  latency numbers; 
-  scan speed; 
-  success percentages; 
-  matching counts. 

The static card must remain understandable even without animation.

---

## 18. Mobile behavior

Desktop:

> **two columns**

Mobile:

> **collapse vertically**

Order:

1.  logo/navigation; 
2.  category label; 
3.  headline; 
4.  supporting copy; 
5.  CTAs; 
6.  trust strip; 
7.  product-proof card. 

Do not hide the product proof on mobile.

Simplify it if needed:

```
```

```
PLATFORM-SELECTED IMAGE
        ↓
DETECTION REFERENCE
        ↓
PLATFORM-SCOPED MATCHING
        ↓
MATCH FOUND
```

Do not allow horizontal architecture overflow.

---

## 19. Relationship to later screens

Screen 01 answers:

> **What is Corvinth, what pain does it solve, and why should I care?**

It should not steal the jobs of later screens.

The page can then progressively answer:

> why buy instead of build;

> where compute happens;

> how matching works;

> what a result looks like;

> how integration works;

> what data crosses the boundary;

> what Corvinth is technically built on;

> why the problem is becoming more urgent.

Screen 01 should make the buyer want those answers.

> **The stupidly expensive part is discovering the matching content manually. Corvinth is the infrastructure underneath that job.**
>
> This is the emotional direction the hero should leave with the buyer.
>
> Do **not** turn it into a new hero headline.
>
> Keep the existing locked headline:
>
> **Reported content comes back.**
>
> **Corvinth helps you find the copies.**
>
> The manual-discovery pain should naturally lead into Screen 02’s buy-vs-build story.

---

## 20. Final first-view copy

### LEFT

`IMAGE SAFETY INFRASTRUCTURE`

# **Reported content comes back.**

# **Corvinth helps you find the copies.**

> **Image safety infrastructure for platforms with user-generated content. Corvinth helps your team find copies of content it has chosen to track — across existing platform content and new uploads.**

> **Corvinth returns the detection result. Your platform decides what happens next.**

**See it work** `Request access`

`PLATFORM-SCOPED MATCHING · MANAGED OR CUSTOMER COMPUTE · NO DURABLE IMAGE-BYTE STORAGE`

### RIGHT

```
```

```
PLATFORM-SCOPED DETECTION

PLATFORM-SELECTED IMAGE
        ↓
DETECTION REFERENCE
        ↓
PLATFORM-SCOPED MATCHING
existing content · new uploads
        ↓
MATCH FOUND

Matched object   obj_••92
Platform scope   same platform
```

---

## 21. Hard Builder constraints

Codex must not:

-  preserve the old SDK/code hero; 
-  imply Customer Compute is the only integration model; 
-  advertise video unless separately approved; 
-  position Corvinth as NCII-specific; 
-  claim a fixed deployment time; 
-  claim images never reach Corvinth; 
-  present PDQ/DINOv2 as the hero value proposition; 
-  imply Corvinth makes enforcement decisions; 
-  universally promise case evidence; 
-  create a fake dashboard; 
-  invent metrics; 
-  use stale Shield/Pulse public terminology; 
-  turn the hero into a regulatory/compliance pitch. 

---

# Final mental model

The visitor arrives knowing nothing about Corvinth.

Within the first viewport they should understand:

> **“My platform already knows what content it wants to track. Corvinth gives me the detection layer to find copies of that content across my platform, while my own workflow keeps control of what happens next.”**

Visually:

> **Pain on the left. Proof on the right. Architecture hinted underneath.**

That is the final Screen 01 direction.

===============================================================================================================================================================
==========================================


# Screen 02

## AMEND — Main Headline + Supporting Paragraph

This is an important page because it finally answers **“Why should I buy this instead of building it?”** The structure is right, but some of the copy is weaker—and less trustworthy—than the product itself.

### The headline

Change -

**“Save six months of engineering.”**

**to**

**"Save months of engineering"**

Strong. For a 2–10 person platform team, this is arguably a better commercial message than talking about compliance. It translates Corvinth into **engineering time + opportunity cost** immediately.

The paragraph underneath needs tightening, though:

> “Building NCII detection from scratch means VP-Trees, perceptual hashing, semantic embeddings, audit logging, and a compliance workflow. That's a full sprint.”

There’s a contradiction in scale: **six months** in the headline → **a full sprint** in the body. A sprint usually sounds like 1–4 weeks. That weakens the headline.

I’d make it:

> **Re-upload detection gets complicated fast. Exact matching is only the start — edited-copy detection, reference indexing, retroactive sweeps, and audit trails all have to work together in production. Corvinth gives your team that detection layer without turning it into another infrastructure project.**

That also avoids unnecessarily exposing VP-tree as if that implementation detail itself is customer value.

MINOR LAYOUT NOTE
One small thing: "Adult Content Platforms" is on a second row alone, visually orphaned. Either reorder so it wraps more evenly, or accept it. Not a copy problem, minor layout fix.

---

## AMEND — Audit Trail

- Current title: `FTC audit log, out of the box.`
- Problem: FTC-specific framing is removed from the site's positioning.
- New title:

> **Evidence from every case.**

- New body:

> Every case and match leaves a structured record your team can use for review, investigation, and internal evidence.

---

## KEEP + CORRECT — Your policy. Our signal.

- Keep the title.
- Remove `allow / review / block / clean` from the marketing copy.
- Reason: Corvinth detects and returns a signal; the platform owns the actual enforcement decision.
- Replace body with:

> **Corvinth detects the match and returns the signal. Your platform decides what happens next — review it, remove it, or take no action.**

---

## AMEND — Card 1

### BLOCK current wording

> **Deploy this afternoon.**
>
> One API endpoint in your upload pipeline. The SDK computes hashes on your server. No infrastructure changes required.

Use instead:

> **Bounded integration surface.**
>
> **Connect Corvinth to your existing storage and upload workflow. Use Corvinth-managed compute or keep image processing inside your own infrastructure — without rebuilding your application around a new moderation stack.**

Explain the different compute paths later in the technical/integration section.

--- 

## AMEND — Card 2

### Capability-gated

Do not render this card or replacement capability copy while the global
Semantic-sweep capability-publication gate is closed. Do not substitute another
claim about transformed copies, DINO, semantic matching, crops, rotations, or
filters.

After that gate passes, the Semantic-sweep instructions in this plan govern
the card's public copy and placement.

---

## AMEND — Card 3

### BLOCK current wording

> **FTC audit log, out of the box.**

Since you specifically want to move away from leaning on laws/regulators, this is unnecessarily narrow.

More importantly, **“Exportable for FTC review at any time”** sounds like Corvinth is promising regulatory sufficiency.

The underlying capability is much stronger than that framing.

I'd make it:

> **Evidence from every case.**
>
> Every case and match leaves a structured record your team can use for review, investigation, and internal evidence.

Now the value survives regardless of which law/regulator/customer is asking for evidence.

---

## AMEND — Closing Positioning

FROM -

NCII is where Corvinth starts. The same hashing, matching, and audit infrastructure underneath Shield and Pulse is built to extend to other categories of harmful or unauthorized content over time.

TO -

> **Corvinth is category-agnostic. Your platform decides which visual references should be tracked; Corvinth provides the matching and evidence infrastructure underneath it.**

=========================================================================================================================================================================================================

**# Screen 03**

**## 1. NEW CORE IDEA — Make Mode A vs Mode B the architecture story**

****Section label:****

> `TRUSTED ARCHITECTURE`

****Headline:****

> ****Choose where image compute happens.****

****Supporting copy:****

> ****Use Corvinth-managed compute, or keep image processing inside your own infrastructure. Either way, Corvinth does not durably store image bytes.****

This immediately explains why there are two paths instead of pretending one is “the architecture.”

---

**## 2. BUILD — Two equal architecture cards**

**### **MODE A — Managed Compute****

> ****Corvinth handles the image compute.****

Flow:

`Your storage` → `ephemeral fetch access` → `Corvinth compute` → `Corvinth matching` → `match signal`

Supporting line:

> Corvinth fetches the referenced image when needed, computes the detection signal, and does not retain the image bytes.

Badge:

> `MANAGED COMPUTE`

---

**### **MODE B — Customer Compute****

> ****Image pixels stay with you.****

Flow:

`Your image` → `your compute` → `fingerprint / vector` → `Corvinth matching` → `match signal`

Supporting line:

> **Image processing stays inside your infrastructure. Corvinth receives the derived detection representation together with the platform-scoped object reference needed to correlate detection results back to content in your system — never the image itself.**

> **The required derived representation is sent to Corvinth together with the platform/object context needed for matching and correlation.**

Do not imply the representation is literally the only data crossing the boundary.

Badge:

> `CUSTOMER COMPUTE`

---

**## 3. GLOBAL TRUST POINTS — underneath both cards**

Use only claims that apply cleanly:

- `NO DURABLE IMAGE-BYTE STORAGE`

- `CHOOSE YOUR COMPUTE BOUNDARY`

- `SAME MATCHING INFRASTRUCTURE`

Bottom trust statements:

> ****✓ Two compute models**** — choose the trust boundary that fits your platform.

>

> ****✓ No durable image-byte storage**** — Corvinth does not build a repository of customer images.

>

> ****✓ Your policy stays yours**** — Corvinth returns detection results and relevant context; your platform decides what happens next.

Do ****not**** use:

- `0 pixels sent to Corvinth` globally

- `No images ever leave your infrastructure`

- `No configuration required`

- GDPR/TIDA compliance claims

- latency numbers

---

**## 4. IMPORTANT DESIGN DECISION**

Do ****not**** visually make Mode B look like the “secure/private” option and Mode A like the compromise.

Present them as:

****Mode A = less infrastructure for the customer****

****Mode B = tighter customer-controlled compute boundary****

Two legitimate integration choices.

---

**## 5. MODE TERMINOLOGY RULE**

****First architectural introduction:****

> `MODE A — Managed Compute` / `MODE B — Customer Compute`

****Later references:****

> `Mode A` / `Mode B` are safe shorthand.

Canonical mapping:

> ****Mode A = Managed Compute****
>
> ****Mode B = Customer Compute****

---

**## 6. My preferred finished top of this section**

> `TRUSTED ARCHITECTURE`

>

> **# **Choose where image compute happens.****

>

> Use Corvinth-managed compute, or keep image processing inside your own infrastructure. Either way, Corvinth does not durably store image bytes.

Then immediately show the ****Mode A / Mode B side-by-side architecture diagrams****.

****This is the direction I would build.****

**## 1. ADDITION — Supporting copy**

Place it ****at the end of the supporting paragraph, directly before the Mode A / Mode B cards.****

Current POV 1 stays:

> ****Use Corvinth-managed compute, or keep image processing inside your own infrastructure. Either way, Corvinth does not durably store image bytes.****

****FLAG:**** I would ****not**** add `Either way, nothing is retained.` literally. Corvinth does retain hashes/vectors, so that sentence becomes broader than the truth. The handoff explicitly says images are not stored, but hashes and vectors are.

Add instead:

> ****Either way, image bytes are not durably retained by Corvinth.****

So this sits ****above the two architecture cards**** as the shared privacy guarantee.

---

**### Final structure**

`TRUSTED ARCHITECTURE`

→ headline

→ supporting copy + scoped retention statement

→ ****Mode A card | Mode B card****

→ ****three shared trust statements****

****That placement is right****


=========================================================================================================================================================================================================

**# Screen 04**

## Semantic-sweep capability-publication gate

Do not publish Semantic sweep as an active capability until the deployed DINO
path has real calibration evidence, is enabled, and has validated fixtures
supporting the public claim. Do not invent qualification evidence.

Until that gate passes:

- do not expose a live Semantic-sweep demo;
- do not publish crop, rotation, filter, or transformed-variant capability
  claims;
- do not render the Semantic-sweep branch, capability layer, result flow, FAQ,
  or access-form interest field publicly; and
- keep any Semantic-sweep UI and form mapping hidden/gated for later
  activation.

When the gate passes, the locked customer-facing term remains **Semantic
sweep** and the following Screen 04 content may be activated without changing
its locked copy.

**## Case 1 — CORE IDEA — KEEP AS IS**

****Do not make this another “5 integration steps” page.****

This section explains ****what happens after your platform tells Corvinth which content to track for matches.****

Build the page around:

> ****One detection reference → continuous perceptual matching + explicitly triggered semantic sweep****

The story:

`Reported content`

→ becomes a detection reference

→ ****check future uploads****

→ ****sweep existing content****

→ return matches/evidence

→ platform decides what happens.

****Added structural idea from B:****

Internally, design this lifecycle as:

> ****One detection reference → continuous perceptual matching + explicitly triggered semantic sweep****

This is the design logic, ****not a replacement for our headline.****

---

**## Case 2 — SECTION POSITIONING — KEEP AS IS**

****Section chip:****

> `HOW CORVINTH WORKS`

****Headline:****

> ****Report it once. Catch it when it comes back.****

****Supporting copy:****

> **When your platform chooses reported content to track, Corvinth uses it as a detection reference. Perceptual matching checks stored and future fingerprints ( hashes ) ; semantic matching searches existing vectors or, when explicitly triggered, runs the required backfill sweep across the platform’s library for transformed variants.**

---

**## Case 3 — BUILD THE “ONE INPUT → TWO PATHS” VISUAL — KEEP AS IS**

**### Starting point**

> ****Reported content****

Supporting microcopy:

> Your platform tells Corvinth what should be tracked.

Then branch into the two paths.

**### LEFT — SHIELD**

> ****Continuous perceptual matching — both directions.****

Flow:

`Reported content` → `perceptual fingerprint` → `search that platform's previously stored fingerprints` → `match that platform's future upload fingerprints continuously`

Visual flow:

`That platform's previously stored fingerprints` ← `reported fingerprint` → `that platform's new upload fingerprints`

Supporting line:

> Continuous perceptual matching checks newly reported content against previously stored fingerprints from that platform, then keeps matching against new uploads from that platform as they arrive.

**### RIGHT — SEMANTIC SWEEP**

> ****Look deeper — including backwards.****

Flow:

`Reported reference` → `semantic matching` → `existing library sweep` → `matches found`

Supporting line:

> Semantic sweep is explicitly triggered across existing platform content when the platform wants to search for transformed variants that perceptual matching can miss, such as cropped, rotated, or filtered versions.

Visual distinction remains:

> ****Continuous perceptual matching = retroactive + future fingerprint matching****

>

> ****Semantic sweep = on-demand semantic library sweep****

---

**## Case 4 — ADD FROM B — SHOW THE TWO MATCHING CAPABILITIES**

Add a compact capability layer ****inside the overall lifecycle****, without changing the Shield/Semantic sweep branching structure.

**### Continuous perceptual matching**

> Searches that platform's previously stored fingerprints when content is reported, then continues matching against that platform's future upload fingerprints.

**### Semantic matching / Semantic sweep**

> Runs as an on-demand semantic sweep to find transformed variants that perceptual matching can miss across existing platform content.

Visually:

`Reported reference` → `continuous perceptual matching` → `match + evidence`

`Admin-triggered semantic sweep` → `Semantic sweep` → `match + evidence`

This tells the buyer why Corvinth is more than a basic hash database.

****Do not say:**** `Corvinth creates both...` here, because Page 03 already established that compute ownership can differ between Mode A and Mode B.

---

**## Case 5 — END WITH THE PLATFORM BOUNDARY — KEEP AS IS**

Bring both detection paths back together:

`Shield match` ↘

→ ****Match + case evidence**** → ****Your policy****

`Semantic sweep match` ↗

Copy:

> ****Corvinth returns the match and evidence.****

>

> ****Your platform decides what happens next.****

Core boundary:

> ****Corvinth detects. Platform enforces.****

---

**## Case 6 — DO NOT CARRY FORWARD — KEEP AS IS**

Do not rebuild:

- `Live in a day. Audit-ready by day two.`

- numbered SDK-install tutorial

- endpoint names

- `<100ms`

- `allow / review / block / clean`

- `Match against NCII database`

- duplicate Flow A / Flow B technical walkthrough

- VP-tree implementation details

- `Python in active development`

**### PUBLIC NAMING CONSISTENCY**

On the public homepage, use:

> **Semantic sweep**

Until the global Semantic-sweep capability-publication gate passes, do not use
`Pulse` as public homepage, documentation, metadata, or navigation terminology.
After the gate passes, the customer-facing term remains **Semantic sweep**.


=========================================================================================================================================================================================================

# Screen - STOP HERE ----> DEMO ENDPOINT

=========================================================================================================================================================================================================

**# Screen 05**

****Job of the page:****

> ****WHY NOW + why this becomes an infrastructure problem + establish Corvinth's boundary.****

Not evidence infrastructure.

Not another explanation of PDQ/DINO.

Not another Page 04 detection breakdown.

**### Chip**

> `WHY NOW`

**### Headline**

> ****When the removal clock starts, manual search becomes an infrastructure problem.****

The legal qualification lives immediately below it, while the headline communicates the commercial problem.

**### Opening visual**

`report → support/admin → engineer → manual search → removal`

Then:

> ****Engineering doesn't start the clock. For a covered platform, the 48-hour period begins when it receives a valid removal request through its TIDA notice-and-removal process.****

This turns abstract regulatory pressure into a concrete CTO operational problem.

Do not expose or describe backend `detected_at`, `hours_remaining`, or
`breach_risk` values as a TIDA, legal, or compliance clock. Do not infer legal
deadline or status from `detected_at`. The approved static TIDA explanation
above is the complete frontend direction; backend cleanup of the obsolete
detected-at derivative is separate.

---

**# Screen 05 — REGULATORY PRESSURE**

Then establish the factual reason this matters.

For covered platforms receiving a valid TIDA removal request through their notice-and-removal process, the 48-hour period applies to qualifying reported content, alongside the requirement to make reasonable efforts to identify and remove known identical copies.

Use the three pressure points:

> ****48 HOURS****

>

> Covered platforms must remove qualifying reported content and make reasonable efforts to identify and remove known identical copies within 48 hours after receiving a valid removal request through their TIDA notice-and-removal process.

> ****REASONABLE EFFORTS****

>

> Platforms must make reasonable efforts to identify and remove known identical copies.

Do not include a dollar figure or civil-penalty amount in this build. Backend
comments are not legal verification. A future static legal-copy amendment may
consider a reverified figure only after separate approval.

And keep this commercial line:

> ****Big platforms can staff this problem. Small platforms still have to solve it.****

That is the buyer story.

---

**# THE MOST IMPORTANT POSITIONING DECISION**

Lock:

> ****TIDA creates urgency. It does not define Corvinth's data model.****

Do ****not**** call TIDA itself a Corvinth “use case.”

TIDA is one source of buyer pressure. Corvinth's product remains broader:

> ****Image Safety Infrastructure for matching platform-selected visual references.****

The product boundary is reference-based detection, not content-category classification.

---

**# Screen 05 — CLASSIFIER VS REFERENCE VISUAL**

This belongs here as a ****secondary boundary****, not the main page.

**### Classifier**

> ****“What is this image?”****

`Image → classification → content category`

**### Corvinth**

> ****“Where does this platform-selected visual reference appear?”****

`Platform-selected visual reference → platform-scoped matching → match + evidence`

Then:

> ****Corvinth does not determine why the content was selected. Your platform decides which visual references should be tracked. Corvinth matches against those references and returns evidence when matches are found.****

Reported content can still be shown as one possible source of a reference:

> `Reported content → platform selects it for tracking → visual reference`

Also retain the internal architectural principle:

> ****Classification is unnecessary to Corvinth's matching function.****

For the public product boundary, use:

> ****Corvinth matches platform-selected visual references using fingerprints and visual signatures — it does not require a content-category label to detect a match.****

Do ****not**** use:

> Corvinth minimizes category knowledge...

Do not publicly frame the architecture as intentionally avoiding legal knowledge.

Do not place the longer legal-obligation explanation on the homepage. That remains a product/design principle rather than customer-facing copy.

---

**# Screen 05 — ENDING**

Do not end by re-explaining perceptual matching, semantic matching, continuous detection, VP-trees, DINO, or other implementation mechanics.

End with:

> **The platform already has the report. Corvinth gives it the infrastructure to find matching platform content..**

That closes the urgency story.

---

=========================================================================================================================================================================================================

**# Screen 06  — FINAL LOCK**

****Job:****

> ****What am I buying beyond the matching algorithm?****

**### Chip**

> `BUILT FOR REAL CASES`

**### Headline**

> ****Detection is only half the job. The match needs evidence behind it.****

Then:

> ****Corvinth keeps platform-selected visual references, matches, and timing linked so your team isn't piecing together detection history from isolated hashes.****

The headline now stays focused on what Corvinth actually provides without implying that Corvinth is a full incident-management system.

---

**# Screen 06  — THE KEY VISUAL**

First show:

`PLATFORM-SELECTED VISUAL REFERENCE`

↓

`CASE`

↓

`MATCHED PLATFORM OBJECT`

↓

`DETECTION EVENT + TIMING`

That immediately communicates:

> This is ****not**** just `hash A == hash B`.

Then the four evidence capabilities explain the chain.

**### Case evidence**

> Every match ties back to its originating case and involved platform content.

**### Traceable object identity**

> Evidence points to the exact platform object being investigated, rather than only an isolated hash/vector.

**### Audit history**

> ****References, matches, case history, and timing stay connected so your team can trace the detection history of the case.****

Do not use:

> the incident can be reconstructed

because Corvinth does not necessarily possess every downstream platform action necessary to reconstruct the complete incident.

**### Tenant-isolated matching**

> ****A platform's references, matching, and evidence remain scoped to that platform. Another tenant's case, object, or evidence metadata must not be returned or exposed.****

This keeps evidence, tenant isolation, and enforcement boundaries as durable product truths rather than benchmark marketing.

---

**# Screen 06  — ENDING**

Keep the ending concept:

`MATCH`

↓

`CASE + OBJECT + TIMING + EVIDENCE`

↓

****YOUR PLATFORM'S POLICY****

Then:

> ****Corvinth records the detection evidence. Your platform decides what happens next.****

Use ****records****, not ****preserves****, because `preserves` can imply a specific retention duration, preservation guarantee, or immutability promise.

That gives the product a clean boundary:

> ****Detection + evidence, not enforcement.****

---

**# FINAL HOMEPAGE LOGIC**

**### 01 — What problem exists?**

> Reported content comes back.

**### 02 — Why buy instead of build?**

> Building detection infrastructure is expensive engineering work.

**### 03 — Where does compute happen?**

> Managed Compute vs Customer Compute.

**### 04 — How does detection operate?**

> Continuous perceptual matching + deeper semantic sweep.

**### 05 — Why does this matter now?**

> Removal pressure + manual workflow failure + small-team gap + clear Corvinth boundary.

**### 06 — What am I buying beyond matching?**

> Case evidence + exact object identity + auditability + tenant isolation.

There is no remaining structural A-vs-B disagreement.

---

**# FINAL STRATEGIC HIERARCHY**

> ****TIDA creates urgency.****

> ****Small-team operations create the economic pain.****

> ****Reference-based detection protects Corvinth's category-agnostic boundary.****

> ****Case/object/timing infrastructure makes Corvinth more than a hashing API.****

> ****Tenant isolation protects customer trust.****

> ****The platform remains the decision-maker.****

One final visual rule:

> ****TIDA gets a strong block inside**** ****`WHY NOW`****, ****but TIDA should not appear in the Page 05 chip, product name, architecture labels, case taxonomy, or Page 06.****


=========================================================================================================================================================================================================

# SCREEN 7 — FINAL INTEGRATION PLAN

## 1. Job of the screen

Kill this uncertainty:

> **How invasive is this going to be to integrate?**

The screen should prove:

> **Corvinth adds a detection layer to the platform’s existing stack without requiring the platform to rebuild its moderation, case-handling, or enforcement workflow around Corvinth.**

Do not explain detection again.

Do not promise unsupported integration timelines.

---

## 2. Positioning

### Chip

> `INTEGRATION`

### Headline

> **Add the detection layer. Keep the rest of your stack.**

### Supporting copy

> **Connect reported references and content to check through the compute path that fits your stack, then route Corvinth’s matches and evidence into the workflow your team already uses.**

---

## 3. Main integration visual

Use one dominant architecture view.

The infrastructure boundaries must be visually explicit through actual containers.

```text
[ YOUR PLATFORM ]

Reported reference / content to check
        │
        ├─ Customer Compute
        │      ↓
        │   derived representation ─────────────────────────┐
        │                                                   │
        └─ Managed path                                     │
               ↓                                            │
          ephemeral fetch access ───────┐                   │
                                        ▼                   │
                                  [ CORVINTH ]              │  
                                  Managed compute           │
                                        │                   │
                                        └────────┐          │
                                                 ▼          ▼
                                          Detection / matching
                                                 │
                                                 ▼
                                          Match + evidence
                                                 │
                                                 ▼
                                   YOUR EXISTING WORKFLOW
```

The boundary must be visually unmistakable:

> **Customer Compute happens inside the customer’s infrastructure.**

> **Customer Compute sends the derived representation directly into Corvinth detection / matching.**

> **Managed Compute gives Corvinth temporary access to fetch the image and perform the image compute.**

> **Corvinth receives ephemeral fetch access and performs Managed Compute inside the Corvinth boundary before detection / matching.**

Do not overcommit on this high-level screen to exactly who generates the temporary access.

The lower-level integration docs can explain relay / presigning mechanics.

Do not turn this into another Mode A/B lesson.

The diagram exists only to show **where Corvinth enters the stack** and must not visually imply that Customer Compute flows through Managed Compute.

There are two distinct ingress paths into Corvinth:

- Customer Compute → derived representation → **directly to detection / matching**
- Managed path → ephemeral fetch access → **Managed Compute → detection / matching**

---

## 4. Three bounded integration tasks

Beneath the visual, show three compact steps.

### 01 — SCOPE

> **Establish the platform boundary.**

Corvinth operates inside that platform’s isolated scope for references, matching, and evidence.

Do not discuss credential timing or provisioning trivia.

---

### 02 — CONNECT DETECTION

> **Connect the compute path that fits your stack.**

Support:

> `Managed Compute`
>
> `Customer Compute`

Keep this brief.

Page 03 owns the detailed architecture explanation.

This screen only communicates:

> **Both paths connect into the same Corvinth detection layer.**

---

### 03 — ROUTE RESULTS

> **Send matches and evidence into the workflow you already use.**

Conceptually:

```text
Corvinth result
→ internal tooling
→ review / case handling
→ platform action
```

Corvinth detects and returns context.

The platform decides what happens next.

---

## 5. Product-boundary strip

Make this visually prominent.

### YOUR STACK STAYS YOURS

> `Storage` · `Moderation decisions` · `Case handling` · `Enforcement`

### CORVINTH ADDS

> `Detection references` · `Matching` · `Evidence context`

This should communicate the integration boundary almost instantly.

---

## 6. Integration honesty rule

Do not manufacture simplicity through claims that are not universally true.

Do not promise:

- one endpoint
- one POST call
- identical Mode A/B integration effort
- mandatory SDK
- mandatory webhook
- mandatory audit export
- a specific programming language
- a specific deployment shape
- a fixed number of hours or days

The message is:

> **bounded integration surface**

not:

> **magically identical integration for every platform**

---

## 7. Remove from the current screen

Delete completely:

- `Day 0`
- `Day 1`
- `Day 2`
- `Live in a day`
- `Audit-ready by day two`
- `typically within 24 hours`
- `/hash/check`
- bare `/hash/check` code examples or public documentation
- the obsolete `/api/check` proxy if it is unused; do not retarget it merely to
  preserve the old demo
- `one endpoint`
- SDK-language promises
- `block / review / allow`
- mandatory webhooks
- mandatory audit export
- legal-team reporting promises
- fake checklists
- another PDQ/DINO explanation
- another Mode A/B architecture tutorial

---

## 8. Visual direction

Keep the restrained visual language from the current screen if useful, but replace the calendar semantics entirely.

The infrastructure boundary should be communicated visually through containers, not only supporting copy.

`[ YOUR PLATFORM ]` contains Customer Compute.

`[ CORVINTH ]` contains Managed Compute and Detection / Matching.

The screen should make **where Corvinth enters the stack** understandable before the visitor reads the supporting explanation.

Hierarchy:

> **Main integration boundary diagram**

then beneath it:

> `01 SCOPE`
>
> `02 CONNECT DETECTION`
>
> `03 ROUTE RESULTS`

then the:

> **YOUR STACK STAYS YOURS / CORVINTH ADDS**

strip.

Screen 7 should feel calmer and simpler than the interactive demo before it.

---

## 9. Ending

Close exactly with:

> **Corvinth adds the detection layer. Your product workflow stays yours.**

If this is the last substantive section before the footer:

Primary:

> **Request access**

Secondary:

> **Read the docs**

---

# Final mental model

The visitor enters thinking:

> “This looks useful, but integrating another safety system sounds invasive.”

They leave thinking:

> **“My platform stays mine. I scope Corvinth, connect one of its compute paths, and consume matches and evidence inside the workflow I already have.”**

That is the Screen 7 direction I would lock.


=========================================================================================================================================================================================================


# SCREEN 8 — DATA BOUNDARY / RETENTION PLAN

## 1. Job of the screen

Answer one buyer question:

> **What data does Corvinth receive, and what does it keep?**

This is the **data-boundary / trust screen**.

It should make the lifecycle understandable without turning into another security page, compliance page, or Mode A/B tutorial.

---

## 2. Positioning

### Chip

> `DATA BOUNDARY`

### Headline

> **What Corvinth receives. What Corvinth keeps.**

### Supporting copy

> The data boundary depends on where image compute happens. In either model, Corvinth retains the platform-scoped detection data and context required to operate the product—not a repository of customer image bytes.

---

## 3. Main visual — two compute paths into one platform-scoped durable state

Build one visual around:

> **TWO COMPUTE PATHS → ONE TENANT-SCOPED PRODUCT STATE**

Not three generic security cards.

Managed Compute and Customer Compute are **parallel ingress paths** that converge into the same durable-state model, isolated to that platform.

The visual should answer:

> **What crosses? What is temporary? What persists?**

Conceptually:

```text
[ MANAGED COMPUTE ]

[ CUSTOMER STORAGE ]
platform / object identity
        +
ephemeral fetch access
        │
        ▼
[ CORVINTH ]
fetch image bytes temporarily
        ↓
managed compute
        ↓
derived detection representation
        ┐
        │
        ├──────────────► [ PLATFORM-SCOPED DURABLE CORVINTH STATE ]
        │
        │                 platform-scoped detection data
        │                 + operational / evidence context
        │
[ CUSTOMER COMPUTE ]     NOT customer image storage
                         ↑
image bytes stay         │
inside customer          │
infrastructure           │
        ↓                │
customer compute         │
        ↓                │
derived detection representation
+
platform / object context
        ─────────────────┘
```

The important distinction must be visually obvious:

> **Managed Compute:** platform/object identity and ephemeral fetch access cross into Corvinth. Corvinth then fetches and temporarily processes the image bytes inside its compute boundary.

> **Customer Compute:** image bytes stay customer-side; the derived detection representation and required platform/object context cross instead.

Both eventually feed the same platform-scoped detection infrastructure.

Do not draw `image bytes` as if they are durable data moving through the system alongside the representation.

---

## 4. Managed Compute

Headline:

> **Image bytes are temporary.**

Explain:

> Corvinth receives platform/object identity together with ephemeral fetch access, retrieves the image for the required compute, and does not durably retain the image bytes.

Show:

`platform / object identity + ephemeral fetch access`

→ `temporary image processing inside Corvinth`

→ `derived representation`

→ `durable detection state`

The **identity/context may persist**.

The **fetch access and image bytes do not become durable state**.

### Hard trust rule

> **Temporary fetch access is not durable product state.**

Do not persist the presigned/fetch URL in databases, logs, analytics, audit records, DLQs, durable jobs, or returned responses.

### Resolved legacy-path finding

The legacy durable-URL path is verified unreachable. Keep the intended
architecture and this public claim exactly as written. No frontend claim
change, additional frontend gate, or backend modification follows from that
legacy path.

Do not say:

> “Images never reach Corvinth.”

They do in Managed Compute.

---

## 5. Customer Compute

Headline:

> **Image processing stays with the customer.**

Explain:

> The customer performs the image compute inside its own infrastructure. Corvinth receives the derived detection representation required for the operation, together with the platform and object context required for matching and correlation. Case/evidence context is associated where the workflow requires it.

Show:

`image`

→ `customer infrastructure`

→ `derived detection representation + platform / object context`

→ `Corvinth`

Important distinction:

- `image-derived payload = fingerprint or semantic representation`
- `contextual payload = platform/object identity + operation context where required`
- `case/evidence context = associated where the workflow creates it`
- `image bytes = stay customer-side`

Do not imply every operation sends both a fingerprint and semantic vector.

The representation depends on the operation.

Do not say:

> “No data leaves your infrastructure.”

Derived detection data and required context do.

---

## 6. What Corvinth keeps

This is the third and most important state.

Headline:

> **Detection state, not an image repository.**

### Durable product state can include

- detection references
- matching representations retained where required
- platform/object identity used for correlation
- associated case/evidence context
- operational/audit metadata

The exact durable fields depend on the operation and the real backend contract.

Core message:

> **Corvinth retains the data needed for detection, matching, and associated evidence context. It does not turn Managed Compute into durable customer-image storage.**

---

## 7. Add a simple persistence strip

Under the main visual:

### PERSISTS

> `Detection references` · `Matching representations retained where required` · `Platform/object context` · `Evidence / operational metadata`

### DOES NOT DURABLY PERSIST

> `Managed-compute image bytes` · `Ephemeral fetch access`

This is likely more useful than the current three security cards.

---

## 8. Platform isolation belongs here

Add one compact trust statement:

> **Durable detection state remains scoped to the platform it belongs to.**

Then clarify the actual matching boundary:

> **Matching and evidence lookup remain within the same platform scope. References, evidence, and metadata from another tenant are neither searched nor exposed.**

Do not turn this into another architecture section.

The purpose is simply to answer the natural security question:

> “If Corvinth keeps detection state, whose data can interact with it?”

The answer should be:

> **References, matching, and evidence remain within that platform's isolated scope.**

---

## 9. Secondary security proof

TLS, DPA, encryption, retention controls, etc. can remain **secondary supporting evidence**, not the page's story.

A compact footer strip could contain only claims that are actually implemented and defensible, for example:

> `Encrypted in transit`
>
> `Platform-isolated scope`
>
> `No durable managed-compute image bytes`

If a DPA is genuinely available, surface:

> **Data Processing Agreement available**

as a procurement action underneath.

Do not let it dominate the data-lifecycle explanation.

---

## 10. Remove from the current screen

Delete or replace:

- **Zero image storage**
- “images are never sent to Corvinth”
- `Pipeline 1 / Pipeline 2`
- “hashes reveal nothing”
- “cannot reconstruct the original image”
- generic hash-retention framing
- implication that only hashes are durable
- generic encryption card as a primary section
- any unverified enterprise retention/configuration promises

Avoid absolute security claims where the stronger answer is simply to describe the real boundary accurately.

---

## 11. Visual direction

The screen should be understandable in this order:

> **What crosses**

→ **where compute happens**

→ **what becomes durable**

Use infrastructure containers and arrows rather than paragraphs wherever possible.

The hero visual should do most of the explanatory work.

The Managed Compute side must make it visually clear that:

> **Ephemeral fetch access crosses into Corvinth; Corvinth then fetches and temporarily processes the image bytes inside its compute boundary.**

The Customer Compute side must make it visually clear that:

> **Image bytes remain customer-side while the derived detection representation and required platform/object context cross into Corvinth.**

Both paths converge into:

> **the same durable-state model, isolated to that platform**

Then use the persistence strip and small trust notes underneath.

---

## 12. Ending

Close with:

> **Corvinth may process image bytes depending on the compute mode. It does not become your image repository.**

Then reinforce:

> **What persists is the platform-scoped detection data and context required to operate Corvinth.**

That is the screen.

### Final mental model

The visitor enters thinking:

> “What exactly am I handing Corvinth?”

They leave thinking:

> **“Managed Compute temporarily processes the image inside Corvinth while retaining the identity and context needed for the product. Customer Compute keeps image processing on my side and sends the derived representation plus required context. Corvinth durably keeps the platform-scoped detection state and context needed to do its job—not my image library.”**

That is the Screen 8 direction I would build.


=========================================================================================================================================================================================================

# SCREEN 9 — TECHNICAL FOUNDATION / PROVENANCE PLAN

## Semantic-foundation publication gate

Until the Screen 04 Semantic-sweep capability-publication gate passes, omit
DINOv2, vector similarity search, and Semantic sweep from every public part of
this screen. Do not render an inactive/unavailable status, placeholder, or
alternative transformed-variant claim. The technical content may remain
implemented behind the gate only.

## 1. Job of the screen

Answer one technical-trust question:

> **What is Corvinth built on, what does Corvinth add, and where do the claims stop?**

This is the **technical transparency / provenance screen**.

It is not:

- another trust/compliance page,
- another data-boundary page,
- another matching explainer,
- another feature grid.

Its job is to show that Corvinth is built on understandable detection primitives while making clear that **the product is the infrastructure around those primitives**.

---

## 2. Positioning

### Chip

> `TECHNICAL FOUNDATION`

### Headline

> **Established detection methods. Corvinth infrastructure around them.**

### Supporting copy

> Corvinth uses established perceptual and semantic detection techniques underneath the product. The value Corvinth adds is the platform-scoped infrastructure that turns those capabilities into an operational detection system.

Do not frame the section as:

> “Look at our open-source stack.”

The story is:

> **underlying methods → Corvinth system → clear product boundaries**

---

## 3. Main visual hierarchy

Build one coherent visual with three levels:

> **DETECTION FOUNDATIONS**

↓

> **CORVINTH INFRASTRUCTURE**

↓

> **CLEAR BOUNDARIES**

The **Corvinth Infrastructure** layer should be visually dominant.

The technologies underneath support the product; they should not visually make Corvinth look like a thin wrapper around dependencies.

---

## 4. Detection foundations

Show technology together with its purpose.

### Perceptual fingerprinting

> `PDQ`

Used as an underlying primitive for perceptual image matching.

### Semantic representation

> `DINOv2`

Used to generate semantic representations for deeper similarity search.

### Vector similarity search

> Search infrastructure for semantic representations.

Keep this visually subordinate to the detection methods.

If technical transparency is useful, expose:

> `Current implementation: Qdrant`

as a small secondary detail or expandable technical note.

Do not present Qdrant as though it defines Corvinth’s product identity.

Do not add broad claims such as:

- open-source,
- licensing guarantees,
- partnerships,
- certifications,
- vendor endorsement,

unless each claim has been explicitly verified.

---

## 5. What Corvinth builds around those foundations

This should be the strongest section.

### CORVINTH INFRASTRUCTURE

> **Platform-scoped reference lifecycle**

References are created, maintained, and used within the platform scope they belong to.

> **Matching orchestration across continuous and explicit-search workflows**

Corvinth coordinates how detection methods are used operationally rather than exposing isolated algorithms.

> **Managed / customer compute boundaries**

The platform can choose where image compute happens while using the same Corvinth detection system.

> **Object, case, and evidence context where applicable**

Corvinth connects detection results to the operational identity and context required by the workflow.

> **Platform-scoped matching and evidence boundaries**

Matching results and evidence remain within the relevant platform scope rather than becoming a global cross-customer pool.

The screen should make the distinction obvious:

> **PDQ and DINOv2 provide underlying detection representations. Corvinth turns those primitives into platform-scoped detection infrastructure.**

---

## 6. Clear boundaries

Keep this compact.

Do not turn it into a defensive list of everything Corvinth does not have.

### CLEAR BOUNDARIES

> **Established foundations**
>
> Corvinth does not present underlying detection methods as proprietary inventions.

> **Production status is explicit**
>
> Optional or inactive integrations are identified separately from production capabilities.

> **Detection, not enforcement**
>
> Corvinth provides detection and evidence context. Your platform retains moderation and enforcement decisions.

That is enough.

The point is transparency, not self-disqualification.

---

## 7. Do not re-teach earlier pages

Do not explain again:

- Mode A vs Mode B architecture in depth,
- perceptual vs semantic matching behavior,
- semantic sweep mechanics,
- data retention,
- tenant lifecycle details,
- evidence workflow,
- regulatory requirements.

Earlier screens already own those jobs.

Screen 9 only establishes:

> **what sits underneath Corvinth and what Corvinth itself contributes.**

---

## 8. Remove from the current Screen 9

Delete the existing mixed feature grid and do not carry forward:

- `Zero image storage`
- `Rotation tolerant`
- `PDQ + DINOv2` as a generic product-feature card
- `Your policy, our detection`
- `FTC-ready audit log`
- `Compliance-ready architecture`
- `Near-miss pattern detection`
- generic signed-webhook feature card
- giant technology-tag wall
- PhotoDNA presented as an active capability

These either duplicate earlier sections, mix unrelated concepts, or need qualification beyond what this screen should carry.

---

## 9. Optional / external technology

If something such as PhotoDNA is not currently active, do not place it beside active foundations in a way that implies production use.

If it needs mentioning at all, keep it in a small boundary note such as:

> **Optional integrations are identified separately from currently active detection foundations.**

No need to make optional technology part of the hero story.

---

## 10. StopNCII / affiliation clarification

Keep the existing independence clarification separate from the main technical-foundation narrative.

It can remain near the footer or another appropriate legal clarification area.

Do not use Screen 9 to imply:

- partnership,
- feed access,
- endorsement,
- representation of Meta,
- representation of StopNCII,
- representation of another listed organization.

---

## 11. Visual direction

Avoid eight cards.

Prefer one compact composition:

```text
DETECTION FOUNDATIONS

Perceptual fingerprinting
PDQ

Semantic representation
DINOv2

Vector similarity search
Search infrastructure for semantic representations
Current implementation: Qdrant
            │
            ▼
────────────────────────────────
      CORVINTH INFRASTRUCTURE
────────────────────────────────

Platform-scoped reference lifecycle
Matching orchestration
Compute boundaries
Object / evidence context
Platform-scoped matching boundaries

            │
            ▼

CLEAR BOUNDARIES

Established foundations
Underlying detection methods are not presented as proprietary Corvinth inventions.

Production status is explicit
Optional or inactive integrations are identified separately from production capabilities.

Detection, not enforcement
Corvinth provides detection and evidence context.
Your platform retains moderation and enforcement decisions.
```

The center Corvinth layer should carry the most visual weight.

Qdrant should remain a small implementation detail beneath vector similarity search rather than a visually equal foundation beside PDQ and DINOv2.

---

## 12. Ending

Close with a simple line:

> **The detection primitives are established. Corvinth is the infrastructure that makes them usable as a scoped, operational system for platforms.**

That is enough.

No compliance CTA or feature dump is needed here.

---

# Final mental model

The visitor enters thinking:

> “What is this technically built from?”

They leave thinking:

> **“I understand the underlying detection methods. I understand what Corvinth actually builds around them. And I can see where the company’s claims begin and end.”**

That is the Screen 9 direction I would build.

=========================================================================================================================================================================================================

**# SCREEN 10 — DO NOT BUILD AS A STANDALONE SCREEN**

Screen 05 already owns:

> `WHY NOW`
>
> removal-window pressure
>
> manual discovery becoming an infrastructure problem
>
> TIDA as the concrete urgency example
>
> platform-vs-Corvinth legal boundary
>
> 48-hour / known-identical-copy obligation

**Do not let Codex build Screen 10 as a separate homepage section.**

The material below remains only as **implementation guidance for Screen 05** where useful. There should not be two `WHY NOW` sections.

---

**## 1. Job of the screen**

Answer:

> ****Why has reliable image discovery become an infrastructure problem now?****

The screen should establish:

> ****Regulation creates the urgency. Manual discovery creates the engineering problem. Corvinth provides the detection infrastructure underneath the platform's own legal and safety workflow.****

Corvinth must not become positioned as a TIDA processor, notice handler, legal validator, or compliance decision-maker.

---

**## 2. Positioning**

**### Chip**

> `WHY NOW`

**### Headline**

> ****When the response window tightens, manual discovery becomes an infrastructure problem.****

**### Supporting copy**

> Platforms may face time-bound removal obligations after qualifying requests. The legal workflow remains theirs; Corvinth provides the detection infrastructure that helps them find and connect relevant platform content.

This keeps the urgency without turning the law into Corvinth's category.

---

**## 3. Main visual**

Build one three-layer story:

**### LEGAL PRESSURE**

`valid qualifying request`

→ time-bound platform obligation

↓

**### ENGINEERING CONSEQUENCE**

`reported content`

→ find the reported item

→ make reasonable efforts to identify known identical copies

→ platform evaluates and acts

↓

**### CORVINTH UNDERNEATH**

`platform-selected visual reference`

→ `platform-scoped detection / matching`

→ `detection context returned to the platform`

The visual should communicate:

> ****The obligation exists above Corvinth. The discovery infrastructure sits underneath it.****

Do not visually place Corvinth inside the legal-decision step.

---

**## 4. Use TIDA as evidence, not the product**

TIDA can be the concrete example proving the environment changed.

Keep the legal statement narrow and exact:

> ****For covered platforms receiving a valid removal request through the TIDA process, Section 3 requires removal of the identified intimate visual depiction and reasonable efforts to identify and remove known identical copies within 48 hours.****

Then immediately translate that into the engineering consequence:

> ****A short response window makes “support asks engineering to manually search” a much weaker operating model.****

That is the commercial point.

Do not build another statute timeline.

---

**## 5. Keep statutory matching separate from Corvinth's broader capability**

This distinction should be explicit.

**### TIDA example**

> ****Known identical copies****

**### Corvinth capability**

> ****Broader detection infrastructure for visual references the platform chooses to track.****

Do not imply:

> crop / transformation / semantic similarity = TIDA requirement.

Keep the detailed perceptual and semantic mechanisms on the sections that already own them.

---

**## 6. Hard Corvinth boundary**

Use a compact ownership split.

**### THE PLATFORM OWNS**

> `notice / request workflow`
>
> `legal validity`
>
> `policy decision`
>
> `removal / enforcement`

**### CORVINTH PROVIDES**

> `platform-scoped detection`
>
> `matching infrastructure`
>
> `detection context returned to the platform`

Then state:

> ****Content originating from the platform's own reporting or legal workflow can become a platform-selected visual reference in Corvinth.****

And:

> ****Corvinth does not determine whether a legal request is valid, whether content is unlawful, or what enforcement action the platform must take.****

That boundary is essential.

---

**## 7. Do not make evidence part of the statute**

Avoid a legal-looking flow such as:

`request → detection → evidence → statutory compliance`

That could imply Corvinth's evidence model is itself a TIDA requirement.

Instead:

**### Legal flow**

`valid request → required discovery/removal → platform action`

**### Corvinth support underneath**

`platform-selected visual reference → detection + matching → detection context returned to the platform`

The purpose here is to show ****where Corvinth sits beneath the legal workflow****, not re-explain the evidence data model.

Detection context is ****product infrastructure supporting the platform****, not a statutory step unless separately established.

---

**## 8. Small factual pressure block**

Instead of the current long timeline, a compact factual block is enough:

> ****48 HOURS****
>
> For covered platforms receiving a valid removal request through the TIDA process, Section 3 requires removal of the identified intimate visual depiction and reasonable efforts to identify and remove known identical copies within the statutory window.

> ****FTC ENFORCEMENT****
>
> Section 3 enforcement began May 19, 2026.

Do not show a penalty amount in this build. A future static legal-copy
amendment may consider a reverified figure only after separate approval; do
not rely on backend comments as legal verification.

---

**## 9. Remove from the current screen**

Delete:

- `Your platform is covered`
- categorical coverage claims
- `Corvinth catches violations`
- `before the clock starts`
- `without Corvinth → FTC complaint`
- `platform at risk`
- `allow / review / block`
- `/hash/check`
- fake deterministic case outcomes
- the February/April legislative timeline
- fear-based red-vs-green comparison
- suggestion that Corvinth itself establishes legal compliance

Also correct any remaining claim that the Act was signed in May 2026; it was signed ****May 19, 2025****.

---

**## 10. Visual direction**

The dominant visual should be:

> ****pressure above → engineering bottleneck → infrastructure underneath****

not:

> law timeline → scary penalty → buy Corvinth

Screen 10 should feel like a CTO realization:

> ****“The legal requirement isn't Corvinth's product. But it changes how defensible my current manual discovery process is.”****

That's much stronger.

---

**## 11. Ending**

Close with the ownership boundary:

> ****The platform owns the legal request, policy decision, and removal action. Corvinth helps it find and evidence the content it needs to evaluate and act on.****

No “be compliant now” CTA.

No “don't wait for a complaint.”

If a CTA belongs here at all, keep it product-oriented:

> ****See how Corvinth fits your workflow****

or let the page continue without one.

---

**### Final mental model**

The visitor enters thinking:

> “Support and engineering can probably keep handling these reports manually.”

They leave thinking:

> ****“The regulatory environment has turned reliable discovery into an engineering requirement. Corvinth solves that detection layer without becoming my legal or moderation system.”****

That material belongs under the already-locked Screen 05 implementation guidance, not as a separate Screen 10.



=========================================================================================================================================================================================================


# SCREEN 11 — PLANNING CALCULATOR IMPLEMENTATION PLAN

## Current build status — deferred

Screen 11 is not part of the current frontend rebuild. Do not implement or
release the calculator until all of the following are complete:

- the current penalty figure is reverified;
- the calculator receives its dedicated legal review; and
- explicit legal sign-off is obtained.

This is a Screen-specific release gate, not a blocker for the unaffected
static-screen rebuild. This status supersedes any Screen 11 instruction that
would otherwise permit implementation before those conditions are met.

For this build, remove the current calculator and all associated penalty
amount, “real and confirmed,” hypothetical-total, multiplier, pricing, and
calculator UI. Do not replace it with a placeholder. The remaining Screen 11
material is a future, post-sign-off specification only.

## 1. Job of the screen

Keep the existing calculator and make one thing tangible:

> **How the maximum civil penalty scales with violation count.**

This is a planning tool, not a liability estimator and not a fear-based Corvinth sales device.

The calculator must remain properly qualified not only while viewed on the page, but also against predictable ways its output could be cropped, screenshotted, linked, previewed, or redistributed without surrounding context.

---

## 2. Preserve the existing structure

Preserve the calculator's visual concept, not its old implementation. Build a centered calculator section with the slider/input state, live arithmetic, and prominent result card using the supplied Screen 11 visual reference. Do not depend on the old frontend implementation.

Only change framing, labels, default state, count ceiling, result tone, legal qualification, state handling, sharing behavior, legal-review requirements, and CTA area.

---

## 3. Replace the section copy

### Chip

Replace:

> `EXPOSURE CALCULATOR`

with:

> `PLANNING CALCULATOR`

### Headline

Replace:

> **What's your platform's risk?**

with:

> **Put the penalty figure in context.**

### Supporting copy

Communicate:

> The FTC states that TIDA violations may result in civil penalties up to the current maximum per violation. There is no reliable public benchmark for how many violations a particular platform may face, so use the calculator to explore a hypothetical count—not to estimate your platform's liability.

Keep this concise.

---

## 4. Calculator input

Replace:

> `ESTIMATED UNRESOLVED VIOLATIONS`

with:

> **HYPOTHETICAL VIOLATION COUNT**

### Default state

Change the initial value from the fear-heavy `72` to:

> **1**

The visitor must create the larger scenario themselves.

Do not preload a multi-million-dollar result.

The slider remains fully interactive.

### Slider range

Reduce the maximum count from `100` to:

> **20**

Do not allow the calculator to generate arbitrarily large headline-scale scenarios.

The ceiling should keep the tool useful for illustrating how the statutory maximum scales while avoiding a range optimized around producing sensational tens-of-millions outputs.

Do not add an unrestricted numeric input that allows visitors to bypass the slider ceiling.

---

## 5. Calculation

Use:

> `user-selected count × current FTC maximum per violation`

The result updates live.

The calculator must not introduce:

* probability
* likelihood
* platform size
* incident rate
* expected violations
* enforcement probability
* other invented variables

It is intentionally simple arithmetic.

---

## 6. Result card

Replace:

> `ESTIMATED EXPOSURE`

with:

> **HYPOTHETICAL MAXIMUM CIVIL-PENALTY TOTAL**

Show the calculated number prominently.

Directly underneath, show the arithmetic:

> `[count] × [$current maximum] = [$result]`

and identify the source number as:

> **current FTC maximum per violation**

Never present the result as:

* expected exposure
* likely fine
* platform risk
* predicted liability
* amount owed

### Screenshot-safe qualification

The qualification must not depend on copy outside the result card.

Inside the result card itself, within the **same border and crop boundary as the dollar figure**, permanently display a smaller but clearly visible line:

> **hypothetical · not an estimate of your liability**

This line must:

* remain visible for every slider state
* sit directly beneath or visually attached to the generated dollar figure
* remain inside the result card
* not disappear on hover, animation, mobile layout, or responsive states
* not be implemented as a tooltip
* not rely on the visitor scrolling further
* remain present if someone screenshots only the result card

The dollar number and its minimum qualification must therefore be difficult to separate through an ordinary crop.

---

## 7. Full legal qualification

In addition to the screenshot-safe line inside the card, retain a fuller qualification immediately associated with the result:

> **Illustrative math only — assumes each unit is a separate, legally established violation at the current maximum penalty. You chose the count; this is not a prediction of any real-world outcome.**

Do not hide this in a tooltip or site footer.

It should be visible without interaction.

The short qualification inside the card protects the generated number when cropped.

The fuller qualification provides the complete context while the calculator is viewed on-page.

---

## 8. Legal figure handling

The per-violation amount must be treated as **maintained legal reference data**, not permanent marketing copy.

Do not fetch this value from the FTC or another external source at runtime. Keep it in one centrally configurable source and verify/update it through the release process.

Display compactly:

> `Current FTC maximum: $XX,XXX per violation`

Do **not** display a verification date on the page.

Verification must remain internal-only through the codebase, release process, legal-review notes, or an implementation ticket.

Implementation requirement:

* keep the figure in one configurable source/constants location
* do not duplicate the dollar amount across hard-coded components
* re-verify it immediately before publication and whenever the legal copy is updated
* all calculations and displayed explanatory text must consume the same value
* keep any verification date or evidence internal rather than exposing it in the UI

Use **“up to” / “maximum”** wherever the penalty amount is described.

---

## 9. Slider state must remain local

The visitor's selected violation count is temporary calculator state.

It must **never be serialized into the URL**.

Explicitly prohibit:

* `?violations=20`
* other query parameters carrying the count
* URL hashes containing calculator state
* route/path state representing the count
* shareable URLs that recreate a selected result
* analytics implementations that write the selected count into the visible URL

Moving the slider must not change the browser address.

Refreshing or sharing the page URL must not preserve a visitor-created hypothetical scenario unless the normal component default itself is being rendered.

The purpose is to prevent a visitor-generated number from becoming a permanent Corvinth URL that can circulate without the interaction and qualification that created it.

Analytics may record interaction internally if otherwise permitted, but **must not expose or serialize the slider state through the URL.**

---

## 10. Link-preview and social metadata isolation

The calculator's generated number must never become page-preview metadata.

Confirm explicitly that:

* Open Graph title is fixed
* Open Graph description is fixed
* Twitter/X card title is fixed
* Twitter/X card description is fixed
* preview metadata uses approved page/hero copy
* metadata is not derived dynamically from rendered calculator text
* metadata does not consume the current slider value
* metadata does not consume the calculated dollar result
* client-side slider interaction cannot mutate social metadata

Sharing the page into Slack, LinkedIn, X/Twitter, Messages, Discord, or another service must not produce a preview containing a visitor-generated penalty total.

Do not allow the calculator's default or last-rendered number to become the page's link-preview description.

---

## 11. No result-sharing or extraction affordances

Do not add any feature whose purpose is to make the generated result easier to redistribute independently.

Explicitly prohibit:

* share button
* social-share icon
* copy result
* copy calculation
* copy link with calculator state
* export result
* download result
* generated result image
* downloadable card
* PDF export
* shareable calculator snapshot

Do not inherit these controls automatically from a reusable card component.

If the site's generic card component includes sharing/export controls elsewhere, disable them for Screen 11.

Normal browser behavior does not need to be obstructed. The requirement is simply that Corvinth must not provide dedicated tooling that encourages extraction and redistribution of the generated number.

---

## 12. Visual tone

Keep the result large.

Remove the alarm treatment.

Do not use a giant panic-red dollar figure or danger-state styling that implies the visitor is currently liable for that amount.

Use the site's normal strong foreground hierarchy, with restrained warning/legal emphasis where necessary.

The screenshot-safe qualification inside the result card must remain clearly readable without becoming the visual focal point.

The emotional effect should be:

> **material**

not:

> **emergency**

---

## 13. Remove the fear-sales conversion

Delete completely:

> `Corvinth costs from $99/mo to cover this.`

Delete:

> `get protected →`

Do not replace them with another fine-versus-price comparison.

Corvinth does not “cover” penalties or insure the platform against liability.

---

## 14. Bridge back to Corvinth

Replace the sales block with:

> **The point isn't to predict a fine. It's to understand why short response windows make reliable discovery worth engineering for.**

Then:

> **Corvinth addresses that discovery layer; it does not predict liability or determine compliance.**

If a CTA is needed, keep it product-oriented.

Primary:

> **See how Corvinth works**

or, if the surrounding site flow makes more sense:

> **Request access**

Do not use:

* Get protected
* Reduce your fine
* Avoid penalties
* Cover your risk

---

## 15. Interaction states

### Initial

`Count: 1`

→ neutral calculated result

→ screenshot-safe qualification already visible inside the result card

The neutral default must also exist **before client-side hydration or interaction**.

If the stack uses server-side rendering, static prerendering, a pre-hydration render, or a no-JavaScript fallback:

> **Count must render as `1`.**

Do not render:

* a blank calculator state
* an undefined/null count
* a previously cached visitor-selected count
* a last-session value
* a transient larger count before hydration corrects it

The first visible render must match the same neutral `Count: 1` state as a fresh fully hydrated page load.

### User changes slider

Update immediately:

* count
* arithmetic line
* hypothetical maximum total

Keep unchanged:

* screenshot-safe qualification
* fuller legal qualification
* legal-reference labeling
* URL
* page metadata

No animations designed to dramatize the number.

A simple numeric transition is enough if already present.

The slider interaction must not:

* update the URL
* create a shareable scenario
* mutate Open Graph/social metadata
* reveal sharing/export controls

---

## 16. Legal review requirement

Screen 11 requires a **dedicated legal-review line item and sign-off**.

Do not treat this calculator as automatically covered by the legal review of static regulatory sections such as Screen 10 / WHY NOW.

The review should specifically evaluate the interactive tool because:

* the visitor controls the hypothetical violation count
* the tool generates a dollar figure Corvinth did not independently choose
* generated outputs are naturally screenshot-prone
* a cropped output can lose surrounding context
* the result could be redistributed independently of the page
* maximum-penalty figures and qualification language can change over time

Legal review should explicitly confirm:

* calculator framing
* result label
* screenshot-safe qualification
* fuller qualification
* use of “maximum” / “up to”
* current maximum civil-penalty amount
* permitted slider range
* surrounding explanatory copy
* absence of liability-estimation claims
* link-preview behavior
* lack of built-in result-sharing/export affordances

This sign-off is separate from approval of static TIDA copy elsewhere on the site.

Builder completion: implementation and technical QA are complete, including all calculator-specific safeguards in this plan.

Release gate: Screen 11 must not be published until the designated external legal review has approved the calculator copy, figure, framing, and interaction.

Codex may report:

> `IMPLEMENTATION COMPLETE — LEGAL RELEASE SIGN-OFF PENDING`

---

## 17. Implementation sequencing

**Screen 11 must be built last.**

Do not bundle the calculator into the same implementation batch as the site's static sections.

Sequence the work as:

1. build all other site sections and interactive experiences
2. complete their implementation review and QA
3. lock the surrounding page structure and copy
4. then implement Screen 11 as an isolated pass
5. run a dedicated Screen 11 QA cycle
6. obtain its separate legal-review sign-off before final release

The calculator should not be used as a dependency that slows or entangles completion of the static site.

Its interactive behavior, generated dollar output, SSR/pre-hydration requirements, URL-state restrictions, metadata isolation, and screenshot behavior warrant an isolated final build and QA pass.

Do not mark Screen 11 complete merely because the surrounding page has shipped successfully.

---

## 18. Do not add

Do not expand this into:

* platform-risk questionnaire
* liability prediction model
* compliance score
* probability estimator
* incident-frequency assumptions
* platform-size multipliers
* “without Corvinth / with Corvinth” comparison
* pricing comparison
* fear countdown
* legal-advice flow
* unrestricted violation-count entry
* shareable calculator URLs
* share-result functionality
* result export
* dynamically generated social-preview numbers

The strength of the calculator is that **the visitor supplies a bounded hypothetical count and the product performs transparent arithmetic**.

---

## 19. Builder acceptance criteria

Builder implementation and QA are complete when:

* all other site sections and interactive experiences have already been built, reviewed, QA'd, and locked before Screen 11 implementation begins
* Screen 11 was implemented in its own isolated build pass
* Screen 11 received its own dedicated QA cycle
* existing calculator layout and interaction remain recognizable
* default count is `1`
* no blank initial calculator state appears
* no cached, previous-session, or last-selected value appears before hydration
* For every rendering mode the site actually uses—including SSR, static rendering, pre-hydration, or no-JS fallback where applicable—the first visible calculator state is `Count: 1`.
* slider maximum is `20`
* no unrestricted input bypasses that ceiling
* no wording implies Corvinth estimated the visitor's actual exposure
* every penalty reference says **maximum / up to**
* result is explicitly hypothetical
* `hypothetical · not an estimate of your liability` is permanently visible **inside the result card**
* the qualification remains inside the same screenshot/crop boundary as the dollar figure
* the fuller legal qualification remains visible on-page
* current penalty amount is centrally configurable and publication-verified
* no verification date is displayed in the UI
* legal-reference verification evidence is kept internal
* changing slider state never changes or serializes into the URL
* no query parameter, hash, or route represents the selected count
* Open Graph/social metadata is fixed and cannot consume calculator state or generated totals
* shared-link previews cannot display a visitor-generated calculator number
* there is no share button
* there is no copy-result control
* there is no export/download-result control
* panic-red/fear styling is removed
* `$99/mo to cover this` is gone
* `get protected` is gone
* the section reconnects the number to **discovery infrastructure**, not fear of fines
* Screen 11 implementation and technical QA are complete; final release remains blocked until the separate legal review and explicit sign-off required by Section 16 are complete

### Final visitor takeaway

> **“I chose the scenario myself. The arithmetic shows why the statutory stakes can become material quickly—but Corvinth isn't claiming this is my liability. The qualification stays attached to the result, and the tool isn't designed to turn hypothetical outputs into shareable fear numbers. The reason Corvinth matters is that reliable discovery is becoming infrastructure worth having.”**

=========================================================================================================================================================================================================

**# SCREEN 12 — FAQ CORRECTIONS**

Keep the FAQ screen, questions, accordion structure, headline, and overall buyer-language tone.

This screen needs **\*\*corrections, not a redesign\*\***.

\---

**## 1. False-positive FAQ — correct the question and product boundary**

Change the question from:

\> **\*\*What happens if there's a false positive and a legitimate image gets blocked?\*\***

to:

\> **\*\*What happens if Corvinth returns a false positive?\*\***

This keeps the buyer’s concern specific to Corvinth without implying Corvinth blocks or removes anything.

The answer should start cleanly:

\> **\*\*Corvinth returns the detection result and supporting context. Your platform decides how that result is reviewed or acted on under its own policy.\*\***

Remove any claim that Corvinth itself:

\* automatically removes exact matches

\* blocks content

\* shadow-quarantines uploads

\* issues challenge links

\* handles appeals or counter-notices

\* makes \`allow / review / block\` decisions

The answer should reinforce:

\> **\*\*Corvinth returns the detection result and supporting context. Your platform decides whether to review, remove, allow, or otherwise act according to its own policy.\*\***

If matching thresholds or review configurations are described, frame them as **\*\*detection configuration\*\***, not automatic enforcement.

\---

**## 2. StopNCII FAQ — keep the question, simplify the claim**

Keep the StopNCII question, but use:

\> **\*\*Is Corvinth integrated with StopNCII?\*\***

Keep the independence statement.

Remove:

\> \`database is built from direct victim complaints (Pulse)\`

and:

\> \`architecture is ready to ingest a feed like theirs\`

Those either pull Corvinth back toward NCII-specific positioning or describe hypothetical future integration capability.

Public answer should establish:

\> **\*\*Corvinth is not partnered with or integrated into StopNCII and does not represent StopNCII. Corvinth independently uses perceptual-hashing technology within its own detection infrastructure.\*\***

Do not state `PDQ-compatible`, `StopNCII-compatible PDQ`, or another specific
Meta/StopNCII compatibility claim unless that exact relationship has been
separately verified and approved for publication.

\---

**## 3. Image-handling FAQ — MUST correct both compute modes**

Keep the question:

\> **\*\*Does Corvinth ever see or store the actual images?\*\***

The current answer beginning with:

\> \`No.\`

must be removed.

Do **\*\*not\*\*** change the public names. Keep:

\> **\*\*Customer Compute\*\***

\>

\> **\*\*Managed Compute\*\***

Answer using the real compute boundaries:

**### Customer Compute**

\> **\*\*Image processing stays inside the customer's infrastructure. Corvinth receives the derived detection representation required for the operation, together with the platform and object identity needed for matching and correlation. Case or evidence context is associated only when the workflow requires it.\*\***

**### Managed Compute**

\> **\*\*Corvinth receives the platform/object identity and temporary fetch access needed to retrieve and process the image. Managed-Compute image bytes are not durably retained by Corvinth.\*\***

Also remove:

\> “architecturally impossible to reconstruct the original image”

and similar absolute security claims.

Do not say:

\> “No data leaves your infrastructure.”

Derived representations and required context do.

\---

**## 4. “How small is too small?” — make this commercial, not legal/fear-based**

Keep the question:

\> **\*\*How small is "too small" to need this?\*\***

Remove:

\* categorical TIDA coverage claims

\* \`If your platform receives user-uploaded images, you are in scope\`

\* penalty scare language

\* fine calculations

\* stale pricing

The answer should focus on the actual engineering tradeoff:

\> **\*\*Small teams are where the tradeoff can matter most: manual discovery competes directly with product and engineering work. Corvinth provides the detection layer without requiring the platform to build and operate that infrastructure itself.\*\***

Do not mention pricing anywhere in this build.

\---

**## 5. Integration-effort FAQ — align with Screen 7**

Keep:

\> **\*\*What's the integration effort for an engineering team?\*\***

Remove:

\* \`one API endpoint\`

\* \`/hash/check\`

\* SDK-centric promises

\* “in an afternoon”

\* “most platforms are live within a working day”

\* language-specific implementation promises unless currently verified

Answer from the locked integration model:

\> **\*\*Integration means establishing the platform scope, connecting the compute path that fits your infrastructure—Managed Compute or Customer Compute—and routing Corvinth's results into the workflow your team already uses.\*\***

Do not promise a fixed timeline unless later supported by real customer evidence.

The point is:

\> **\*\*bounded integration surface\*\***

not manufactured simplicity.

\---

**## 6. Pulse FAQ — rename and correct the operating model**

This FAQ is omitted entirely while the global Semantic-sweep
capability-publication gate is closed. The following instructions apply only
after that gate passes.

Change:

\> **\*\*What is Pulse and when do I need it?\*\***

to:

\> **\*\*What is semantic sweep, and when would I use it?\*\***

If useful internally or in technical docs, \`Pulse\` can remain a secondary product/technical label, but it should not be required terminology for the visitor.

Answer should establish:

\> **\*\*Semantic sweep is an explicitly triggered deeper search across existing platform content, used when the platform wants to search beyond the continuous perceptual-matching path.\*\***

If validated fixtures support the stronger claim, it can additionally say:

\> **\*\*It can surface transformed variants that perceptual matching does not surface.\*\***

Do not claim specific examples such as:

\* heavy crops

\* arbitrary rotations

\* direct victim complaints

unless independently validated.

Also remove packaging language such as:

\> \`Growth plan and above\`

unless current pricing/packaging explicitly supports it.

\---

**# KEEP**

Do not change:

\* \`FAQ\`

\* **\*\*Questions platforms actually ask.\*\***

\* accordion layout

\* overall number of questions

\* restrained visual treatment

\* straightforward buyer-language tone

\* the StopNCII question itself

\* the integration-effort question itself

The original instruction to keep the false-positive question itself is **\*\*superseded by AMEND 7\*\***.

The final false-positive question is:

\> **\*\*What happens if Corvinth returns a false positive?\*\***

The goal is simply to make every answer consistent with the product boundaries already locked elsewhere:

\> **\*\*Corvinth detects and returns context. The platform decides and enforces.\*\***

\> **\*\*Managed Compute uses a time-limited, pre-signed URL to generate the required hash or vector. Image bytes are processed in memory and are not persisted to disk or logs. Customer Compute keeps image processing customer-side.\*\***

\> **Corvinth is detection infrastructure — not the platform's legal-notice handler, compliance validator, or moderation decision-maker.**'

=========================================================================================================================================================================================================

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

`FOR PLATFORM USERS`

**You report to the platform. Corvinth helps it search.**

If a platform turns the item you reported into a detection reference, Corvinth can search that platform’s own content for matches — helping find copies beyond the item you originally reported.

**You do not report to Corvinth. Corvinth does not decide whether your report is valid or what gets removed. Those decisions stay with the platform.**

`Corvinth is not a reporting destination.`

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

I built Corvinth because small platforms often don't have a detection pipeline — they have an inbox. Someone files a report, it reaches an admin, gets forwarded to an engineer, and valuable time disappears into manual searching.
Corvinth is built to replace the manual-search part of that chain with detection infrastructure, so when a platform is working against a removal deadline, engineering is not burning most of that window manually hunting for copies.
Small teams shouldn't need a dedicated trust-and-safety engineering organization just to have this infrastructure. I built Corvinth to fit a startup's infrastructure budget and work alongside the systems the team already uses.
I'm not anonymous — email me directly with questions, including hard ones about what Corvinth can and cannot do.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. REMOVE the 24-hour promise.
    Current:

“we'll get you API credentials within 24 hours.”

Change to:

Tell us about your platform and we'll follow up with access details.

```

AMEND 2 — Semantic-sweep interest field is capability-gated

While the Semantic-sweep capability-publication gate is closed, omit this
field entirely. Do not expose `Pulse`, `Shield`, semantic-sweep terminology,
or backend enum values anywhere in the access form.

The live backend `LeadSubmission.pipeline_choice` field is optional. While the
gate is closed, omit the field from both the public form and the submission
payload. Do not submit a hidden default or expose a backend enum value.

When Semantic sweep has cleared its capability-publication gate, render:

`INTERESTED IN SEMANTIC SWEEP?`

with public values:

`Yes` / `Not right now` / `Not sure`

Use the following private submission mapping; do not expose these backend enum
names in public copy:

`Yes` → `pipeline_choice = shield_and_pulse`

`Not right now` → `pipeline_choice = shield_only`

`Not sure` → `pipeline_choice = unsure`

Until Semantic sweep clears its capability-publication gate, do not publicly
render this field. The UI and mapping may remain hidden/gated for later
activation.

3. REMOVE PRICING FROM THIS BUILD.

Delete the existing access-form pricing line. Do not publish `$99 / $299` or
any replacement pricing inferred by Codex. Pricing is absent until a separately
locked pricing section and commercial strategy exist.

FLAG — “API credentials within 24 hours” is a service promise.

Keep only if you genuinely intend to meet it consistently. Otherwise:

Tell us about your platform and we’ll review your access request.

or:

Tell us about your platform and we'll follow up with access details.

4\. AMEND — `REQUEST API ACCESS` → `REQUEST ACCESS`

Current:

`request API access →`

Change to:

Request access →

Reason: the form starts the access/integration conversation; it does not necessarily mean API credentials are issued immediately after submission.

5\. ADD — Prevent accidental sensitive-content intake

Add a small note beneath the message field:

Please don't include image URLs, user reports, or sensitive content in this form.

This protects the boundary we already locked: the sales/access form must not accidentally become a content-reporting or complaint-intake surface.

6. AMEND — `HOW DID YOU HEAR ABOUT US?` should not be required.

It is attribution data, not access qualification.

Either:

make it optional

or remove it from the initial access form entirely.

The core form should stay focused on:

contact + platform + scale + use case.

Add Semantic-sweep interest only after its capability-publication gate passes.

7\. `PLATFORM URL / PRODUCT LINK` — required for now

The desired public field is:

`PLATFORM URL / PRODUCT LINK`

It should ultimately be optional because pre-launch teams are accepted.

The current backend requires `platform_url`, so do not ship this field as
optional until the backend contract accepts omission. Until that separately
authorized backend change is complete, keep this field required. Do not submit
a fake or empty required URL.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

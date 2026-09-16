1. Complete revised authorization-request text
Corvinth qualification fixture/corpus authorization request
Status: REQUEST ONLY — not approved and not executable.
This document is the complete proposed authority design for the remaining isolated qualification work. Approval authorizes only the qualification provisioning, qualification-only implementation, sealing, execution, evidence, restoration, and cleanup described here. It does not itself create an executable run. The final exact inventory and implemented qualification source must be mechanically derived, independently verified, and resealed before any live request is dispatched.
This request contains no credentials, object keys, VersionIds, URL query strings, raw image bytes, or tenant-sensitive corpus values. Those values may exist only in the sealed operator authorization, anonymous credential packet, isolated qualification database, or ephemeral worker memory as explicitly allowed below.
1. Controlling authority and current checkpoint
Item	Frozen identity or current status	Basis
Planning authority	BUILDER_HANDOFF.md SHA-256 1edda79920762596256dba5f31794f723fa5b40b65974688c8888033536aa7eb	Frozen Builder Handoff, especially Sections 1–9 and 12–14.
Mongo authority artifact	mongo_authority_rebind.py SHA-256 c0178d2bcf1fd9713835adfd6dafc98d87b7286b3346b92fb124bdc5ce9d150b	Frozen provenance requirement in Handoff Section 5.
Current post-replay source	source digest f0bdbaf219108ce4de82c5371006907bedd8ba3144d015a95b2700e91288c44d	Current sealed source; the replay correction is complete and is not reopened by this request.
Prior executable authorization	file SHA-256 1cbce1c531944760862f4308b57f24a23f2186412d76ea07164924d33bbf0afb; expired at Unix 1789343999	Observed authority blocker: it cannot authorize another live run.
Current qualification result	interim failed qualification; READY_FOR_PRODUCTION_DEPLOYMENT = NO; final LATENCY_TARGET_MET not issued	Observed blockers: no fresh-write capacity population, incomplete input/result coverage, stale duplicate expectation, incomplete throttling evidence, failed in-worker cleanup, and no final multiple-run population.


The six previously authorized exact S3 versions remain historical reproducibility/correctness anchors under their existing sealed identities. They are not automatically final latency cells and are not a substitute for the fresh population below.
The pinned arm identities remain:
Arm	Wheel SHA-256	Loaded native-extension SHA-256	Basis
Accepted nogil control	462eb11ccca803495992705c46e20df3561036ce25b52d2dc47ad938bb1f47a2	116b5ee5607e1219a509e540e80d7dfd19835160c1275f18627dd6972a386bed	Handoff Section 4.
Fused-luma/scalar-Jarosz candidate	fb330d74656a695fa7f2cd819589e9bad1c4385317c236b9e8cb63cccaa6c13c	c2b8f464c1266f1aff4ddd356882639911e6f0611b3ded3ccbdb0ece1ad1b3a2	Handoff Section 4.


2. Scope and prohibited resources
Only explicitly sealed, dedicated, isolated-nonproduction qualification resources may be mutated:
- the qualification S3 bucket/prefix and exact immutable versions created under Section 3;
- the qualification Mongo database;
- the qualification Qdrant collection/alias;
- the qualification SQS queue;
- qualification-only network policy, Modal environment, worker processes, and local sealed evidence directories.
The renewed authority inherits the exact target tuple, namespace, dedicated-resource flags, credential transport mechanism, network-policy identity, cleanup ownership, and mutation allowlist from the expired sealed authorization identified in Section 1. Credentials may be refreshed only for the same sealed principals and permissions through the existing anonymous-pipe mechanism. Any target, principal, permission, namespace, resource, or mutation-scope change is outside this request and requires a new operator decision.
Production, shared staging, or otherwise shared Mongo, Qdrant, SQS, S3, network, tenant, corpus, and authorization resources are out of scope. No deployment, production traffic, production configuration/resource change, migration, trust-boundary change, profile activation, or fused-candidate release is authorized.
Basis: Handoff Sections 5, 7, 11, 13, and 14; observed risk of crossing the expired target/mutation boundary.
3. One S3 authority model
All new fixtures use exactly one model: authorize creation, verify exact bytes and metadata, capture the exact VersionId, then reseal before use. New pre-created versions are not a second authority path.
The operator approval covers one bounded provisioning phase and the mechanically derived execution reseal:
1. Before S3 mutation, generate the candidate fixture bytes offline from a sealed deterministic fixture recipe. Compute their SHA-256, encoded length, format, decoded dimensions/pixels, PDQ outputs, and intended stratum/result assignment with both pinned arms. Control and candidate outputs must be identical for every valid fixture before upload.
2. Upload exactly 530 valid fixture objects and three invalid fixture objects once, under the approved qualification-only prefix, with versioning enabled. No overwrite, latest, null VersionId, mutable-key interpretation, or unversioned fallback is allowed.
3. Capture each returned VersionId in memory, then independently GET that exact version and verify body SHA-256, length, Content-Type, format/decode expectation, and version metadata. A mismatch blocks reseal; it does not authorize repair by overwriting the key.
4. Produce an exact final inventory containing bucket/prefix binding, object key, VersionId, byte SHA-256, encoded size, Content-Type, format, dimensions/pixels or invalid-class expectation, stratum, result-class assignment, and dispatch position.
5. Reseal the exact inventory under the approved provisioning-parent digest. The reseal is mechanical attestation within the already approved count, prefix, recipe, and validation rules; it cannot broaden scope. Any extra object, changed count, changed prefix, failed byte/metadata check, changed fixture recipe, or unapproved field requires a new operator decision.
6. No live route request may run from the provisioning authority or from an unsealed captured inventory.
The executable inventory therefore contains exactly 539 versions: six inherited historical anchors plus 530 new valid versions plus three new invalid versions.
The three invalid fixtures are exact versions of:
- one malformed body served with the sealed image Content-Type, expected to fail the existing decode gate;
- one valid image header/body truncated at a sealed byte offset, expected to fail the existing decode gate;
- one bounded decompression-bomb fixture whose encoded bytes remain below the existing fetch limit and whose declared decoded pixels exceed the sealed Pillow hard-error threshold, expected to be rejected before full pixel allocation.
No additional format, size, maximum-edge, or encoded-size exploratory fixture is authorized by default.
Basis: Handoff Sections 2, 3, 6, and 7 require exact VersionId authority, authoritative bytes, supported-format/dimension coverage, and malformed/truncated/decompression-bomb behavior. The bounded creation/reseal flow closes the expired/missing exact-inventory blocker without repeated scope approvals.
4. Exact fresh-write population and permitted claim
4.1 Claim
The default final population is an explicit stratified frontier, not a representative production distribution. It supports only the five exact format/dimension/aspect-ratio points below under the sealed runtime, 4 CPU, 2048 MiB, max_inputs 10, and declared load. It does not establish support for all JPEG/PNG inputs, arbitrary dimensions, additional formats, or a production traffic distribution.
4.2 Strata and counts
All 530 valid fixture byte bodies must have pairwise-distinct original-byte SHA-256 values. Each stratum contains 106 fixtures.
Stratum	Format	Exact dimensions	Aspect orientation	Count	Rationale and basis
F1	JPEG	300×300	square	106	Retained historical square anchor; Handoff Section 7 requires representative dimensions/aspect ratios for the declared frontier.
F2	JPEG	427×640	portrait	106	Retained historical portrait point; closes the missing fresh/write-bearing population blocker.
F3	JPEG	640×427	landscape	106	Retained historical landscape point; closes the missing fresh/write-bearing population blocker.
F4	JPEG	700×1049	larger portrait	106	Retained historical larger-portrait point; preserves an adverse-size frontier rather than selecting only small fixtures.
F5	PNG	1114×784	larger landscape	106	Retained historical PNG/large-landscape point; Handoff Section 7 requires supported-format coverage.


The exact dimensions deliberately reuse observed anchor points instead of inventing broader ranges. Maximum-edge 512/768/1024 and encoded-size 256 KiB/1 MiB exploratory bands remain excluded because the Handoff marks them optional.
4.3 Content distinctness and authority hot spots
Current production source derives:
- the object _id from platform, provider, bucket, key, and exact object version;
- each signal-binding _id from that storage-identity key plus its signal slot;
- the archive unique row from platform, storage-identity key, lane, and hash.
Therefore distinct canonical identities containing identical bytes do not share the same object, signal-binding, or archive documents. Compatible document reconciliation is not inherently broken by repeated bytes. However identical bytes repeat PDQ values, concentrate secondary archive-index values, collapse compute/content diversity, and cannot support a content-population or result-distribution claim. The intended final claim is broader than a synthetic locator-write microbenchmark, so all 530 valid bodies are content-distinct.
Content reuse remains allowed only for dedicated repair, conflict, fault, and replay scenarios after verified reset, where no population representativeness is claimed.
Basis: current storage_identity_contract.py and storage_identity_runtime.py; Handoff Sections 3, 7, 9.5, and 9.6; observed risk that byte-identical copies would overstate population coverage.
4.4 Matching/result distribution
The final fresh and replay frontier schedules use one identical base corpus and this exact endpoint-result distribution across the 530 valid identities:
Endpoint result in base-corpus state	Count	Lane/case composition
CLEAN	518	No valid canonical candidate within the applicable standard radius 45 or normalized radius 15.
EXACT	4	One standard d=0; one normalized d=0; one severity case where standard EXACT defeats normalized FUZZY; one exact-tie case where standard wins.
FUZZY	6	Standard d=11 and d=31; normalized d=1 and d=15; normalized wins two cross-lane cases described in Section 5.
NEAR_MISS	2	Standard d=32 and d=45.


The 10 warmup identities are two CLEAN identities per stratum. The fixed 520 measured identities therefore contain 508 CLEAN, 4 EXACT, 6 FUZZY, and 2 NEAR_MISS results. Stratum, result class, lane, expected distance, action, and dispatch position are sealed before execution and are identical across paired arms and controlled runs.
This distribution is not asserted to represent production prevalence. Matching is outside CORE_POST_FETCH_CLOCK; direct-core persistence/capacity claims and end-to-end matching/action correctness are reported separately.
Basis: Handoff Sections 2.3, 3, 7, 9.1, and 9.2; observed missing required result-class coverage.
5. Corpus derived from production semantics
The corpus is built only from the sealed fixture outputs and current production registration/matching paths. Qualification-only matching semantics are prohibited.
The qualification platform uses the sealed current thresholds: standard EXACT d <= 10, FUZZY 11..31, NEAR_MISS 32..45, CLEAN beyond 45/no candidate; normalized EXACT d = 0, FUZZY 1..15, CLEAN beyond 15. Standard and normalized lanes remain isolated. Arbitration is severity first, then smaller distance within equal severity, with standard winning an exact tie.
Each non-exact fixture-derived corpus value is created by a sealed deterministic bit-flip manifest over the fixture's actual 256-bit lane hash. The manifest records the source fixture/lane/hash digest, ordered flipped-bit positions, resulting tuple digest, intended distance, and intended winner. Before reseal, the current production Hamming-distance function and full production search/arbitration path must verify the exact distance, uniqueness, winning lane, classification, and action against the complete corpus. Any unintended closer candidate or collision blocks reseal.
The base corpus contains exactly 16 unique canonical tuples supporting the 12 matched fixtures in the final distribution: five standard threshold tuples, three normalized threshold tuples, and two tuples for each of four cross-lane cases. The remaining 518 final fixtures have no candidate within either lane radius. The corpus variants for stale/incompatible validation add exactly two standard tuples, at d=11 and d=12, for one otherwise-CLEAN designated correctness fixture; those two tuples are not present in the final base corpus.
The mechanically derived cases are:
Case	Canonical corpus construction	Expected production result	Basis
Standard threshold cases	Fixture-derived standard tuple at d=0, d=11, d=31, d=32, and d=45	EXACT, FUZZY, FUZZY, NEAR_MISS, NEAR_MISS	Handoff Section 3 and current classify_distance.
Normalized threshold cases	Fixture-derived normalized tuple at d=0, d=1, and d=15	EXACT, FUZZY, FUZZY	Handoff Section 3 and current normalized-lane contract.
Severity: standard wins	Standard d=10 and normalized d=1 for one fixture	Standard EXACT, content_removed	Frozen severity-first arbitration.
Severity: normalized wins	Standard d=32 and normalized d=15 for one fixture	Normalized FUZZY, content_shadow_quarantined	Frozen severity-first arbitration.
Equal severity, smaller distance	Standard d=20 and normalized d=10	Normalized FUZZY, content_shadow_quarantined	Frozen within-severity distance rule.
Exact tie	Standard d=0 and normalized d=0	Standard EXACT, content_removed	Frozen deterministic standard-lane tie rule.
CLEAN	No searchable tuple within either lane radius	CLEAN, content_allowed, no review queue	Current production result/action contract.
Strict-mode remap	Reuse the standard d=11 fixture in a separately reset strict-mode correctness context	Response classification EXACT and content_removed	Current production strict-mode action contract; correctness-only, not a latency population.
Stale candidate	Variant corpus adds d=11 and d=12 standard tuples for one designated fixture; after the search snapshot, remove the closer tuple's canonical row while retaining the farther valid candidate	Stale key excluded; canonical re-read/retry selects the valid d=12 candidate	Handoff canonical-validation/withdrawal requirement and observed missing live coverage.
Incompatible candidate	Use the same two-tuple variant, but mutate the closer tuple's canonical row into the exact sealed incompatible state after the search snapshot	Incompatible key excluded; retry selects the valid d=12 candidate, or the request fails closed if the production validator cannot establish authority	Handoff authority/fail-closed requirement and observed missing live coverage.


Every canonical tuple must be created through current register_confirmed_hash_claims behavior with the qualification platform owner scope, source="platform_report", required owner case, claim, fence, canonical document, and archive-scan coordination. Direct insertion of arbitrary confirmed_hashes rows is prohibited. Setup verifies those records, the canonical corpus digest, and the loaded VP-tree/hot-buffer/inactive-key state before requests.
The stale/incompatible cases are the sole exception to normal base-corpus state: after valid production registration and search-surface loading, a sealed qualification-only fault hook performs the exact declared removal or incompatible-field mutation in that dedicated context. It may not add a new matching semantic, alter thresholds, or affect any base/final cell, and the context is reset immediately afterward.
Real qualification database records required by production registration, matching, persistence, canonical validation, and enqueue are allowed. “No persisted match records” means no tenant-sensitive or raw corpus values in logs, evidence summaries, chat output, or unsealed artifacts. Safe evidence may retain digests, counts, opaque case IDs, distances, classes, lanes, actions, and validation outcomes.
Base-corpus identity and result distribution must be identical across final paired arms/runs. Stale/incompatible and strict-mode variants are separate paired correctness contexts with their own sealed state digest and are never pooled with final latency cells.
6. Fresh authority creation after verified reset
Each controlled epoch uses this exact sequence:
1. Quiesce and reset only the sealed qualification Mongo database, Qdrant collection/alias, and SQS queue. Preserve exact S3 versions.
2. Recreate startup markers, integration/platform records, and the sealed base corpus through production authority paths.
3. Independently verify the restored logical-state digest, physical collection identities, indexes, corpus digest, loaded matching state, Qdrant/SQS baseline, and exact fixture metadata.
4. In one untimed bulk precondition check, prove that every one of the 530 scheduled canonical storage identities is absent from object, expected signal-binding, and archive authority. Any present or ambiguous identity blocks the epoch.
5. Seal the ordered 530-entry dispatch schedule and its digest. No identity repeats during the fresh-creation phase.
6. Dispatch exactly 10 warmup requests and exactly 520 measured requests at declared concurrency 10. There is no timed per-request preflight authority read. The production request’s own first object-authority read remains inside the direct core clock and confirms runtime state.
7. Each successful fresh observation must contain the intended object insert, expected signal-binding writes, archive writes, and acknowledged transaction commit. Replay, repair, compatible reconciliation, duplicate recovery, missing write evidence, or unacknowledged commit cannot count as a fresh success.
8. Retain all 520 measured attempts. A final fresh run passes its sample floor only with at least 500 valid successful fresh creations. The remaining 20 attempts are a predeclared failure allowance, not hidden spares: they always run, every failure remains in the denominator/capacity report, and more than 20 failures fails the run.
9. After fresh creation, execute the separately identified compatible-replay cell over the same exact 530 identities and fixed result distribution: 10 warmups plus 520 measured attempts at concurrency 10. A valid replay observation must prove complete authority, zero persistence writes, acknowledged transaction completion, and unchanged authority. This is distinct from the already completed same-identity contention probe and does not redo it.
10. Complete in-worker cleanup and the independent post-worker verification in Section 11.
The same exact S3 versions may be reused in another arm or controlled run only after the full reset and absence proof above. This contract is named fresh authority creation after verified reset. It is not described as globally fresh S3 content or never-before-seen bytes.
Basis: Handoff Sections 2.2, 7, 9.2, 9.5, and 9.6; observed blocker that the current modulo runner turns repeated requests into replay and cannot prove write-bearing capacity.
7. Final controlled runs and statistics frozen before data
7.1 Final run order
The final qualifying order is fixed before observations:
Order	Run	Exact sequence	Basis
1	Control run 1	reset → fresh frontier → replay frontier → in-worker cleanup	Handoff control requirement and first of multiple controlled runs.
2	Control run 2	reset → fresh frontier → replay frontier → in-worker cleanup	Handoff >=1,000-success multiple-run floor; independent repeat under the same control artifact.
3	Candidate run 1	reset → fresh frontier → replay frontier → in-worker cleanup	Handoff paired candidate comparison under identical conditions.
4	Candidate run 2	reset → fresh frontier → replay frontier → in-worker cleanup	Handoff >=1,000-success multiple-run floor; independent repeat under the same candidate artifact.


Each epoch uses identical qualification source/instrumentation, exact authorization, corpus, fixtures, dispatch order, reset policy, resource envelope, runtime/dependencies, and load. The only arm difference is the truthfully recorded pinned wheel and loaded native-extension identity.
The six historical anchors remain paired correctness/reproducibility checks. None is promoted to an individual >=1,000-success replay latency cell. The two mixed-strata final cells above—fresh creation and compatible replay—are the only default cells intended to support a final p95/frontier statement. This avoids six unsupported final-cell promotions while still satisfying the Handoff’s fresh/replay and multiple-run requirements.
7.2 Statistical contract
- Report every controlled run independently with raw successful direct CORE_POST_FETCH_CLOCK samples, p50, p90, p95, attempts, successes, failures, retries, censored work, and result/stratum composition.
- Never average run percentiles.
- Never pool control with candidate.
- Within one arm and one cell, pool raw successful direct-core samples across run 1 and run 2 only if source, artifact, runtime/dependencies, resource envelope, reset/corpus/fixture/schedule digests, load, clock boundary, instrumentation, and successful stratum/result composition are mechanically comparable.
- If comparability is unresolved, a run is censored, a direct clock is invalid, or the successful composition differs, report runs separately and fail/censor the final pooled cell rather than selecting favorable data.
- At least 1,000 valid successful measured requests across the two comparable runs are required for each final fresh/replay cell. Failures, rejections, timeouts, resource terminations, aborted work, repairs, and reconciled non-fresh requests never enter latency quantiles and remain separate capacity evidence.
- Use the frozen median and nearest-rank p90/p95 method on direct samples only. Do not reconstruct core latency from stages or sum percentiles.
Option A/B may remain open during implementation, offline validation, and non-final focused probes. It must be operator-frozen before the first final controlled run starts and cannot change after any final observation exists. The final binary verdict is then computed mechanically under the selected Handoff Section 9.3 rule.
8. Paired correctness, authority, and fault contexts
These are mandatory paired control/candidate contexts but are not default final latency cells and do not require 1,000 successes:
Context	Exact required proof	Basis
Six historical anchors	Exact output/dihedral/quality identity and unchanged current behavior on retained fixtures	Handoff Sections 3, 7, and 9.1.
Result/action matrix	Section 5 thresholds, lanes, arbitration, canonical validation, match_found, classification, action, enqueue, and strict-mode remap	Handoff Sections 2.3, 3, 7, 9.1, and 9.2; observed coverage blocker.
Repair: signal	Compatible object/archive with one expected signal binding absent; transactional repair; next replay zero-write	Observed incomplete-authority blocker and frozen persistence contract.
Repair: archive	Compatible object/signals with one expected archive row absent; transactional repair; next replay zero-write	Same basis.
Upgrade: platform content	Compatible authority missing permitted platform_content_id; write path changes only the permitted monotonic binding	Frozen authority semantics and replay correction invariant.
Upgrade: Corvinth verification	Compatible authority missing required verification timestamp; write path advances it and does not classify as zero-write replay	Frozen authority semantics and replay correction invariant.
Conflicts	Content SHA, immutable integration/configuration, non-null content-ID, signal, and archive-slot conflicts each fail closed without unauthorized mutation	Handoff Sections 3 and 9.2.
Transient transaction	One qualification-only injected TransientTransactionError on a genuinely fresh write; bounded retry and acknowledged success	Handoff transaction/retry requirement.
Unknown commit	Hide one real commit acknowledgment on a genuinely fresh write; reconciliation proves exact durable authority or fails closed	Handoff uncertain-commit requirement.
Invalid inputs	Exact malformed, truncated, and decompression-bomb versions reject under existing gates without entering successful quantiles	Handoff Section 7 and observed coverage blocker.


Duplicate-write resolution
The old blanket expectation “duplicate-write must fail” is stale. Current production semantics are conditional and correct in source:
- after a duplicate-key error, exact complete compatible authority that is already durable may reconcile to success;
- absent or incomplete authority cannot reconcile to success and must surface persistence unavailable;
- incompatible authority must fail closed with the applicable invariant conflict.
The prior fault ran after reused fixture authority already existed, so compatible success did not prove the configured expected-failure branch was wrong in production. Qualification must not change correct reconciliation merely to satisfy that obsolete expectation.
The renewed paired fault matrix contains:
1. an injected duplicate on a genuinely fresh identity with no competing durable authority, expected to fail and leave no unauthorized partial state;
2. a controlled compatible duplicate race: a one-shot qualification barrier pauses the target at its first signal bulk write, a companion call uses the actual production persistence function to majority-commit the exact same complete authority, and only then the target hook raises duplicate key; the target may succeed only after its normal exact complete-authority reconciliation verifies the companion's durable state;
3. an incompatible competing-authority case, expected to fail closed.
The runner records the actual durable postcondition, retry/reconciliation path, HTTP result, and acknowledgment evidence. Mock injection alone is not durable proof.
Basis: current persist_synchronous_pdq_authority; Handoff Sections 3, 7, and 9.2; observed stale duplicate-write expectation.
9. Required resource evidence—no optional expansion
The controlling envelope remains exactly 4 CPU, 2048 MiB, max_inputs 10. Default authorization excludes the optional 1/2/4/8/10 sweep.
Every final run must retain:
- configured and observed cgroup CPU quota/period and cpuset;
- process/container CPU seconds and utilization derived from monotonic interval deltas against the observed quota;
- throttling counters (nr_periods, nr_throttled, throttled time/usec) when exposed by the active cgroup interface;
- current and peak cgroup/container memory;
- per-process RSS and, where available, PSS/USS or smaps_rollup, with shared-page/double-counting limits stated;
- PDQ and matching executor queue depth/queue-wait observations and active-request pressure;
- all failures, retries, timeouts, censored requests, worker exits, OOM/resource events, and resource terminations.
The current retained cgroup-v1 evidence exposed usage_usec but not trustworthy throttling counters, so the throttling gate remains incomplete. Qualification-only instrumentation may read the active cgroup v1/v2 files or process metrics needed above. If the environment does not expose a required counter, evidence must state unavailable; it may not infer zero throttling. If no equivalent trustworthy measurement exists, the resource/readiness gate fails and a different observable isolated environment requires separate authorization.
No production resource setting, executor size, concurrency policy, or application behavior may change to obtain a pass.
Basis: Handoff Sections 6, 7, and 9.5; observed CPU-throttling evidence blocker.
10. Minimum qualification-only implementation after approval
Only these changes are authorized, and only after this request is approved:
1. Two-phase authority schema: represent the approved bounded provisioning parent and the mechanically derived exact executable inventory/reseal; reject any count, recipe, namespace, metadata, or parent-digest drift.
2. Fixture/schedule schema: support the 530 valid + 3 invalid exact versions, five strata, result metadata, fixed 530-entry fresh and replay schedules, controlled-run IDs, and final-cell purpose without the current exactly-six fixture constraint.
3. Reset/corpus setup: reset before every controlled epoch; seed the base corpus through current production registration/ownership/fence/archive-scan semantics; verify logical/physical/corpus/loaded-state digests; support separately sealed strict/stale/incompatible correctness variants.
4. Fresh dispatch: replace modulo selection with the sealed non-reusing schedule; perform one untimed bulk absence proof before the fresh phase; add no per-request preflight read.
5. Persistence classification: classify each observation as fresh creation, exact replay, repair, upgrade, compatible reconciliation, conflict, or failure from direct command/transaction/acknowledgment evidence. Count only proven fresh writes in the fresh cell.
6. Bounded execution: run exactly 10 warmups + 520 measured attempts; eliminate unbounded success-chasing; retain all failures and enforce the 500-success/run floor.
7. Statistics/comparability: report each run independently; enforce raw-sample-only pooling and fail-closed comparability checks from Section 7.
8. Fault semantics: replace the obsolete blanket duplicate expected outcome with the three source-derived duplicate cases in Section 8; keep transient and unknown-commit cases one-shot and qualification-only.
9. Resource sampler: capture only the Handoff-required CPU, throttling, memory/RSS, queue/executor, failure, timeout, and termination evidence in Section 9.
10. Cleanup evidence: make in-worker cleanup and independent post-worker verification distinct recorded gates with bounded retries and fixed failure records.
Production runtime behavior remains unchanged unless later evidence independently establishes a production defect and a separate operator decision authorizes a production change. Qualification implementation may not alter thresholds, matching/arbitration, persistence guarantees, clocks, resource envelope, supported concurrency, or trust boundaries.
After implementation and offline focused tests, reseal the qualification source, exact fixture inventory, corpus/state digests, run schedule, control/candidate artifacts, runtime/dependencies, network policy, resources, and evidence schema before live execution. Final paired evidence must differ only in truthfully recorded pinned PDQ artifact identity.
Basis: Handoff Sections 4–8 and 9.6; observed structural runner blockers.
11. In-worker cleanup and restoration gate
Every controlled/fault/correctness context must run its authorized in-worker cleanup in finally, with bounded recorded attempts. A context passes this gate only if the worker itself acknowledges Mongo drop, Qdrant removal, SQS purge, credential/env/fault-hook restoration, and S3-version preservation as applicable.
After worker exit, an independent verifier must confirm the qualification Mongo database is empty/absent, Qdrant alias/collection is absent or at the sealed baseline, SQS is empty, no qualification process/lease remains, and exact S3 versions are unchanged.
External recovery is mandatory for safety after a cleanup failure, but it does not convert the in-worker cleanup gate to pass. The failed context remains failed/censored and cannot supply final pooled evidence.
Basis: Handoff restoration/reproducibility requirements and the observed candidate cleanup failure followed by external recovery.
12. Authorization duration and expiry
Proposed authorization window: 14 calendar days from operator signature.
- issued_at and expires_at = issued_at + 14 days are sealed exact UTC timestamps.
- No new provisioning, implementation-backed live context, or final run may start during the final 24 hours.
- The final 24 hours are cleanup, independent verification, evidence hashing, and emergency recovery only.
- Expiry never suspends cleanup authority for already-created qualification state; cleanup/restoration remains required immediately, but expired authority cannot start or resume measurement.
- Any extension, new target, new fixture count/class, changed corpus semantics, or changed mutation scope requires a new operator approval.
Basis: observed expiry blocker and prior multi-day sealed execution/recovery history. Fourteen days provides implementation, reseal, four final epochs, paired correctness/fault contexts, and a non-negotiable 24-hour cleanup margin without creating standing authority.
13. Evidence and final gates
Gate	Pass condition	Basis
Sealed identity	Source, authorization parent/reseal, fixtures, corpus, schedule, runtime/dependencies, network/resources, wheels and loaded extensions match exact digests	Handoff Sections 4, 6, and 9.6.
Output/behavior	Control and candidate preserve hashes, ordering, quality, lanes, thresholds, arbitration, actions, canonical validation, enqueue, and tested errors	Handoff Sections 3 and 9.1.
Fresh persistence	>=500/520 valid fresh successes per run, intended writes and acknowledged commit, no identity reuse, failures retained	Handoff Sections 2.2, 7, and 9.2; capacity blocker.
Replay persistence	Complete compatible authority, zero writes, unchanged authority, direct clocks; no repair/upgrade counted	Frozen replay contract; distinct from fresh capacity.
Final sample/comparability	>=1,000 successes across two comparable controlled runs per final cell; no percentile averaging or mismatched pooling	Handoff Section 7.
Fault/authority	Repair, upgrade, conflicts, conditional duplicate behavior, transient retry, and unknown commit meet exact source-derived outcomes	Handoff Sections 3, 7, and 9.2.
Input/result coverage	Invalid inputs plus Section 5 result/action/canonical-validation matrix pass in both arms	Handoff Sections 7, 9.1, and 9.2.
Resource/capacity	Actual 4 CPU/2048 MiB/max_inputs 10 evidence, trustworthy utilization/throttling/memory/queue data, no hidden failures or resource terminations	Handoff Sections 7 and 9.5.
In-worker cleanup	Worker cleanup passes independently of external verification; recovery cannot relabel failure	Observed cleanup blocker.
Latency	Option A/B frozen before final data; direct per-run and, if comparable, pooled raw CORE p50/p90/p95 mechanically evaluated	Handoff Sections 2.2, 7, 9.3, and 9.4.
Readiness	Every mandatory non-latency technical gate passes before READY_FOR_PRODUCTION_DEPLOYMENT = YES	Handoff Section 9.7.


Evidence must retain raw observations and failures, exact run order, warmup policy, direct clock events, stage/resource observations, state/fixture/corpus/schedule digests, loaded artifact identity, cleanup records, and a complete evidence manifest. It must not retain secrets, presigned URL queries, raw images, or raw/tenant-sensitive corpus values.
14. Fail-closed execution boundary
This request remains non-executable until operator approval. Approval authorizes only the bounded design above. Live execution remains blocked until:
1. qualification-only implementation and focused offline tests complete;
2. the 530 valid and three invalid exact versions are created and independently verified under the approved provisioning parent;
3. the exact inventory, corpus/state variants, fixed schedules, implementation, artifacts, runtime, resources, and network policy are resealed;
4. static/dry-run validation passes without external mutation;
5. Option A or B is frozen before final controlled observations.
Stop and report rather than repair scope if any exact inventory derivation, byte/metadata check, corpus outcome, control/candidate output, target binding, source identity, resource identity, schedule, or seal differs. Do not mutate production, shared resources, or production behavior.
15. Approval readiness
No material design ambiguity remains. Option A/B is a required later latency-verdict decision but does not prevent approval of this authority design or qualification-only implementation; it must be frozen before final controlled runs.
This request is ready for operator authorization.
2. Short delta from the current request
- Replaced the incomplete request with one bounded authority design covering all 17 required amendments.
- Froze one creation-capture-reseal S3 model, exact population counts, corpus/result distribution, fresh-versus-replay schedules, run order, statistics, fault semantics, resource evidence, cleanup, expiry, and implementation limits.
- Changed only [qualification-authority-request-2026-09-15.md](/Users/samanyu_bhad03/one/one all /corvinth-api/qualification-authority-request-2026-09-15.md).
- File SHA-256 changed from 95755668... to c629d13ca12da9257bfb3f02db55ae664dc6a48835be7b46cb27bfb5f5d714ae.
- No fixture/corpus mutation, runner implementation, production change, or live qualification was performed. Tests were not run because this was a review/design-only amendment.
3. Remaining operator decision
No operator decision prevents approval of this authority design. Option A/B remains intentionally open until it must be frozen before the first final controlled run.
Ready for operator authorization.
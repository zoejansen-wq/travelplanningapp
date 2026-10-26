# Dayfolk MUP v1 — Sustainable discovery and preference learning

## Product contract

**Only four research regions:** Ibiza, Lisbon, Sint Maarten / Saint-Martin, New York City. The general architecture could support new geography after explicit approval, but there is no automatic geographic expansion.

A healthy recommendation system must:
1. Never make activity availability, photo rights, prices, or locations up.
2. Explore across the user's eligible categories, even with strong prior dislikes.
3. Learn only from explicit, reason-coded feedback, scoped to the selected person/group context.
4. Be varied but auditable: every ordering has a seed, catalog set, filter, date and algorithm version.
5. Be reproducible for testing and preserve clear escape routes (category filters and Surprise me).
6. Keep personal signals on the current device/session; no server telemetry is required.

## Data foundation

**Source record** → original provider ID, URL, source edit timestamp, observed timestamp, license/terms, region, coordinates, source type, extraction errors.

**Place** → stable ID, name, aliases, geometry, category, jurisdiction, photo candidates, place metadata.

**Activity/event** → linked place ID(s), description written by Dayfolk, category, source evidence URL, event dates with timezone, recurring seasons, opening rules, closure exceptions, currency/price with observation timestamp, accessibility/age, quality state.

**Photo** → original Commons file ID/URL, author, license and license URL, capture date, exact-place match status, reviewer decision.

**User feedback** → activity ID, reason, like/dislike/save, person-or-group context; no preference scores are stored remotely.

**Source strategy** → tag/search-query template, destination, attempt timestamp, category yield, field completeness, source freshness, error rate, score, and last selection time.

States must be explicit: `candidate`, `needs_review`, `approved`, `expired`, `rejected`. A POI is not automatically an activity, and a place being open is not evidence that an event has a ticket.

## MUP v1 ranking

Algorithm: `mup-recommendations.js` **v1.0.0**, no external libraries.

- Feedback weights: like +1, dislike -1, save +0.35, per category bounded [-3,+3].
- Reason tags: budget, self-guided, local, duration. Attribute scores bounded [-2,+2].
- Ranking score: capped explicit-preference signal + seeded random exploration.
- Result order: at most one item per category before repeating a category.
- Results never bypass upstream eligibility filters (region, travel date, age, editorial quarantine, approved photography).
- Shuffle seed: a browser-session random seed + region + selected date + category filter + shuffle counter.
- `Surprise me` changes the ordering without resetting feedback.
- No inferred preferences from mere page views, dwell time or geographic movement.
- Like/dislike decisions are reversibly represented by the latest explicit feedback per item.

This is a **bounded online preference model**, not a trained neural recommender. It is explainable, low-energy, low-storage, and can be upgraded after measurable user testing.

## Acceptance tests and quantitative thresholds

| Gate | MUP requirement | Current evidence |
|---|---|---|
| Catalog integrity | Source IDs, category, coordinates, source URL and photo provenance valid | Structural checks; manual source checks still needed |
| Availability | No claim of open-on-date without schedule evidence | Existing catalog has major gaps; status often unknown |
| Reproducible ranking | Same input and seed always same result | Passed direct execution |
| Exploration | Multiple eligible categories appear ahead of repeats | Nine-category synthetic test passed |
| Random variety | Seed changes ordering | Passed direct execution |
| Stability | 1000 repeated interactions never grow a category weight beyond cap | Passed direct execution |
| Data separation | Research records do not publish themselves | Weekly pipeline produces review PRs only |
| Recommendation usefulness | Users find relevant ideas; no evidence-free certainty | Requires observed user studies |
| Feed health | Freshness measured from upstream update, not local fetch | Code distinguishes timestamps; real weekly run still unverified |
| Privacy | No server-side feedback profile | In-session preference state |

## Release gates

**Do not claim the MUP is production-proven** until all of the following hold:

- Each region has at least **30 vetted activities**, at least three items in six categories; each visible activity has a genuinely matching rights-cleared photo.
- At least 80% of candidates have category/coordinates; at least 50% have reliable hours/dates, plus a demonstrated date-filter safety test.
- Accuracy sample: at least 15 manually verified items from each of the top two sources in each destination (120 total) with explicit false-available counts.
- 100% of in-app displayed prices marked with currency and applicable checked date, otherwise shown as unknown.
- Deterministic ranking regression tests and mobile/desktop browser regression checks pass.
- Test feedback with balanced, cold-start, and sparse-catalog scenarios; record category diversity and false-negative suppression.
- Image licensing is reviewed individually; autogenerated illustrations are not falsely presented as location photographs.
- End-to-end scheduled GitHub collection run has been observed, including regional errors and draft PR.

## Sustainability / operational reliability

- Bounded API calls, standard-library collector, caching, rotation and unchanged-data retention.
- Only official/open-data feeds under allowed terms. Site search proposals do not grant scraping permission.
- Run per region in isolated jobs, retaining errors and source observations. Fail closed when license, rights or availability cannot be confirmed.
- Avoid LLM calls per activity or per user interaction. Deterministic seeded math costs negligible CPU.
- Keep research provenance and feedback learning separate; never let subjective likes override safety, age, accessibility, closure or copyright gates.
- Periodically expire stale source evidence; maintain an operator review queue rather than hallucinating coverage.

## Known limitations

The active catalog has far fewer photo-eligible activities than the 30-per-region goal; preference ranking cannot create missing supply. Feedback is not a long-term account-level model. The algorithm does not yet use travel distance or confirmed opening schedules as positive ranking factors, and no controlled user study or production browser run has verified recommendation quality.

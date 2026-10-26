# Dayfolk automated discovery foundation

**Scope:** Ibiza, Lisbon, Sint Maarten/Saint-Martin and New York City. The collector's design is reusable, but no other destination is configured, researched or collected.

## What runs
`.github/workflows/weekly-discovery.yml` is scheduled every Monday at **03:17 UTC** and can be triggered manually from GitHub Actions. Four isolated collection jobs query public OpenStreetMap Overpass (three bounded tag strategies each), query Wikimedia Commons for a limited number of **photo candidates**, and, in NYC only, read the published NYC Parks 14-day event feed. Each run also proposes locally phrased searches for official/community datasets and records strategy scores.

The research data and learned performance statistics are packaged as GitHub Actions artifacts and proposed in a **draft PR** at `automation/weekly-activity-research`. These files are not incorporated into `collections.json` or the embedded page catalog. Pull-request creation requires the repository Actions setting that allows GitHub Actions to create pull requests. If disabled, the run artifacts are still retained.

## What "learning" actually means
This is transparent **adaptive source selection**, not model training. Each tag strategy receives a quality score (record yield, coordinates, category, operating schedule and recent source timestamps). The collector reuses the highest scoring strategy while deliberately rotating the rest to avoid a feedback loop that only finds already-popular categories. It saves `strategy_stats`, `iteration`, a per-attempt audit and suggested local-language search phrases. New strategies can be added to the configuration after source/rights review. Keyword search proposals **are not executed by a general web crawler**.

No ML model, scraping of commercial websites, or runtime expansion to fifth destinations is enabled.

## Files
- `discovery/config.json`: four destination bounding boxes, local languages/terms, nine tag strategies, approved endpoints, query budgets.
- `scripts/discover.py`: standard-library collector; source timestamps are distinct from retrieval time.
- `tests/test_discovery.py`: mocked offline unit tests including scope lock, schedule uncertainty, bounded queries and exploration.
- `data/research/<region>.json`: candidate places, events, photo suggestions, collection attempts, error logs, per-region completeness.
- `data/research/<region>-learning.json`: persistent score history (after the draft PR is merged).

## Data integrity and publication gates

All imported OSM places and NYC event records have `publishable=false`. `source_freshness` denotes the source element's own edit timestamp; `observed_at` denotes when Dayfolk read it. OSM opening_hours is raw data, **not a claim that the activity is open for a travel date**. NYC event dates are not automatically matched to a place or confirmed available. Photos are **candidate matches only** until author, license URL, source, exact subject, and appropriate terms are approved. Source terms for NYC and commercial uses require confirmation.

Before promotion, reviewers must check: 3 real activities in 6 categories, source licensing, geographic accuracy, record-level schedules/closures, false availability, deduplication within 150m, current dates, original photo rights, age policies, and attribution. NYC's event feed expires rapidly; missing or stale feeds must not be substituted with "available" claims. Cross-region comparisons remain evidence-based.

## Limits and failure behavior
- Public Overpass may rate limit, time out or change its usage policy. Queries cap output and response size and sleep between requests. Move to regional extracts or a managed endpoint if volumes grow.
- NYC feed access may fail or default to 1,000 results; the current adapter requests 1,000 and reports candidates only; its coverage is not guaranteed.
- Lisbon's AgendaLX live endpoint is **disabled** pending publisher/terms confirmation; Ibiza and Sint Maarten/Saint-Martin official event APIs also remain disabled. Manual reviewed source relationships in `local-activity-evidence.json` remain available.
- Commons image metadata can be incomplete or contain HTML and a file can be about a similarly named place. All matches need review.
- A regional collector that cannot make **any successful primary query fails its job**, while other regions continue. Artifacts retain partial success. The aggregate PR should be reviewed for failed regions.
- Scheduled GitHub Actions can be delayed or disabled by repository settings. Workflow commit is not proof of successful execution.

## Operations
Run a local sample:
```bash
python -m unittest discover -s tests -p 'test_*.py' -v
python scripts/discover.py --region lisbon --out /tmp/lisbon.json --learning-out /tmp/lisbon-learning.json
```
No external Python libraries or credentials are required for the configured public endpoints. Always obey the upstream published access and attribution rules. In a production/commercial environment, review data-sharing and API agreements before using public instance services.

Review PRs and merge only research outputs; **do not directly publish activity candidates**. Any later promotion script must have a separate date-aware, license-aware and photo-aware approval gate.

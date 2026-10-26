# Four-region local activities and matching method

Only Ibiza, Lisbon, Sint Maarten/Saint-Martin, NYC. These examples correlate a known local POI to independent activity evidence, but are NOT public availability confirmations.

| Destination | POI | Local activity source | Join strategy | Date validity | Problem |
|---|---|---|---|---|---|
| Ibiza | Las Dalias market | [Ibiza tourism](https://en.ibiza.travel/listing/las-dalias-ibiza/30951101/) | Name + regional location | October weekend hours | Weather closures and season exceptions |
| Lisbon | Gulbenkian CAM | [Visit Lisboa events](https://www.visitlisboa.com/en/events), [municipal AgendaLX](https://dados.cm-lisboa.pt/en/dataset/agenda-cultural-de-lisboa) | Venue alias and municipal ID when available | Exhibition range | Exhibition dates do not prove venue opening on selected day |
| Sint Maarten/Saint-Martin | Marigot Market | [Local tourism editorial](https://www.visitstmaarten.com/bespoke-sxm/) | Name, French jurisdiction, proximity | Wednesday/Saturday mornings, exact hours unknown | Sparse structured data, closure exceptions, FR/EUR |
| NYC | Fort Tryon Park | [NYC Parks official 14-day feed](https://data.cityofnewyork.us/City-Government/NYC-Parks-Public-Events-Upcoming-14-Days/w3wp-dpdi) | NYC park ID M029, then event GUID | Per-event date and start/end | High volume and rolling retention |

## Repeatable collection logic

1. Collect public place geometry and stable IDs independently from local events and activities.
2. Join first by stable native IDs, then normalized names within a jurisdiction. Spatial matches within 150 m are review candidates, not automatic matches.
3. Record event dates, local timezones, seasonal rules and closure exceptions. Test each against user's selected travel date.
4. Source freshness does not establish opening availability. Missing schedule information must remain unknown.
5. Keep images separate: Wikimedia Commons machine-readable author/license metadata plus exact-place subject checks. Do not reuse tourism-board photographs without written permission.
6. Retain candidates, published items, expired items and rejected matches separately. Require source usage rights, activity evidence and photo approval before promoting any item.
7. Use API/download feeds when explicit access and reuse terms permit them. Otherwise retain manual source links and a review queue.

Run the local evidence join with `node scripts/match-local-evidence.mjs`. This is read-only and does not crawl or publish data. The four examples are traced to source URLs; no new automatic activity ingestion or photos were deployed.

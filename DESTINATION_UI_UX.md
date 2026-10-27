# Destination-first UI — purposeful MUP

Reference: https://lawsofux.com/

## Decisions implemented

- **Hick's Law / choice overload:** remove the speculative Surprise me button and keep category filters, six initial ideas, source links and Add to day. No extra decision screen on destination transition.
- **Jakob's Law:** preserve recognisable select, list/card, save, filter, Add to day, and plan controls. No custom gesture is mandatory.
- **Law of common region and proximity:** destination context, filters, cards and planner are contained in distinct layers. Information hierarchy remains legible over city photographs.
- **Fitts's Law:** existing interactive controls use a 44px minimum hit target; preserve focus indicators and mobile navigation.
- **Aesthetic-usability effect:** visuals support atmosphere but do not replace verified source information. Avoid decorative claims of freshness, fake accounts, or completion statistics.
- **Tesler's Law:** keep real complexity (dates, group, local currency, source status) in existing structured setup; do not hide important constraints behind a visual gimmick.
- **Selective attention:** the chosen destination becomes the heading and full-viewport photograph; hide the duplicate Ibiza trailer and decorative sidebar blurb.
- **Respect user settings:** reduced transparency/motion support, readable opaque fallbacks, keyboard controls, dark gradient below white hero typography.

## Destination images

The photographs are selected location-specific Wikimedia Commons files. Exact creators, licenses, source URLs, and screen crop disclosure appear in `credits.html`. The app shows a small linked attribution label while browsing. Images are preloaded to avoid a blank cut; on image failure a colored gradient is shown instead. No city image is evidence of an activity being open today.

## Explicitly not part of this MUP

The unproven `Surprise me` action is removed, including its runtime button. The redundant visited-activity checkboxes, "Done for today" button, progress percentage and completion telemetry are removed. The recommendation algorithm can still use deterministic seeded diversity when rendering appropriate, but it is no longer presented as a separate arbitrary action.

The separate founder-led `Evaluation data` environment is not touched. Its editorial assessments must not be mixed with traveler likes/dislikes.

## Verification limitations

Static syntax, content and structural assertions are automated in `tests/test-purposeful-ui.cjs`. Browser visual regression, network photo performance on mobile Safari, full keyboard/screen-reader task flows, and real user studies remain necessary before a production usability claim.

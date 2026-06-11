Acts on Main Stage, Freedom Stage, Cosmic Cwtsh, or GeoJam with no links as of 2026-06-11. Links live in `data/acts.json` as a `"links"` array of `{ "label", "url" }` objects (also update `worker/src/acts.js` - it mirrors the data).

**Genuinely linkable acts (music/performance):**
- Algae Rhythm
- Ari Anne Wen
- Becky the Bullet
- Ben Roberts
- Chant and Jebbers
- Connor Jillions
- Daszol
- Destan Donemi
- Dinomanic
- DJ Froo
- DJ LSGD
- DJ Moonshine
- DJ Uncle Funk
- Echoes of the Unknown
- Flux
- Fossilheads
- G.E.O.R.G.E
- Ginjah
- Greeno
- Hoppi Wimbush
- Iestyn Gordon
- Irisa
- Jimmy Campbell
- Luke Elford & Josie
- Menikoo
- Midnight Motion Picture
- NKC & Jack Ford
- Nook
- Optimystic
- Professor Jo
- Psymoth
- Recomb
- Ribble
- Sanial
- Seven Bears
- Silent DJs
- Soma & Merakki
- Steve J Rad
- Sweet Giant
- Syambolical: Vote Conform
- Sylark
- Tell Your Friends (TYF)
- The Herbaliser Band
- The Re-Psych Project
- Troi Parker-Roth
- Twmpath
- Vegetable Matrix

**Probably not linkable** (placeholders, events, workshops):
- CacaoAmor Ecstatic Dance
- Closing Ceremony Drumming
- Dance Workshop with Lucy Hurst
- Fire Procession
- Freaky Deaky Takeover
- Frekshow Takeover - Seaside Spectacular
- Grounded Jam
- Hum Resonance
- Kids Theatre
- Manifestation Breathwork - Freya MacFarlane
- Open Stage / Mic
- TBC
- Theatre Takeover
- Workshop - Closing Ceremony Dancing Group

**Why:** Building out act profile pages with links to Spotify, SoundCloud, YouTube, Bandcamp etc. Remove acts from this list as links are found and added.

**How to apply:** When the user provides a link for an act, add it to acts.json, validate with `npm run validate`, commit and push. Remove the act from the linkable list above.

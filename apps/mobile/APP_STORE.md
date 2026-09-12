# App Store listing (draft)

Field limits are Apple's; the counts in brackets are what the draft uses.

---

## App Name, 30 char limit

```
WedgieTracker
```

[13/30]

## Subtitle, 30 char limit

```
Every NBA wedgie, counted
```

[25/30]

Shown under the name in search results and on the product page. It carries real
search weight, so it says what the app is rather than repeating the name.

## Promotional Text, 170 char limit

Editable without submitting a new build, so this is the line to change when a
record falls.

```
A basketball gets stuck between the rim and the backboard more often than you would think. We count every single one.
```

[116/170]

## Description, 4000 char limit

```
A wedgie is what happens when a basketball gets stuck between the rim and the backboard. It is rare, it is stupid, and somebody had to count them.

WedgieTracker has counted every NBA wedgie since the 2014/15 season, plus a handful of historic gems. Each one has the player, the game, the spot on the court and the clip.

Browse the wedgies season by season, or search for a player or a team. Follow this season's count against the record, and see who leads the standings and how every past season compares.

No account. No sign-up. Open it and the count is there.

WedgieTracker is an independent fan project, not affiliated with or endorsed by the NBA or its teams.
```

[667/4000]

## Keywords, 100 char limit

Comma separated, no spaces after commas. Avoids words already in the name and
subtitle, which Apple indexes separately. No third-party brands: "nodunks" was
removed under 2.3.7, and "boxscore" named a feature the app does not have.

```
basketball,stats,rim,backboard,highlights,hoops,standings,bball,dunk,blooper,fails,clips,record
```

[95/100]

## App Store Connect record

Created by hand on 12 Sep 2026. Apple does not allow app records to be created
through the App Store Connect API, by any client, which is why `eas submit`
tried a cookie login and failed until this existed.

| Field     | Value                   |
| --------- | ----------------------- |
| Apple ID  | `6811376841`            |
| Bundle ID | `com.wedgietracker.app` |
| SKU       | `wedgietracker-ios`     |
| Locale    | `en-US`                 |

The Apple ID is in `eas.json` as `ascAppId`, so submit skips the lookup that
needed the login.

## Category

- Primary: **Sports**
- Secondary: **Entertainment**

## URLs

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Support URL    | `https://www.wedgietracker.com/support` |
| Marketing URL  | `https://www.wedgietracker.com`         |
| Privacy Policy | `https://www.wedgietracker.com/privacy` |

## Age Rating

**4+.** No objectionable content: basketball clips and numbers.

Answer **No** to Unrestricted Web Access. The app has no browser and no address
bar; its only web view plays one YouTube embed. Links inside YouTube's player
(its logo, the video title, "Watch on YouTube") open in the YouTube app or
Safari, outside WedgieTracker, and the app never loads any other page itself.

## Video provenance

Every clip plays in YouTube's standard embedded player. The app does not
download, cache or store video, and has no other playback path.

Primary clip for each of the 635 entries, by uploader, verified with YouTube
oEmbed on 12 Sep 2026:

| Uploader                    | Entries |
| --------------------------- | ------- |
| WedgieTracker (our channel) | 359     |
| NBA (official channel)      | 216     |
| No Dunks                    | 54      |
| Removed from YouTube        | 3       |
| No clip                     | 3       |

122 entries also carry a second cut, shown in a "NoDunks" tab: 119 are No
Dunks uploads, 1 is the NBA's, and 2 are broken (below).

**The 359 are short excerpts of broadcast footage on our own channel, and we
hold no licence for them.** That is disclosed to App Review rather than
described as the rights holder's player. The app and `/support` say it is an
independent fan project not affiliated with the NBA or its teams,
and the first tab is labelled "Clip" rather than "NBA Broadcast". If review
asks for proof of rights, the options are permission from the NBA, or showing
"No clip" for those 359.

**Broken clips to fix in the site admin before submitting:**

| id  | Entry       | Field       | Problem                        |
| --- | ----------- | ----------- | ------------------------------ |
| 360 | #32 2017/18 | primary     | removed (404)                  |
| 361 | #33 2017/18 | primary     | removed (404)                  |
| 409 | #41 2016/17 | primary     | private (403)                  |
| 227 | #49 2020/21 | NoDunks tab | removed (404)                  |
| 34  | #21 2023/24 | NoDunks tab | a /clip/ link with no video id |

Replace each with a live URL or clear it. Id 34 already shows "No video" in
build 12 rather than a broken embed.

## App Privacy ("Data Collection")

Crash reports and anonymous usage, both processed in the EU. No accounts, so
nothing collected is tied to a person.

Declare, each **Not Linked to You** and **Not Used for Tracking**:

| Category        | Type                  | Purpose                      |
| --------------- | --------------------- | ---------------------------- |
| **Diagnostics** | Crash Data            | App Functionality            |
| **Diagnostics** | Other Diagnostic Data | App Functionality            |
| **Usage Data**  | Product Interaction   | Analytics                    |
| **Identifiers** | Device ID             | Analytics, App Functionality |

Worth being able to defend:

- **No location.** Build 12 registers `$geoip_disable` with the analytics
  provider, which otherwise resolved every event's IP to a city. Builds before
  12 did collect city-level location, but only on TestFlight.
- **No IP address stored** by either provider. `sendDefaultPii: false` for the
  crash reporter; the analytics project stores no `$ip`.
- **No performance data.** Tracing, profiling and replay are off, set in
  `lib/observability.ts`.
- **Device ID is not the IDFA.** A random id made on first launch, plus the
  crash reporter's own installation id, hence the second purpose. Nothing asks
  for tracking permission because nothing tracks.

YouTube sets its own cookies inside its embedded player. That is not data we
collect, and the privacy policy says so.

## App Review notes, 2,354 / 4,000 chars

Paste into App Store Connect under the version, "App Review Information" then
"Notes". **They do not carry over between versions**, so copy them forward
each time and update anything that changed.

The shape follows what got a previous app on this account through review:
name the tap path to every feature, say why each capability exists, and answer
the question a reviewer is going to ask before they ask it.

```
WHAT THE APP IS

A "wedgie" in basketball is when the ball wedges between the rim and the backboard and stays there. The name refers only to that event. WedgieTracker counts every NBA wedgie since 2014/15, plus a handful of historic entries under "GEMS".

Nothing is gated. No accounts, sign-in, purchases or permission prompts. Every feature is available on first launch, so no demo account is needed.

HOW TO SEE EVERYTHING

Home. The NBA season is over until late October, so Home shows the final 2025/26 total (74, a new record), games played and days since the last wedgie. During the season it shows the live count, the pace and "NEW WEDGIE", as in screenshot 1.

Wedgies tab. Opens on the current season; "All Seasons" is in the Season filter. Filter by type or search a player or team. "RESET FILTERS" appears once anything is filtered.

Tap any row. A sheet opens with the clip, details and a court diagram. The chevrons top left step to the newer or older wedgie. Rows marked "NO CLIP" have no video, for example #64 in 2025/26.

Standings tab. Players and teams by season; tap a name to see their wedgies.

Stats tab. Wedgies per possession, field goal attempt and minute, and Seasons History.

If there is no connection, screens show "Could not load" with a Retry button.

ABOUT THE VIDEO

Clips play in YouTube's standard embedded player. The app does not download, cache or store video. WedgieTracker is an independent fan project, not affiliated with or endorsed by the NBA or its teams, which the app states at the foot of the Stats tab and the support page repeats.

WEB ACCESS

Answered "No". There is no browser or address bar; the only web view plays one YouTube embed. Tapping YouTube's logo, the title or "Watch on YouTube" opens the YouTube app or Safari, outside WedgieTracker.

DATA COLLECTION

App Privacy: Diagnostics, Usage Data and Identifiers, all Not Linked to You and Not Used for Tracking. In practice, crash reports and which screens and filters are used. Neither provider stores IP addresses, location lookup is switched off, and there is no tracing or session recording. The identifier is random and made on the device. Both providers process in the EU. Policy: https://www.wedgietracker.com/privacy

OTHER

iPhone only, portrait only. No non-exempt encryption. Rated 4+. Support: https://www.wedgietracker.com/support
```

What changed from the first draft, after the readiness review on 12 Sep 2026:

- The video section now says who uploaded the clips. The first draft called
  the embed "the rights holder's player", which was false for 359 of them.
- "Watch on YouTube" is described as opening outside the app, which build 12
  makes true. Before it, the link loaded youtube.com inside the player.
- "IP address collection is switched off" was true of the crash reporter
  only. Build 12 also turns off the analytics provider's location lookup.
- Home's offseason state is explained, since it does not match screenshot 1
  until the season starts.

# Still needed before submission

- [x] Privacy policy covers the app, with retention, deletion and publisher (#140).
- [x] Support page at `/support` with a contact email (#140). **Merge and
      deploy #140 first**: Apple fetches both URLs during review.
- [x] Copyright `2026 ZOKE.GG LTD` and review contact, set via the API.
- [x] Version 1.0 in `app.json`, matching the App Store Connect version.
- [ ] Build 12 uploaded, processed and attached to version 1.0. Upload with
      `./scripts/submit-ios.sh`; `eas submit` cannot use the API key.
- [ ] Fix the five broken clips in the site admin (Video provenance, above).
- [ ] Listing: subtitle, description, keywords, promotional text, URLs,
      category, from the sections above.
- [ ] Age rating questionnaire, all None or No, giving 4+.
- [ ] Content rights: contains third-party content.
- [ ] Pricing Free, and territories.
- [ ] App Privacy label, published, per the table above. The API cannot do
      this one; it is done in the App Store Connect UI.
- [ ] Review notes pasted from the section above.
- [ ] Screenshots uploaded to the 6.9" set, with `03-detail.png` recaptured
      without broadcast graphics in the player.
- [ ] Next version: copy the review notes and promotional text forward, since
      neither carries over.

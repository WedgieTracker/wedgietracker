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

WedgieTracker has been counting since the 2014/15 season. Every wedgie, who did it, which teams were on the floor, where on the court it happened, and the video to prove it.

WATCH EVERY WEDGIE
Every wedgie ever recorded, newest first, with the clip attached. Filter by season, by type, or search for a player or a team.

THE COUNT, LIVE
The running total for the current season, the pace it is on, and how that compares to the all-time record. When the season goes past the record, you will know.

STANDINGS
Which players have the most wedgies this season, and which teams. Tap any of them to see their wedgies.

STATS FOR NERDS
One wedgie every how many possessions? How many field goal attempts? How many minutes of basketball? The numbers behind the count.

SEASONS HISTORY
Twelve seasons of totals, leaders and records, all the way back to 2014/15.

No account. No sign-up. Open it and the count is there.

Inspired by NoDunks.
```

[~1,050/4000]

## Keywords, 100 char limit

Comma separated, no spaces after commas. Deliberately avoids repeating words
already in the app name and subtitle, because Apple indexes those separately
and repeating them wastes the allowance.

```
basketball,stats,nodunks,rim,backboard,highlights,hoops,standings,boxscore,bball,dunk,swish
```

[91/100]

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
| Support URL    | `https://www.wedgietracker.com`         |
| Marketing URL  | `https://www.wedgietracker.com`         |
| Privacy Policy | `https://www.wedgietracker.com/privacy` |

## Age Rating

**4+.** No objectionable content: basketball clips and numbers.

One question in the rating questionnaire needs thought: **Unrestricted Web
Access**. The app embeds YouTube clips in a WebView. It only ever loads
specific embed URLs, not a browser, so the honest answer is **No**, but the
YouTube player's own "Watch on YouTube" control can hand off to the YouTube app
or Safari. If review pushes back, that is the reason why.

## Video provenance, and why the app prefers YouTube

The clips are NBA broadcast footage. The website plays whichever source it has;
the app originally preferred our own Cloudinary copy because it plays in the
native player rather than a WebView.

**That preference was reversed on 12 Sep 2026.** The app now uses the same
`pickInitialVideo` ordering as the site, which puts YouTube first, so playback
happens in the rights holder's own embed rather than serving a re-hosted copy.
Measured against all 635 wedgies:

| Source now used   | Wedgies     |
| ----------------- | ----------- |
| YouTube           | 359 (56.5%) |
| YouTube (NoDunks) | 273 (43.0%) |
| No video shown    | 3 (0.5%)    |

**The app has no Cloudinary playback path at all.** The three wedgies with no
YouTube URL show "No video for this wedgie" rather than falling back to our
own mp4, so there is no route by which the app serves a re-hosted broadcast
clip. `pickVideoForApp` in `components/WedgiePlayer.tsx` is the website's
ordering minus Cloudinary, and the broadcast tab resolves to YouTube only.

expo-video was removed with it: nothing in the app plays a file any more, so
the native player, its custom controls and the dependency all went.

Review treats third-party content in an app more strictly than on a website,
and leaving every clip in the rights holder's own player is a materially
better position than distributing our own copy.

Related: screenshot `03-detail.png` shows broadcast footage inside a marketing
asset, which is a separate exposure from in-app content and a separate
decision.

## App Privacy ("Data Collection")

The app reports crashes to Sentry and anonymous usage to PostHog, both hosted
in the EU. It has no accounts, so nothing it collects is tied to a person.

Declare three categories, each **Not Linked to You** and **Not Used for
Tracking**:

| Category        | Type                | Purpose           | Source                          |
| --------------- | ------------------- | ----------------- | ------------------------------- |
| **Diagnostics** | Crash Data          | App Functionality | Sentry                          |
| **Usage Data**  | Product Interaction | Analytics         | PostHog                         |
| **Identifiers** | Device ID           | Analytics         | PostHog's anonymous distinct_id |

Three things worth being able to defend if review asks:

- **No performance data.** Sentry tracing, profiling and replay are all off,
  set explicitly in `lib/observability.ts` rather than left to a default, so
  Crash Data is the whole of the Diagnostics answer.
- **No IP address.** `sendDefaultPii: false`, so Sentry does not record it.
- **Device ID is not the IDFA.** PostHog generates a random id on first launch
  and it never leaves the install. Nothing asks for tracking permission,
  because nothing tracks.

YouTube embeds set their own cookies inside the WebView. That is not data we
collect, so it does not change the answers, but the privacy policy says so.

## App Review notes, 3,175 / 4,000 chars

Paste into App Store Connect under the version, "App Review Information" then
"Notes". **They do not carry over between versions**, so copy them forward
each time and update anything that changed.

The shape follows what got London Garden through its 4 September rejection:
name the tap path to every feature, say why each capability exists, and answer
the question a reviewer is going to ask before they ask it. See
`~/Documents/Sandbox/html/expo-ios-app-store-gotchas/app-review-rejections.md`.

```
WHAT THE APP IS

A "wedgie" in basketball is when the ball wedges between the rim and the
backboard and stays there. It is a rare, harmless, slightly absurd event.
WedgieTracker has counted every one in the NBA since the 2014/15 season: 635
so far. That is the whole app. The name refers only to the basketball event.

Nothing is gated. There are no accounts, no sign-in, no purchases, no
subscriptions and no permission prompts of any kind. Open the app and every
feature is available immediately. There is no demo account because there is
nothing to log in to.

HOW TO SEE EVERYTHING, IN ORDER

Home. The running count for the current season, with a wave that fills as the
count rises and passes the all-time record, plus the most recent wedgies.
"SEASONS HISTORY" at the foot opens twelve seasons of totals.

Wedgies tab. All 635, newest first. Filter by season or type, or search for a
player or a team. "RESET FILTERS" appears once anything is filtered.

Tap any row. A sheet opens with the clip, the date, the player, the two teams,
the type, and a court diagram showing where on the floor it happened. The two
chevrons top left step to the newer or older wedgie.

Standings tab. Players and teams ranked by count for a chosen season. Tapping
any name opens that player's or team's wedgies.

Stats tab. One wedgie every how many possessions, field goal attempts and
minutes, plus the pace against the record.

ABOUT THE VIDEO

Every clip plays in YouTube's own embedded player. The app does not host,
download, cache or redistribute any footage: the embed is the publisher's
player, and playback, controls and cookies are all YouTube's. Some wedgies
also have a second cut published by the NoDunks channel, which is why a few
show two source tabs.

Three of the 635 wedgies have no YouTube source. They deliberately display "No
video for this wedgie" rather than playing anything else.

WEB ACCESS

We have answered "No" to unrestricted web access. The app contains no browser
and no address bar. The only web content is the YouTube embed described above,
loaded at a fixed URL per clip. We note for completeness that YouTube's own
player includes a "Watch on YouTube" control, which can hand off to the
YouTube app or Safari. That control is YouTube's, not ours.

DATA COLLECTION

The App Privacy answers are Diagnostics (Crash Data), Usage Data (Product
Interaction) and Identifiers (Device ID), all "Not Linked to You" and "Not
Used for Tracking". Concretely: crash reports, and which screens and filters
are used. IP address collection is switched off, performance tracing and
session recording are not enabled, and the identifier is a random value
generated on the device that is not derived from any hardware identifier.
There are no accounts, so nothing can be linked to a person. Both providers
process in the EU.

The privacy policy at https://www.wedgietracker.com/privacy has a section
describing exactly this.

OTHER

iPhone only, portrait only. iPad is not supported and is not declared.
The app makes HTTPS requests and uses no non-exempt encryption.
Content is basketball clips and numbers, rated 4+.
Support and marketing: https://www.wedgietracker.com
```

Three deliberate inclusions:

- **What a wedgie is, in the first line.** The word has an unrelated everyday
  meaning, and a reviewer who reads it that way is starting from the wrong
  place on a 4+ rating.
- **That the app hosts no footage.** It is the strongest true statement
  available about third-party content, and it only became true when the
  Cloudinary playback path was removed.
- **The Unrestricted Web Access answer and its caveat.** Volunteering the
  "Watch on YouTube" hand-off is better than having it found.

---

# Still needed before submission

- [x] Privacy policy updated to cover the app. `apps/web/src/app/privacy/page.tsx`
      now carries a WedgieTracker iOS App section naming both processors.
      **It has to be deployed before submitting**, since Apple fetches the URL.
- [x] Screenshots. Five 6.9" tiles in `store/screenshots/ios-6.9/`. No iPad set
      is needed: `supportsTablet` is false.
- [x] A build uploaded. Build 4 (0.1.0) delivered 12 Sep 2026, delivery UUID
      `4d215288-e7b1-4e6c-8157-bfbe346b7481`.

      **Upload with `./scripts/submit-ios.sh`, not `eas submit`.** Every path
                                              through eas submit ends at an Apple ID login: it needs one to create the
                                              app record, and another to register an ASC API key against the project
                                              ("Only user authentication is supported"). That login fails here with
                                              "iTunes service key is empty", so the key never gets used. altool takes
                                              the key directly and never touches the Developer Portal.

- [x] Export compliance. `ITSAppUsesNonExemptEncryption: false` answers it at
      upload; the API confirms `usesNonExemptEncryption: false` on build 4, so
      there is nothing to click.
- [x] On TestFlight. Build 4 is `processingState: VALID` and internal testers
      receive every build automatically, so no Beta App Review was involved.
- [ ] Copyright holder and contact details in App Store Connect
- [ ] Paste the review notes above into the version in App Store Connect
- [ ] Deploy the site. The privacy policy change is committed but not live, and
      Apple fetches that URL during review.

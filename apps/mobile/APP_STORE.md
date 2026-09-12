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
- [ ] Deploy the site. The privacy policy change is committed but not live, and
      Apple fetches that URL during review.

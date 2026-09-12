# App Store listing — draft

Field limits are Apple's; the counts in brackets are what the draft uses.

---

## App Name — 30 char limit

```
WedgieTracker
```

[13/30]

## Subtitle — 30 char limit

```
Every NBA wedgie, counted
```

[25/30]

Shown under the name in search results and on the product page. It carries real
search weight, so it says what the app is rather than repeating the name.

## Promotional Text — 170 char limit

Editable without submitting a new build, so this is the line to change when a
record falls.

```
A basketball gets stuck between the rim and the backboard more often than you would think. We count every single one.
```

[116/170]

## Description — 4000 char limit

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

## Keywords — 100 char limit

Comma separated, no spaces after commas. Deliberately avoids repeating words
already in the app name and subtitle — Apple indexes those separately, so
repeating them wastes the allowance.

```
basketball,stats,nodunks,rim,backboard,highlights,hoops,standings,boxscore,bball,dunk,swish
```

[91/100]

## Category

- Primary: **Sports**
- Secondary: **Entertainment**

## URLs

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Support URL    | `https://www.wedgietracker.com`         |
| Marketing URL  | `https://www.wedgietracker.com`         |
| Privacy Policy | `https://www.wedgietracker.com/privacy` |

**The privacy URL is the problem — see below.**

## Age Rating

**4+.** No objectionable content: basketball clips and numbers.

One question in the rating questionnaire needs thought: **Unrestricted Web
Access**. The app embeds YouTube clips in a WebView. It only ever loads
specific embed URLs, not a browser, so the honest answer is **No** — but the
YouTube player's own "Watch on YouTube" control can hand off to the YouTube app
or Safari. If review pushes back, that is the reason why.

## App Privacy ("Data Collection")

**Data Not Collected.** The app has no accounts, no analytics, no tracking, and
no crash reporting. It makes read-only requests to the site's public API and
loads video from Cloudinary and YouTube.

Worth knowing: YouTube embeds set their own cookies inside the WebView. That is
not data _you_ collect, so it does not change the answer, but it is the kind of
thing that is better understood before someone asks.

---

# Blocker: the privacy policy does not describe this app

`https://www.wedgietracker.com/privacy` is written for the website. It says it
covers "our website (wedgietracker.com)" and describes collecting:

- email addresses for the newsletter
- names and shipping addresses for purchases
- Google Analytics 4 usage data

**The app does none of these.** There is no newsletter, no store, and no
analytics in it — those were deliberately left out of the mobile build.

So the App Privacy answers and the linked policy would contradict each other:
one says nothing is collected, the other describes collecting three categories.
That inconsistency is a common review rejection, and it is also just wrong.

Two ways to fix it, in order of preference:

1. **Add an app section to the existing page.** A short block stating that the
   iOS app collects no personal data, has no accounts or analytics, and only
   reads the public API. Keeps one URL and one page to maintain. This is a small
   change to `apps/web/src/app/privacy/page.tsx`.
2. **A separate `/privacy/app` page** covering the app alone. Cleaner
   separation, one more page to keep in step.

Either way this has to be live on the site before submitting, since Apple
fetches the URL during review.

---

# Still needed before submission

- [ ] Privacy policy updated to cover the app (above)
- [ ] Screenshots — being generated separately
- [ ] A build uploaded: `eas build --profile production --platform ios`
- [ ] Export compliance answer. The app makes HTTPS requests and nothing more,
      so it qualifies for the standard exemption, but the question must be
      answered at upload.
- [ ] Copyright holder and contact details in App Store Connect

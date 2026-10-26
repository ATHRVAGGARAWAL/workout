# Verification record

## Automated checks

- TypeScript strict typecheck: passed.
- Expo ESLint: passed.
- Expo Doctor: all 20 checks passed, including the corrected native configuration.
- Domain tests: 13 passed, including 252 goal/experience/schedule/equipment combinations.
- Mobile browser flow at 393 × 873: onboarding, personalized routines, real set logging, reload recovery, pause/resume, theme change, finish, history, insights, SVG map, manual measurements, backup export, invalid-file rejection, and browser scale fallback passed.
- Recovery/editing flow at 320 × 760: custom exercise, favorites, routine duplication, 1,200-second rest setting, historical edits and cancellation, record recalculation, valid backup replacement, time validation, corrupted storage preservation/recovery and deletion passed.
- Longer-history rendering: 36 synthetic completed sessions and 12 measurements, all five persisted themes, SVG muscle interaction, body and exercise charts passed without browser console errors.

Screenshots and generated QA data are in ignored `screenshots/qa/`. Browser tests run in isolated contexts. Fixtures are not included in the app or entered into the user's journal.

The production web export also passed the main workout and recovery/editing flows. TypeScript is scoped to source and domain tests so generated release bundles are not analyzed as source.

## Android build

The first EAS build identified a native manifest minimum-version mismatch: Health Connect requires Android API 26. The app now sets minSdkVersion 26 via `expo-build-properties`. Cult Connect is explicitly declared in Android package visibility queries so its launch intent can be found. Builds target arm64-v8a (OnePlus 13R) and x86_64 (emulator).

Final signed APK: [EAS build 1315d093-636a-4f08-a5dc-da9e9e929d44](https://expo.dev/accounts/anay0305/projects/workout/builds/1315d093-636a-4f08-a5dc-da9e9e929d44).

Local artifact: `artifacts/workout-1.0.0.apk` (62,955,731 bytes). SHA-256: `b9918ebc6756de089ab1a26a7a5386f8601a7c9de089a97a0da063ae9030e95c`.

Native smoke checks on an Android API 37.1 x86_64 emulator with a 16 KB system image:

- Install and cold launch into empty dark onboarding: passed.
- Onboarding creates the chosen personalized plan: passed.
- Native exercise search, selection and set entry: passed.
- Force-stop and relaunch restores a paused workout with a completed 60 kg × 10 bench-press set: passed, verified through the accessibility hierarchy.
- Finish saves history, 600 kg volume and a first benchmark: passed.
- Native SVG muscle map renders chest workload and assisting muscles: visually verified.
- Final APK upgrade preserves the existing profile and finished session: passed.
- Android notification permission and three weekly reminder alarms registered with the system: passed. Exact delivery under OxygenOS battery restrictions is not established by this test.
- Health Connect permission screen, read access and an empty-history response: passed. No external body readings existed in the emulator.
- Android nearby-device permission and a complete BLE scan: passed. No physical scale was present; characteristic notifications and device compatibility remain unverified.
- Native backup export creates a JSON file and opens the Android share sheet: passed; no file was sent to another app.
- Manual-entry link opens the form directly; saving 74.5 kg updates the native body view: passed.

Native screenshots are in ignored `screenshots/native/`. These are QA records on a temporary emulator, not preloaded user data.

## Limits of the evidence

No physical OnePlus 13R or Cult scale was attached. BLE discovery/notifications, Cult Connect's actual Health Connect exports, notification delivery under OxygenOS battery management and physical-device performance require testing on the phone. No claim of working proprietary Cult Bluetooth support is made.

The browser fallback intentionally cannot access Android Health Connect or the native Bluetooth adapter. Native tests do not establish physical-scale interoperability.

## Dependency audit

The audit reports advisories in Expo's transitive CLI dependencies (node-forge and an older nested Zod). The app's own backup validator uses Zod 4.6.7. The offered blanket audit fix downgrades Expo to SDK 54 and was not applied to this SDK 58 app. These dependencies should be revisited with the next compatible Expo CLI patch.

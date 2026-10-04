# SESSION

## Current State

Track tag: project development.

Family Health app:
- Supabase email/password authentication remains in place around the React + Vite app.
- Signed-out users see the authentication flow; signed-in users load a cloud profile from `public.user_profiles` before the app opens.
- Main profile persistence uses Supabase upsert by `user_id`; localStorage is retained only for optional one-time import of an existing device profile.
- UI polish was applied on 2026-08-04:
  - Sidebar privacy copy now says information stays private, is never sold for advertising, and is educational/not a medical diagnosis.
  - `Current Health` was renamed to `Your Current Health`, and the explanatory sentence under it was removed.
  - Daily Habits question headings were simplified for the first four questions.
  - Daily Habits choice buttons and Yes/No toggles were enlarged, spaced out, and given a stronger dark-blue selected state.
  - Family History add-relative flow was simplified:
    - Add Grandparent and Add Sibling no longer show a generic relationship dropdown.
    - Add Parent now asks only Mother/Father using the existing selected-button style.
    - The early-diagnosis warning checkbox copy was removed.
    - Diagnosis age appears only after a condition is selected.
    - Family tree title, description, and privacy copy were simplified.
  - My Profile dashboard now hides personalized dashboard sections until both Family History and Lifestyle Assessment have enough information. New users see a `Complete your health profile` card; partially complete users see a progress card and `Continue Assessment`.
  - Family History form now includes one always-visible optional `Age at Diagnosis` field for each family member, validates whole numbers from 0-120, stores the value in existing `diagnosisAge`, and displays `Diagnosed at age X` on family tree cards when present.
  - My Profile incomplete state was tightened further:
    - Brand-new users see a single `Welcome!` unlock card.
    - Partial users see a single `Complete Your Health Profile` card with `Profile Progress`, percent complete, progress bar, and `Continue Assessment`.
    - Prevention score, prevention insights, coach goals, and resource priorities are only derived after assessment completion.
    - Incomplete Coach view also shows only the unlock card, preventing early weekly encouragement or personalized recommendations.
  - Sidebar account actions were grouped so `Log out` now sits directly below `Start Over` in the bottom privacy/action area.
  - Premium wellness visual theme was applied as a CSS-only layer:
    - Warm off-white app background, floating white cards, subtle warm shadows, 20px+ rounded corners, muted indigo accents, and charcoal/medium-gray typography.
    - Borders were reduced and spacing was softened to move the UI away from an enterprise dashboard feel while preserving behavior.
  - Create Account and Sign In now show concise account privacy and safety disclaimers:
    - A subtle shield notice explains that family health information is stored with the signed-in account, access is restricted to the account, and information is not sold or used for advertising.
    - A smaller footer disclaimer clarifies that Family Health provides educational prevention insights and does not provide medical advice, diagnosis, emergency monitoring, or treatment.
  - Local resource recommendations now use broader prevention-action matching and a stronger fallback ladder:
    - Top three health priorities are matched against direct disease terms and related prevention actions.
    - Final recommendations can include up to seven resources across same-city, nearby, online, and trusted organization fallback tiers.
    - Parks are capped at one recommendation and only appear through physical-activity matches.
    - Cards now use clearer fallback badges such as `Best local match`, `Related prevention resource`, `Nearby option`, `Online resource`, and `Trusted organization`.
    - The empty/fallback copy now says: `No exact matches were found. Here are the closest available resources based on your health priorities.`
  - Today's Goals now reset daily in the user's local timezone:
    - Cloud profile state stores `completedGoals`, `lastGoalResetDate`, and `goalCompletionHistory`.
    - Completed daily goals are cleared once when the local calendar date changes, including when the app is opened on a new day.
    - Goal completion resets are saved through the existing Supabase profile persistence path.
    - Goal sets are now seeded from the user's prevention profile instead of the calendar date, so goals stay stable unless profile-derived priorities change.
    - The coach display now shows `Today's Progress`, the completed count, and a completion message prompting the user to check back tomorrow.
  - The visible Prevention Health Score was removed from the dashboard and Coach view:
    - No numeric health score, `/100` score ring, score status label, or score-rating language is rendered.
    - The dashboard summary now includes a `Health Profile` status card instead.
    - The Coach view now shows a `Health Profile` card with `Assessment Complete` and non-scored educational guidance.
    - The app now uses non-scored prevention-plan signals for priorities, insights, goals, and resource recommendations.
  - A public signed-out homepage now appears before authentication:
    - Guest users land on a consumer-style Family Health homepage instead of the Sign In form.
    - `Get Started` opens Create Account; `Sign In` opens the existing Sign In form.
    - Auth forms include `Back to Home` actions.
    - Password recovery still bypasses the homepage and shows the update-password flow.
    - Signed-in users still skip the public homepage, load the cloud profile, and open My Profile.
  - A warm, supportive copy pass was applied across the homepage, auth screens, profile, family tree, everyday habits, insights, coach, and helper/error text:
    - Clinical labels such as `Basic Information`, `Daily Habits`, and `Lifestyle Assessment` were shifted toward conversational wording like `About You`, `Your Everyday Habits`, and `Everyday Habits`.
    - Visible progress and coach copy now emphasizes readiness, focus steps, personalization, and learning rather than scores or grading.
    - Existing safety and educational disclaimers were preserved without adding HIPAA, security, or medical-grade claims.
  - The public homepage hero and middle section were redesigned:
    - Hero copy now opens with `Your Journey to Better Prevention Starts Here`.
    - The old `What You Can Do` feature-card grid was removed.
    - `How It Works` now uses a four-step connected flow with numbered circles, concise descriptions, generous whitespace, and mobile vertical stacking.
  - Auth and account UI were updated:
    - The extra `How It Works` intro paragraph was removed from the public homepage.
    - Sign In and Create Account no longer render the separate privacy/safety notice blocks.
    - Signed-in users now have a compact top-right account control with avatar initials, display name/email, save status, and a dropdown for `My Profile`, `Account Settings`, and `Log Out`.
    - Account settings can update an optional display name stored in existing Supabase `profile_data.accountProfile.displayName`; avatar URL/path fields are reserved in `profile_data.accountProfile` but image upload is not implemented without Supabase Storage setup.
    - Sidebar keeps `Start Over`; logout now lives in the account menu/settings.
  - Family History assessment was made more structured:
    - The Family view now has one main page title and avoids repeated `About You` / family-history headings.
    - Mother and Father are required to continue from Family History; grandparents are recommended but not required; siblings and children are optional.
    - Missing parent information opens a professional `Complete Parent Information` modal with `Return` and `Add Parent` actions.
    - Family-member health conditions and age at diagnosis can now be marked explicitly as `Unknown`; known conditions and unknown state are mutually exclusive in the form.
    - Current-health `Not sure` labels were renamed to `Unknown`, with old stored values still supported as scoring aliases.
    - Relationship sections now show subtle `Required`, `Recommended`, and `Optional` badges.
  - Family History UI and account header polish:
    - The account control remains fixed at the top-right above independently scrolling page content.
    - Family Health Tree visual order is now Grandparents, Parents, You & Siblings, then Children.
    - The health-conditions standalone `Unknown` button was removed; `Unknown` now appears once as the first row in the condition list.
  - Parent uniqueness and completed dashboard cleanup:
    - The Parents section now allows only one Mother and one Father.
    - Add Parent auto-selects the remaining parent type when only one slot is available, hides unavailable parent choices, and stops opening once both parents exist.
    - Duplicate parent creation is blocked again in the save path to protect against stale state and repeated clicks.
    - Existing saved duplicate parent types are normalized by keeping the first Mother/Father active and flagging later duplicate parent records for review.
    - The completed Coach/Profile `Health Profile / Profile Ready` status card was removed without replacement.
  - Account header/settings polish:
    - The account control uses a fixed top-right header position with reserved top padding on the app layout so page content scrolls underneath without overlap.
    - Missing avatars now show a generic circular profile icon instead of initials.
    - Account Settings no longer exposes unfinished profile-picture/avatar setup UI or Supabase Storage messaging; it contains Display Name, read-only Email, and Log Out.
  - Authenticated navigation was reorganized:
    - Sidebar order is now My Profile, Family History, Your Current Health, Your Everyday Habits, Prevention Insights, AI Prevention Coach, and Local Resources.
    - Current-health profile fields moved to the `Your Current Health` tab.
    - Prevention insight cards moved to the `Prevention Insights` tab.
    - Location controls, personalized local/online/trusted resources, and map content moved out of Coach into the `Local Resources` tab.
    - The account control moved into a normal top header inside the main content column; it scrolls away naturally and no longer uses fixed/floating positioning.
  - Profile Overview metrics were clarified:
    - `Habit Progress` now focuses only on today's completed personalized goals and uses the detail `Completed today`.
    - The previous `Weekly Goals` card was replaced with `Weekly Consistency`, showing the number of distinct local-week days with at least one completed personalized goal.
    - Goal activity dates are recorded in existing `goalCompletionHistory` profile data and saved through the current Supabase profile persistence path.
  - Assessment navigation and prevention hub were updated:
    - The separate `AI Prevention Coach` and `Local Resources` tabs were combined into one `Prevention Coach & Resources` tab after `Prevention Insights`.
    - The combined tab keeps AI coaching content and local/online/trusted resource recommendations as separate sections in one prevention hub.
    - Assessment forward/back controls now use a centralized `assessmentSteps` order: Family History, Your Current Health, Your Everyday Habits, Prevention Insights, Prevention Coach & Resources.
    - `Prevention Insights` now has bottom navigation with Back and Continue, and Save/Continue from Everyday Habits no longer skips it.
  - Recommendation and dashboard copy was made more profile-specific:
    - Prevention Insight cards now include a `Why this appears` section naming the family-history conditions and relatives behind the insight.
    - Dashboard focus-area cards now show each priority's profile-derived detail instead of generic `Personalized from your profile` copy.
    - The Health Profile overview card summarizes the user's current top focus areas when available.
    - Daily focus goals now include a short rationale tied to the family insight or lifestyle/current-health priority that selected the goal.
    - Local, online, and trusted resource cards now display the existing event/resource match reason separately from the event description.
  - Personalized Insights and Today's Focus were deepened:
    - The user-facing `Prevention Insights` tab/page was renamed to `Personalized Insights`.
    - Insight ranking now considers family-history observations, close-relative patterns, current-health answers, and lifestyle signals while preserving the existing calculation and recommendation engines.
    - Insight cards now use adaptive summaries, positive strengths when available, and three `Suggested Next Steps` instead of static prevention-strategy text.
    - Today's Focus goals now connect to relevant local, online, or trusted resources from the existing ranked resource results, with primary actions, resource reasons, distance labels for local resources, and `View on Map` actions for physical locations.
    - Family-history goals link directly back to the Family Health Tree.
  - Personalized Insights page hierarchy was simplified:
    - The page now has one `Personalized Insights` title and one concise supporting sentence.
    - The duplicate inner `Personalized Insights` section heading and repeated description were removed.
    - Insight cards no longer render a separate `Why this appears` section; the rationale is folded into `Overview`.
    - Cards now use `Overview`, optional `Positive Factors`, and `Suggested Next Steps` only when those sections add distinct information.
  - Today's Focus goal actions and navigation persistence were fixed:
    - Goal action mapping now uses the actual goal text rather than the rationale text, so family-history wording in explanations no longer causes every action to open the Family Health Tree.
    - Screening, movement, nutrition, wellness, respiratory, education, and family-history goals now map to distinct action labels and resource categories.
    - Clicking non-family-history goal actions filters and prioritizes the Nearby Resources section for that goal while preserving the user's ZIP/city and existing resource recommendation logic.
    - Only family-history goals open the Family Health Tree.
    - The combined `coach` tab is now labeled `Goals & Resources` in user-facing navigation and headings.
    - Per-user navigation memory now persists `activeView` and `accountSettingsOpen` in the existing Supabase profile payload; signed-in reloads restore the saved tab instead of forcing My Profile.
    - Logout clears the remembered page by saving `activeView: dashboard` and `accountSettingsOpen: false` before sign-out, without deleting profile data.
  - Today's Focus and Local Resources were separated:
    - Today's Focus now shows only goal title, rationale, completion checkbox, and one secondary resource-finder action.
    - Embedded resource cards, organization names, event listings, `More info`, and `View on Map` were removed from Today's Focus.
    - Local Resources remains the only place that renders external resources, events, organizations, maps, directions, distance, and dates.
    - Goal resource buttons still filter the Local Resources section by the selected goal category.
  - Today's Focus goal generation was redesigned:
    - Daily goals now come from structured candidates with explicit categories such as Physical Activity, Nutrition, Preventive Screening, Family History, Mental Well-Being, Sleep, Smoking/Vaping, Alcohol, Chronic Condition Management, and Learning/Education.
    - The selector allows only one goal per category each day, preventing overlapping pairs such as two walking/activity goals.
    - Candidate scoring uses the user's personalized insights, top prevention priorities, lifestyle answers, and recent goal completion history while preserving existing prevention calculations and daily reset persistence.
    - Recently completed goal IDs from `goalCompletionHistory` are down-ranked so goals rotate away from the previous few days when alternatives exist.
  - The two main post-assessment tabs were clarified:
    - The former `Personalized Insights` tab is now `Your Health Profile`, focused on explaining what the app learned from family history, current health, and everyday habits.
    - The former `Goals & Resources` tab is now `Your Prevention Plan`, focused on today's actionable goals and local/online/trusted resources.
    - Health Profile cards now show `Why It Stands Out`, `What This Suggests`, `Positive Factors`, and `Worth Paying Attention To` instead of action-oriented next-step copy.
    - Prevention Plan resources now default to ranking against today's focus goals, while goal-specific buttons still filter resources for the selected goal.
  - Post-assessment navigation and titles were tightened:
    - `My Profile` is now `Home` in the sidebar, dashboard eyebrow, account menu, and home navigation aria-label.
    - Sidebar order is now Home, Family History, Your Current Health, Your Everyday Habits, Your Health Profile, Your Prevention Plan, then Privacy.
    - `Your Health Profile` uses the single subtitle `What we learned about you`.
    - `Your Prevention Plan` uses the single subtitle `What you can do next`.
    - The old `AI Prevention Coach` heading and description remain removed from the authenticated UI.
    - Account Settings remains accessible from the top-right account dropdown and is no longer duplicated in the sidebar.
  - Family History copy and goal-specific resource personalization were improved:
    - The redundant `Family Members` heading and `Add available family information. Information can be updated at any time.` copy were removed from the Family History page.
    - A reusable `goalResourceIntents` module now maps each Today's Focus goal to an explicit resource intent, search terms, location behavior, trusted online sources, resource types, and priority health theme.
    - Resource ranking now uses the specific goal, the user's profile signals, exact intent matches, health-priority relevance, city/distance, event timing, and trusted-source quality.
    - Goal-specific trusted resources such as AirNow, CDC screening pages, American Cancer Society screening pages, Smokefree.gov, CDC sleep/alcohol guidance, MyPlate, and American Lung Association pages are added as fallbacks only for relevant goals.
    - Local exact matches now outrank non-air-quality trusted fallback pages, while AirNow remains the top direct tool for air-quality goals.
  - Today's Focus and Your Health Profile were decluttered:
    - Goal resource mapping now includes an explicit `resourceNeeded` flag so self-contained goals do not render resource/action buttons.
    - Bedtime, alcohol-limit, hydration, short mindfulness, simple nutrition, and avoid-smoking goals stay as completion-only focus steps unless their wording explicitly asks for an outside resource, class, program, support tool, or lookup.
    - Resource ranking for the Prevention Plan now uses only focus goals that genuinely need external resources, preventing unrelated listings from being generated for self-contained goals.
    - The Health Profile overview renders only the existing top three ranked themes while preserving each card's `More Info` expanded details.
  - Today's Focus daily goals are now stable for the full local calendar day:
    - Generated goals are saved as `dailyGoals` with `dailyGoalsDate` in the existing Supabase profile payload.
    - Completion state is saved separately as `completedGoals` and `completedGoalIds`, so checking/unchecking a goal no longer regenerates or swaps the visible plan.
    - When the local date changes, completion state resets and a new personalized daily goal set is generated once using the latest saved profile.
    - Profile edits during the same day no longer replace the current day's goals; updated profile data is used for the next generated day.
  - Today's Focus resource actions were refined so place-search goals can be completed inside the app:
    - Walking goals such as `Take a short walk for a mental reset.` now show `Find Places to Walk`.
    - Clicking the action keeps the user in Your Prevention Plan, scrolls to Local Resources, and filters/ranks for parks, walking trails, greenways, recreation centers, YMCA/community programs, and walking groups.
    - Walking resource ranking now favors distance and walkability, and filters out unrelated clinics or general organizations.
    - Local Resources now labels the active filter as `Resources for: [goal]` and shows `Nearby Walking Options` for walking-goal results.
  - Breast-screening location resources now use FDA MQSA mammography facility data:
    - Goals such as `Find a place for breast cancer screening.` and `Find a mammogram location.` map to a new `mammography-facility` intent.
    - The app uses the user's 5-digit ZIP to derive the FDA-required 3-digit ZIP prefix, such as `94127 -> 941` and `94704 -> 947`.
    - A local FDA-derived fixture from the official weekly `public.zip` download provides in-app mammography facility cards for supported Bay Area ZIP prefixes.
    - FDA facility resources are injected ahead of generic breast-screening education for mammography-location goals, labeled `Mammography Facilities Near You`, and attributed to the `FDA Mammography Facility Database`.
    - Browser-side FDA scraping was avoided because the static frontend has no server/proxy and the FDA download/search endpoints are not reliable CORS JSON APIs.
  - The `Your Health Profile` page now reads as a personalized report instead of a collapsed topic list:
    - The page keeps the existing title/subtitle and adds one concise educational introduction.
    - Only the existing top three ranked themes are shown.
    - Each theme is expanded by default with `Why this stands out`, `What's already working well`, `Things to keep in mind`, and an educational source.
    - The old `More Info`, `Strong Family Pattern`, and `Notable Family Pattern` presentation was removed.
    - Internal pattern labels were changed to neutral ranking keys while preserving the same ordering weights.
  - `Your Health Profile` and `Your Prevention Plan` were tightened for faster scanning:
    - The Health Profile intro paragraph and `Why this stands out` heading were removed.
    - Each Health Profile card now opens with one short summary sentence, then compact `Healthy habits` and `Worth paying attention to` bullet groups.
    - Today's Focus no longer renders the generated rationale under each goal; it shows only checkbox, goal label, and an optional resource action button.
    - Obsolete `More Info` and pattern-badge CSS selectors were removed from the active stylesheet.
  - Health Profile card summaries were rewritten to avoid raw evidence/calculation wording:
    - Cards no longer surface phrases such as `appears across 2 family-history entries` or condition/relationship rollups like `Colon cancer in Grandparent`.
    - The summary beneath each theme title now uses short, person-facing copy based on the health area and whether family-history/current-habit signals exist.
    - The positive section heading is now `What's already working well`.
  - The post-assessment page hierarchy was strengthened:
    - `Your Health Profile` and `Your Prevention Plan` now use a larger, heavier page-title treatment with muted subtitles directly beneath.
    - Health Profile uses the one-sentence intro `Your assessment highlights the three health areas that may benefit most from your attention.` directly above the three theme cards.
    - Health Profile cards have more spacing so the three themes are the primary visual focus.
    - Prevention Plan section headings for `Today's Focus` and `Local Resources` were made larger and bolder.
  - Health Profile cards now show exactly three `Key prevention habits` per theme:
    - The old `Worth paying attention to` presentation was replaced with concise prevention-habit bullets.
    - Habits are generated from each insight's health category plus profile context such as exercise, nutrition, smoking/vaping, alcohol use, blood pressure, cholesterol, sleep, and stress.
    - Administrative items such as family-history accuracy, updating the profile, and adding relatives are excluded unless a future category is specifically about family-history data.
  - Family-history daily goals were made more respectful of missing information:
    - The diagnosis-age goal now uses optional wording: `Ask a family member about diagnosis ages if you have the opportunity.`
    - Diagnosis-age goals are only generated when a family member has a known condition and a blank diagnosis age.
    - Explicit `Unknown` diagnosis ages are treated as handled information, so the app does not keep prompting users for details they may not have.
    - Saved daily goals using earlier diagnosis-age wording are migrated in place without regenerating or reordering the rest of the daily plan.
  - Family History was redesigned into a structured blood-relative tree flow:
    - Added a professional blood-relative notice excluding household members, step-relatives, and spouses unless related by blood.
    - Added `familyStructure` counts for brothers, sisters, sons, daughters, maternal/paternal aunts, and maternal/paternal uncles.
    - Counts generate relative slots automatically using stable `relationshipType` values such as `brother`, `daughter`, `maternal-aunt`, and `paternal-uncle`.
    - Grandparents and parents are represented as explicit slots: maternal/paternal grandmother and grandfather, Mother, and Father.
    - The relative editor now uses a two-level condition picker with broad categories and revealed specific conditions.
    - Family conditions are stored as structured objects with `name`, `category`, and per-condition `diagnosisAge`, while `illnesses` remains derived for existing prevention calculations.
    - Older generic relatives are preserved as review entries instead of being guessed into maternal/paternal or sex-specific relationships.
  - Family History visual grouping was simplified:
    - Tree rendering now uses one `Close Family` container with subtle subsection dividers for Grandparents, Parents, You & Siblings, and Children when applicable.
    - `Extended Family` renders only when aunt/uncle counts or preserved extended-family records exist.
    - Relative cards use one initials/avatar badge plus clean title, role, concise condition summary, and a single `Add Health History` / `Update Health History` action.
    - Long per-subsection descriptions and repeated labels were removed from the tree surface.
  - Family Health Tree health-history editor was simplified:
    - Condition selection no longer uses repeated Yes/No controls.
    - Broad health categories remain selectable chips, and selected categories reveal compact condition chip grids.
    - Each condition toggles on/off with a selected accent state and checkmark.
    - Per-condition diagnosis age fields render only after that condition is selected.
    - A compact `Selected Conditions` summary updates live before saving.
  - Family Health Tree pedigree was made the main page focus:
    - The separate user-facing `Imported Relatives` / review panel was removed from the Family Tree UI.
    - Legacy duplicate records are deduped on load by identity key, and extra old duplicate parent records are preserved as legacy relatives instead of being reclassified as siblings.
    - Placeholder names now derive from explicit `relationshipType`, fixing broken text such as `You (Self)` appearing on non-self relatives.
    - Maternal and paternal aunts/uncles now appear directly in the pedigree branch rows with Mother and Father.
    - The pedigree canvas now uses a larger, full-width scrollable layout with bigger nodes, clearer branch connectors, and mobile horizontal scrolling.
  - Family Health Tree condition entry was redesigned as a guided single-path picker:
    - The first level now uses five broad groups: Heart & Metabolic, Cancer, Brain & Behavioral Health, Lungs/Immune/Organ Health, and Bone/Joint/Other.
    - Only one broad group, one subcategory, and one pending condition can be active at a time.
    - `Add Condition` commits one condition plus optional diagnosis age, clears the picker path, and leaves added conditions in an editable Health History summary.
    - Existing saved conditions still load into the summary using their stored specific condition names and categories.
  - Family Health Tree pedigree connection lines now use explicit relationship groups:
    - Maternal grandparents connect to a shared sibling line for Mother plus maternal aunts/uncles.
    - Paternal grandparents connect to a shared sibling line for Father plus paternal aunts/uncles.
    - Mother and Father render as a parental pair feeding one sibling line for the user plus brothers/sisters.
    - The user's children render below a single `You` parent anchor with their own shared sibling line.
    - Dynamic child-row grid columns expand from the number of relatives instead of relying on unrelated generation rows.
  - Family Health Tree editor/pedigree cleanup:
    - The condition picker was simplified from Category → Area → Condition to Category → Condition.
    - Broad condition groups now own flat condition lists while saved condition names/categories remain backward-compatible.
    - Pedigree nodes hide duplicate role labels, so each visible node shows one relationship/title plus health-history status.
    - Placeholder avatar initials now derive from relationship type instead of using `Y` for every placeholder.
    - Mother, Father, and You render once each; side branches use aunts/uncles only and connect toward the centered parent pair.

## Open Loops

- Manual Supabase auth testing still needs real project credentials and email delivery configured in Supabase.
- Verify Supabase redirect URLs include the local/dev and deployed app origins so password reset links return to the app.
- Confirm `public.user_profiles` RLS policies allow each authenticated user to select, insert, update, and delete only rows where `user_id = auth.uid()`.
- `src/lib/supabase.js` was created in the prior session because it was not present in this checkout, despite being listed as already configured in the auth task.
- Impeccable hook continues to report pre-existing CSS findings in `src/App.css` around Inter usage, a side-tab accent, and a layout transition. They were not part of the requested UI polish.
- On 2026-08-05, `npm run lint` and `npm run build` passed after the auth-screen disclaimer update. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-05, `npm test`, `npm run lint`, and `npm run build` passed after the resource recommendation fallback update. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm test`, `npm run lint`, and `npm run build` passed after the daily goal reset update. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm test`, `npm run lint`, and `npm run build` passed after removing the visible Prevention Health Score. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm test`, `npm run lint`, and `npm run build` passed after adding the public homepage. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint`, `npm run build`, and `npm test` passed after the warmer tone/copy pass. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint` and `npm run build` passed after redesigning the public homepage hero and `How It Works` section. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint`, `npm run build`, and `npm test` passed after updating the public homepage/auth simplification and adding the signed-in account menu/settings UI. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint` and `npm run build` passed after restructuring the Family History assessment requirements and unknown-information handling. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint` and `npm run build` passed after the Family History ordering/Unknown cleanup and fixed account-header adjustment. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint`, `npm run build`, and `npm test` passed after enforcing one Mother/one Father and removing the completed `Health Profile / Profile Ready` status card. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint` and `npm run build` passed after polishing the fixed account header and simplifying Account Settings avatar UI. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-06, `npm run lint`, `npm run build`, and `npm test` passed after moving Local Resources into its own tab and changing the account control from fixed overlay to normal app-header layout. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint`, `npm run build`, and `npm test` passed after replacing the redundant Weekly Goals profile card with Weekly Consistency. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint`, `npm run build`, and `npm test` passed after combining Coach and Local Resources and centralizing assessment-step navigation. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint`, `npm run build`, and `npm test` passed after making recommendation, insight, dashboard, goal, and resource explanations more profile-specific. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint`, `npm run build`, and `npm test` passed after renaming Personalized Insights, replacing generic insight copy with adaptive summaries/next steps, and connecting Today's Focus goals to actionable resources. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint` and `npm run build` passed after removing duplicate Personalized Insights headings/descriptions and simplifying insight card sections. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint`, `npm run build`, and `npm test` passed after fixing Today's Focus action routing, goal-based resource filtering, last-tab persistence, and renaming `Prevention Coach & Resources` to `Goals & Resources`. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-08, `npm run lint` and `npm run build` passed after removing embedded resource cards from Today's Focus and keeping external resources only in Local Resources. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after redesigning Today's Focus goal generation for category uniqueness, profile-specific rationale, and recent-completion rotation. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after renaming the post-assessment tabs to `Your Health Profile` and `Your Prevention Plan`, separating explanation from action/resources, and goal-filtering the Prevention Plan resource list. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after renaming `My Profile` to `Home`, adding Account Settings to sidebar navigation, and tightening post-assessment page subtitles. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint` and `npm run build` passed after removing the duplicate Account Settings entry from the sidebar while keeping it in the top-right account dropdown. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after removing redundant Family History copy and adding explicit goal-to-resource intent mapping with tests for air quality, screening, walking, nutrition, mental wellness, respiratory, smoking cessation, family history, sleep, alcohol, and profile-specific differences. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after adding explicit `resourceNeeded` behavior for Today's Focus and limiting Your Health Profile to the top three ranked themes. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after persisting daily goals by local date so Today's Focus remains stable after completion, refresh, and tab changes. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after enabling walking/place-search Today's Focus actions and goal-specific Local Resources ranking for walking goals. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after adding FDA MQSA mammography facility resources for breast-screening location goals. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after redesigning `Your Health Profile` as an expanded personalized report and removing `More Info` plus old pattern labels from the UI. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after reducing text density in `Your Health Profile` and removing per-goal rationales from Today's Focus. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint` and `npm run build` passed after rewriting Health Profile card summaries to avoid internal evidence/count wording. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint` and `npm run build` passed after strengthening page-title and section-heading hierarchy on `Your Health Profile` and `Your Prevention Plan`. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after replacing Health Profile `Worth paying attention to` bullets with exactly three category-specific `Key prevention habits`. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after making family-history daily goals optional and conditional on actually missing diagnosis-age details. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-09, `npm run lint`, `npm run build`, and `npm test` passed after updating the diagnosis-age family-history daily goal wording and adding in-place migration for saved daily goals. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after redesigning Family History into a blood-relative family-structure flow with structured condition data and per-condition diagnosis ages. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after compacting Family History into `Close Family` plus optional `Extended Family` groups and fixing duplicate relative-card labels. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after replacing Family History editor Yes/No condition controls with selectable condition chips and selected-only diagnosis age fields. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after removing the Imported Relatives panel, integrating maternal/paternal extended family into the main pedigree, and widening the Family Health Tree visualization. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after replacing the family health-history condition checklist with a guided broad-category → subcategory → condition → age → Add Condition flow. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after replacing pedigree generation-row connectors with explicit parent-pair, sibling-line, and child-stem connection groups. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after removing the condition picker Area/Subcategory step and cleaning duplicate pedigree people/labels. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing two Family Health Tree regressions:
  - Aunts and uncles now render in the explicit Generation 2 parent row, aligned with Mother and Father rather than under the grandparent row.
  - Profile autosave and daily-goal reset effects are guarded by cloud-profile hydration, structured relatives without saved IDs get deterministic relationship/slot IDs, and blank Family Structure counts no longer remove existing relatives during save.
  - Added regression tests for blank-count hydration, explicit count reduction, and stable structured relative IDs. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after replacing the Family Health Tree health-history side drawer with a full-screen editor:
  - The editor now opens as a full-screen focused workspace with a prominent `Back to Family Health Tree` action and a wide centered form.
  - Condition choices now use responsive selectable cards with a clear selected state while preserving the Category → Condition flow.
  - Leaving the editor with unsaved changes opens a `Discard unsaved changes?` confirmation before resetting the temporary form state. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing assessment entry and family-history persistence:
  - The centralized assessment flow now starts with `Your Current Health`, then Family Structure, Family Health Tree, Everyday Habits, Health Profile, and Prevention Plan.
  - Current-health conditions now synchronize to the `You` node in the Family Health Tree while preserving diagnosis ages already added through the tree.
  - Generated sibling saves now infer and persist the stable slot index from IDs such as `sister-1` and `brother-2`, fixing the bug where saved sibling health history rendered as an empty regenerated placeholder.
  - Added regression tests for assessment entry, self sync/removal, generated sibling identity, and multiple sibling histories. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after improving Family Health Tree pedigree readability:
  - Sidebar navigation now places `Your Current Health` before `Your Family Structure`.
  - Pedigree nodes are wider with larger fixed grid tracks, clearer padding, and visible `Add Health History →` / `Update Health History →` text inside each non-self relative card.
  - Family Health Tree page copy now tells users to select a family member, and a first-time cue appears until at least one family relative has saved health history.
  - Pedigree connections, relationship layout, IDs, Supabase persistence, and health-history logic were left unchanged. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after preventing pedigree clipping and removing the generic legacy `Sibling` node from the visible tree:
  - The pedigree canvas now uses a wider 1640px minimum width, larger 260-300px node tracks, more left/right padding, and visible overflow inside the horizontally scrollable pedigree area.
  - Legacy generic sibling records remain preserved in profile data for calculations/review but are no longer appended as an extra `Sibling` node beside explicit Brother/Sister slots.
  - Added a regression test confirming visible sibling rows contain only explicit brothers, `You`, and explicit sisters. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after replacing the oversized scrollable pedigree with a bounded responsive layout:
  - Removed the overflow source: `width: max-content`, 1640px/900px/840px pedigree minimum widths, and horizontal pedigree scrolling.
  - Pedigree nodes now use responsive widths: 155px default, 140px at <=1280px, 132px at <=980px, and 118px at <=720px.
  - Parent, sibling, child, and extended-relative rows now wrap within the available content width instead of forcing horizontal page overflow.
  - Pedigree node actions were shortened to `Add History →` and `Update →` inside the tree. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after improving the incomplete-profile Home experience:
  - The Home `Continue` action now uses the centralized assessment flow to open the first incomplete section instead of always starting over.
  - Completion is derived from saved profile state across Current Health, Family Structure, required parent information in the Family Health Tree, and Everyday Habits.
  - Opening an incomplete section from Home now shows a subtle dismissible reminder, scrolls to the section, and applies a soft temporary highlight.
  - The progress card still disappears once all required assessment sections are complete. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing Family Health Tree relationship labels and simplifying the parent requirement modal:
  - Exact relationship formatting now lives in the shared family-structure utility module and covers parents, grandparents, siblings, children, maternal/paternal aunts and uncles, and self.
  - Pedigree cards, editor headers, card action aria labels, and removal confirmations now use exact structured relationship labels when available.
  - User-provided names remain primary while the exact relationship stays available as supporting context.
  - Legacy generic relatives remain generic when the exact relationship cannot be safely determined.
  - The `Complete Parent Information` modal now has a single primary `Return` action; the `Add Parent` shortcut was removed. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing Family Health Tree health-history persistence:
  - The save path now converts generated placeholder IDs such as `maternal-grandmother-placeholder` into stable persisted IDs such as `maternal-grandmother`.
  - Saved relatives are committed with `isPlaceholder: false` and a canonical `conditions` array containing `{ category, diagnosisAge, name }`.
  - Every structured relationship type uses the same `updateFamilyMembersWithSavedRelative` commit path, including grandparents, parents, siblings, children, and maternal/paternal aunts and uncles.
  - `Save Health History` now updates the canonical `familyMembers` state, clears any pending older debounced save, writes the complete profile snapshot to Supabase, and only closes the editor after persistence succeeds.
  - Save failures now leave the editor open and show `Health history couldn't be saved. Please try again.`
  - Added regression coverage for core placeholder saves, generated sibling saves, all structured relationship types, and profile-data serialization round trips. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after tightening Family Health Tree pedigree card labels:
  - Pedigree node widths were increased responsively so common relationship labels such as `Maternal Grandfather` and `Paternal Aunt 1` stay on one line whenever possible.
  - Pedigree title text now uses nowrap with ellipsis protection instead of balanced word-by-word wrapping.
  - The initials badge remains in a separate grid column, and status/action text remains stacked with clear spacing.
  - Small-screen branch layout now stacks the maternal/paternal grandparent sides to avoid reintroducing horizontal page overflow. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing Family Health Tree sibling generation layout and removing relative-card menus:
  - The `You + siblings` generation now uses one deterministic sibling branch row, with siblings distributed around `You` instead of rendered as separate visual rows.
  - The sibling row no longer wraps, so brothers, sisters, and `You` share the same horizontal generation line from Mother/Father.
  - Added tests for no siblings, one sister, and two brothers plus one sister.
  - Removed all three-dot relative-card menus and related state/CSS selectors; the card itself remains the editor trigger. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after fixing the remaining sibling health-history persistence path:
  - Root cause: legacy/generic sibling records with IDs such as `sister-1` or `brother-1` could be selected as the existing record during save and override the structured editor relationship type, so conditions were saved to a legacy record that the generated sibling row did not render.
  - The editor's structured `familyRelationshipType` now takes precedence over a same-ID legacy existing record during save.
  - Stable sibling identity now ignores invalid/zero slot indexes and derives `slotIndex` from IDs such as `sister-1` and `brother-1` when needed.
  - Added regression tests for Sister 1/Asthma, Brother 1/High blood pressure, and Sister 1 plus Sister 2 separate condition persistence through profile-data serialization.
  - Real signed-in browser refresh/sign-out verification remains a manual follow-up because no test Supabase account/session is available in this environment. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-16, `npm run lint`, `npm run build`, and `npm test` passed after improving Health Profile positive-factor personalization:
  - `What's already working well` now uses category-specific supported signals from the user's current-health and everyday-habits answers.
  - Positive factors are assigned after insight ranking, tracking used signal IDs so the same behavior is not repeated across top Health Profile cards when another supported signal exists.
  - Neutral fallback copy appears when the user has no supported positive signal for a category, avoiding unsupported claims.
  - Added tests for duplicate prevention, supported claims, same-category different-user outputs, and fallback behavior. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-21, `npm run lint`, `npm run build`, and `npm test` passed after fixing grandparent health-history edit validation:
  - Root cause: the `Save Health History` handler ran relationship-count validation before distinguishing true add mode from edit mode, so grandparent edits could be blocked by the four-grandparent cap.
  - Relationship-limit validation now lives in the family persistence module and returns `false` whenever an existing editor target is being saved.
  - The app still blocks true add-mode attempts to create a fifth grandparent with `You can add up to 4 grandparents.`
  - Added tests proving all four fixed grandparent slots can be edited in place with additional conditions while the total grandparent count remains four. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-23, `npm run lint`, `npm run build`, and `npm test` passed after redesigning Top 3 Health Profile insight content:
  - Health Profile cards now use structured interpretation fields for `What your profile suggests`, a compact family-pattern strip, `What's already working well`, `What matters most for you`, and `Your next best step`.
  - Insight interpretation now uses exact relative labels, maternal/paternal side, first-degree vs second-degree relatives, affected-relative counts, diagnosis ages, current-health answers, and everyday-habit signals without changing Top 3 ranking.
  - Generic visible `Key prevention habits` lists were replaced in the card UI with prioritized personalized factors.
  - Added tests proving the same Heart Health category produces different explanations for different family/lifestyle profiles. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-24, `npm run lint`, `npm run build`, and `npm test` passed after redesigning `Your Prevention Plan` around action-specific prevention planning:
  - A new prevention action planner separates profile-derived actions into `Today`, `This Month`, and `Keep Track Of` instead of treating every prevention item as a daily goal.
  - Actions are generated from top Health Profile themes, family-history conditions, missing diagnosis ages, current-health answers, everyday habits, and completion state.
  - Each action carries explicit `resourceNeeded` and `resourceIntent` metadata so only actions that benefit from a place, service, tool, program, or Family Health Tree update show a CTA.
  - Local Resources no longer renders a generic directory by default; it prompts the user to choose an action and then ranks resources only for that selected action.
  - Resource cards now distinguish places, events, clinics/health services, screening facilities, online tools, and trusted guidance; permanent places no longer display `Date to be announced`.
  - Added regression tests for Today vs This Month separation, explicit resource intents, family-history routing, completed monthly-action progression, and distinct plans for different profiles. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-25, `npm run lint`, `npm run build`, and `npm test` passed after simplifying `Your Prevention Plan` action cards:
  - Today and This Month action cards now render only the action label, completion checkbox, and an optional relevant CTA.
  - Supporting rationale text such as profile-highlight explanations, `Selected because`, and similar under-action copy was removed from the card UI while keeping the underlying personalization data intact.
  - Cardiovascular action CTAs were made more specific: blood-pressure actions use `Find Blood Pressure Options`, and cholesterol actions use `Find Cholesterol Options`.
  - Added regression coverage for the new blood-pressure and cholesterol CTA labels. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-25, `npm run lint`, `npm run build`, and `npm test` passed after stabilizing daily and monthly Prevention Plan actions:
  - Today now generates up to four distinct profile-supported action categories, including nutrition, movement, sleep, mental well-being, respiratory/air-quality, heart-habit, hydration, or other relevant daily actions.
  - Daily actions are saved as `dailyActions`, `dailyActionsDate`, and `completedDailyActionIds`, so checking an item only changes completion state and does not replace or reorder the list during the same local day.
  - This Month actions are saved as `monthlyActions`, `monthlyActionsMonth`, and `completedMonthlyActionIds`, so completed monthly items remain visible and checked until the next local calendar month.
  - The disappearing monthly-action bug was caused by filtering completed IDs out of `buildPreventionActionPlan`; monthly rendering now uses the complete stable monthly action list.
  - Monthly progress now displays counts, and a completed-state message appears under the list without replacing completed items. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-25, `npm run lint`, `npm run build`, and `npm test` passed after connecting physical-activity actions directly to Local Resources:
  - Walking and outdoor-activity actions now use `Find Parks & Trails` and open the selected-action resource view instead of requiring a generic search.
  - Local Resources injects up to five ZIP-specific park, trail, and recreation place records for physical-activity actions, ranks them through the existing goal-intent scorer, and labels the section `Parks & Trails Near You`.
  - Park and trail cards are typed as places, with `Park`, `Walking Trail`, or `Recreation area` labels, distance text when known, suitability notes, and `View on Map` actions instead of event-date language.
  - Saved walking actions from older profiles with `resourceNeeded: false` are upgraded only when the action text is clearly walking/outdoor-specific; self-contained actions still remain button-free.
  - Added tests proving walking actions map to parks/trails, old saved walking actions gain the CTA, and San Francisco vs Berkeley ZIPs return different park/trail options. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-25, `npm run lint`, `npm run build`, and `npm test` passed after simplifying the top-right account/profile control:
  - The closed account control now renders as a lightweight transparent header control with avatar, display name, and chevron only.
  - Google/Supabase metadata is used first for account identity: display name from `user.user_metadata.full_name`, `name`, or `display_name`; avatar from `user.user_metadata.avatar_url` or `picture`.
  - Saved `accountProfile.avatarUrl` remains a secondary avatar fallback, followed by initials if no image exists or the image fails to load.
  - The dropdown now contains the compact identity block with avatar, name, email, and the Home, Account Settings, and Log Out actions.
  - The account control remains in the normal app header flow and is not fixed to the viewport. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-27, `npm run lint`, `npm run build`, and `npm test` passed after redesigning `Your Prevention Plan` into a three-horizon prevention dashboard:
  - The dashboard now renders `Today`, `This Week`, and `This Month` action sections with separate progress counts and compact action cards.
  - Today actions remain small and immediate, including specific movement, nutrition, hydration, sleep, stress, heart-habit, and air-quality actions when supported by profile data.
  - This Week actions are generated as multi-day habit targets, including weekly movement, produce consistency, sugary-drink replacement, sleep consistency, stress-reset planning, and specific family-history follow-up when relevant.
  - This Month actions remain higher-value prevention tasks such as blood pressure, cholesterol, screening guidance/location actions, smoking/vaping support, and missing family-history details.
  - Weekly actions are now persisted as `weeklyActions`, `weeklyActionsWeek`, and `completedWeeklyActionIds`, resetting only when the local week key changes.
  - Completed daily, weekly, and monthly actions remain visible and checked; completion does not regenerate, reorder, or remove the current horizon's stable actions. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-27, `npm run lint`, `npm run build`, and `npm test` passed after tightening Prevention Dashboard action wording:
  - Removed unsupported generated action wording such as `Complete your planned physical activity today` and vague weekly wording such as `Stay active on several days this week`.
  - Daily physical-activity actions now say `Take a 20-minute walk.` and keep the `Find Parks & Trails` resource intent.
  - Weekly actions now use measurable multi-day wording, including `20 minutes of moderate physical activity on 3 days`, `at least one meal on 5 days`, `at least 3 times`, and a `1-hour window on at least 5 nights` when supported by the user's profile.
  - Sugary-drink replacement is only generated when the user's profile reports enough sugary-drink intake to support that action.
  - Risk-rule explanation copy no longer uses unsupported `activity target` language. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-27, `npm run lint`, `npm run build`, and `npm test` passed after adding adaptive Prevention Dashboard recommendations:
  - Action history is now persisted as `preventionActionHistory` with goal ID/type/category, period, assigned date, completion status, completion amount, recent completion rate, target metadata, and adaptation level.
  - Daily, weekly, and monthly completions update the action-history record for the active period without regenerating the visible action list.
  - New weekly/monthly/day generation finalizes the outgoing period's history first, then generates the next plan from that updated history.
  - Weekly physical-activity, nutrition, sleep, mental-well-being, and family-history actions adapt only after two consecutive low-completion periods; high completion can step adapted movement goals back upward without indefinite escalation.
  - The Prevention Plan now has a compact `Your Progress` section derived from recent action history, with no health score. Build still reports the existing Vite chunk-size warning for the main JS bundle.
- On 2026-08-27, `npm run lint`, `npm run build`, and `npm test` passed after adding contextual resources and recommendation evidence inside `Your Prevention Plan`:
  - A centralized evidence registry now maps prevention actions to vetted public-health source records from CDC, USPSTF, FDA/AirNow, and related official guidance.
  - Prevention actions now carry traceable metadata such as `evidenceId`, `resourceType`, `resourceIntent`, and `personalizationReasons` while preserving existing stable active action arrays.
  - Action cards now expose a compact `Why this?` disclosure that separates general evidence from the personal reason the action appears in the user's plan.
  - Local Resources remains inside `Your Prevention Plan` and continues to switch by selected action intent: parks/trails, blood-pressure options, FDA mammography facilities, AirNow, or Family Health Tree routing as appropriate.
  - Resource query construction is privacy-safe: only the resource intent and ZIP/city are used, not family conditions, diagnosis ages, current illnesses, or lifestyle answers.
  - Added tests for evidence resolution, evidence/source traceability, resource intent routing, privacy-safe queries, and the exact seven-item main navigation. Build still reports the existing Vite chunk-size warning for the main JS bundle.

## Recommended Next Actions

1. Manually verify the sibling persistence flow in a real signed-in browser session: Sister 1 -> add Asthma -> Save Health History -> confirm the pedigree shows `1 condition` -> refresh -> sign out/sign in -> confirm Asthma remains.
2. Manually inspect Daily Habits, Family Health History, and resource recommendation cards on desktop and mobile after signing in.
3. Manually test account creation, email verification, sign-in, incorrect password, session refresh, logout, forgot password, update password, cloud reload, two-user separation, and localStorage import against the real Supabase project.

## 2026-09-12 Update

Track tag: project development.

- Profile writes now run through a serialized per-user save coordinator, and the UI exposes `Saving...`, `Saved`, and `Couldn't save` states.
- Explicit Current Health, Everyday Habits, family-history, family-structure, account, import, logout, and reset writes can no longer overtake one another.
- Reset Health Profile now waits for cloud deletion before clearing the current UI and preserves the authenticated account.
- The account dropdown now includes My Account, Privacy & Data, and Log Out. Privacy & Data supports a sanitized JSON export and profile reset.
- Local Resources now applies strict selected-city filtering before personalization, offers an actionable community-health-center search for blood-pressure actions, and separates breast-screening guidance from FDA facility lookup.
- Main navigation remains the exact seven approved items.
- Verification: `npm run lint`, `npm run build`, and `npm test` passed; 182 tests passed. The existing Vite large-chunk warning remains. Signed-in multi-device and real Supabase RLS verification still require test accounts/sessions.

## 2026-09-12 Navigation And Home Summary Update

Track tag: project development.

- Main navigation and the shared assessment workflow now follow Current Health -> Everyday Habits -> Family Structure -> Family Health Tree -> Health Profile -> Prevention Plan.
- Home's long Family Insights paragraph and generic Learn More action were replaced with a compact Profile Summary showing up to two existing ranked focus areas and up to two strengths supported by the saved lifestyle answers.
- The new View Your Health Profile action opens the existing Health Profile view. No health ranking, persistence, Supabase, family-tree, or prevention-plan logic changed.
- Verification: `npm run lint`, `npm run build`, and `npm test` passed; 186 tests passed. The signed-out public route rendered successfully at `http://localhost:5173/`; authenticated Home visual QA still requires an existing signed-in browser session. The existing Vite large-chunk warning remains.

## Flagged Memory Entries

- [FLAGGED] 2026-08-03 14:54 PDT | Track tag: project development | `MEMORY.md` was missing at session start even though `Agents.md` requires reading active memory entries. Learned that the harness needs a baseline memory file before future Alfred/Nate continuity workflows can run cleanly. Affected workflow/tool: session-continuity startup.

## 2026-10-03 Pedigree Layout Update

Track tag: project development.

- Rebuilt the Family Health Tree as four fixed horizontal generation rows: grandparents; parents plus their siblings; self plus siblings; and children.
- Parent-side capacity is balanced so Mother and Father remain centered even when the maternal and paternal branches contain different numbers of relatives. The existing deterministic sibling ordering keeps self centered.
- Node width and spacing now compact from 168px/16px to 108px/8px as generation size increases, then the pedigree stage scales to the available desktop/tablet width. Very narrow mobile uses contained pedigree-only horizontal scrolling.
- A single SVG connector overlay is recalculated from measured node bounds with `ResizeObserver`; no relationship line uses fixed page coordinates.
- Visual QA used a 4-grandparent, 11-person parent generation, 5-person sibling generation, and 3-child fixture. At 1440, 1280, 1024, 900, and 768px, every generation had one top coordinate, no nodes were clipped, parent/self center offsets were zero, and page-level horizontal overflow was zero. At 390px, only the pedigree viewport scrolled horizontally and the page did not.
- Verification: `npm run lint`, `npm run build`, and `npm test` passed; 195 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-03 Profile Safety And Navigation Update

Track tag: project development.

- Blank optional family-structure counts now satisfy validation and completion rules while producing no relatives; explicit values continue to persist and generate stable pedigree members.
- Forward sidebar and assessment navigation now share one prerequisite guard. Locked destinations keep the user on the current step and show a temporary reminder naming the first incomplete section; the seven approved navigation names and icons are unchanged.
- Health Profile and Prevention Plan generation now applies conservative sex-at-birth and age/context eligibility before showing organ-specific priorities or screening actions. Unknown or undisclosed eligibility does not create sex-specific recommendations.
- Recommendations now require a real profile signal, an applicable context, and a vetted evidence record. Family history can still surface breast-cancer education, but it does not independently establish personal screening eligibility.
- Today actions remain immediate tasks; This Week actions must be distinct, measurable multi-day or cumulative goals. Weekly hydration now carries explicit target metadata for accurate progress tracking.
- The Health Profile introduction uses the full available desktop width without clipping, while retaining natural wrapping on narrow mobile screens.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 210 tests passed. The existing Vite large-chunk warning remains. The running development server still responds at `http://127.0.0.1:5173/`.

## 2026-10-03 Health Data Reset Confirmation Update

Track tag: project development.

- Replaced the browser-native health-data deletion confirmation with an accessible in-app dialog.
- Rewrote the warning as concise, grammatically consistent copy that separates deleted profile data from the account, which remains active.
- Added explicit `Keep my data` and `Delete health data` actions, safe default focus, Escape/backdrop cancellation, a deletion loading state, and a responsive mobile button layout.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 210 tests passed. The signed-out public route rendered successfully in the in-app browser; authenticated dialog visual inspection still requires an active signed-in session. The existing Vite large-chunk warning remains.

## 2026-10-03 Empty Profile Progress And Copy Update

Track tag: project development.

- Fixed a new-account progress bug where valid blank optional family counts were incorrectly treated as a completed Family Structure step, causing an untouched profile to display 25% progress.
- Added a persisted `familyStructureCompleted` state that becomes true only after Family Structure is saved. Blank optional counts remain valid and still mean zero once that step is completed.
- Added clear example placeholders for body measurements (`e.g., 5`, `e.g., 8`, and `e.g., 150`) and renamed `Body estimate` to `Estimated BMI`.
- Updated the health-data deletion warning to consistent sentence case: `current health answers` and `everyday habits`.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 210 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-03 Family Condition Entry Update

Track tag: project development.

- Removed the free-text `Condition not listed` field from relatives in the Family Health Tree. Relative histories now use the built-in condition catalog, `Unknown`, or `No known conditions`.
- Kept `My condition is not listed` in the user's own Current Health profile as a boolean flag without collecting an arbitrary condition name.
- Simplified the `More inherited conditions` description and retained support for displaying legacy custom family conditions already saved in existing profiles.
- Added a regression test that prevents the relative custom-condition field from returning while preserving the Current Health option.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 211 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-03 Text Clipping Fix

Track tag: project development.

- Removed the fixed `600px` width cap from Family Structure and Home introduction copy so the sentences use the available content width before wrapping.
- Removed the two-line clamp, hidden overflow, and narrow `15rem` cap from Profile Overview descriptions so personalized copy such as `Personalized around...` is always shown in full.
- Responsive wrapping remains enabled when the viewport is genuinely too narrow for a single line.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 211 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-03 Current Health Condition Placement Update

Track tag: project development.

- Removed the visible `More inherited conditions` disclosure and `No known conditions` action from the Family Health Tree relative editor.
- Added the inherited-condition disclosure to Your Current Health, where its conditions are now valid searchable database selections.
- Renamed the self-profile none option to `No known conditions` with self-specific clearing copy. `My condition is not listed` remains alongside it.
- Family search now uses only the guided relative-history categories. Existing saved relative records, including legacy no-known and supplementary conditions, remain readable and persist normally.
- Added a regression test confirming these controls belong to Current Health and cannot return to the relative editor accidentally.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 212 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-04 Prevention Plan Timeframe Update

Track tag: project development.

- Replaced the internal-sounding progress status `Adjusted for manageability` with `Personalized to your profile`.
- Updated the prevention-plan hierarchy to describe Today as `Small actions you can complete now` and This Week as actions that require planning or build across several days.
- Added a centralized weekly-action guard. Weekly items must now have a cumulative or multi-day target, or require a relevant external resource/planning step; vague one-off daily actions cannot enter the weekly list.
- Existing eligibility safeguards remain in place for blood-pressure and screening guidance, so these actions appear only when supported by the user's profile.
- Added tests for the weekly planning boundary and the supportive personalized progress wording.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 214 tests passed. The existing Vite large-chunk warning remains.

## 2026-10-04 Resource Empty State And Measurement Update

Track tag: project development.

- Removed the always-visible `Local Resources` empty panel and its two action-selection instructions from the Prevention Plan.
- The existing resource finder is now progressive: it appears only after the user explicitly opens resources from a prevention action, preserving useful resource functionality without showing an empty section.
- Removed example-number placeholders from height feet, height inches, and weight. Empty saved values now render as genuinely blank inputs while unit labels remain visible.
- Added source-level regression coverage for the conditional resource finder and blank optional measurement fields.
- Verification: `npm run lint`, `npm test`, and `npm run build` passed; all 216 tests passed. The existing Vite large-chunk warning remains.

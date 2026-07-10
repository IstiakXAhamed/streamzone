# Implementation Plan: UI/UX Overhaul

## Overview

This plan implements the refactor-first UI/UX overhaul described in the design. It proceeds from the token/config foundation, through the framework-free pure-logic layer under `lib/ui/*` and `lib/motion/*` (each of the 30 correctness properties is turned into a `fast-check` property test placed next to its implementation), then the motion layer and `components/ui|carousel|hero|layout` primitive library, and finally the page/surface redesigns that consume those primitives. Every step builds on the previous ones and ends with wiring the new chrome into the existing Server Components. All Next.js 16 constraints from the design are respected: `preload` + `fetchPriority` instead of deprecated `priority`, `images.qualities`/`remotePatterns`, `experimental.viewTransition` + React `<ViewTransition>`, `onLoad` (not `onLoadingComplete`), and the `Media` wrapper for remote Drive/CDN images.

Language: TypeScript (matching the existing Next.js 16 / React 19 codebase). Tests use Vitest + fast-check + Testing Library + axe-core.

> Reminder for implementers: this is a modified Next.js 16. Read the relevant guide in `node_modules/next/dist/docs/` before touching `next/image`, `next.config.ts`, `<Link>`, or route files, and heed deprecation notices.

## Tasks

- [ ] 1. Foundation: tokens, Next.js 16 config, and test tooling
  - [ ] 1.1 Extend the `@theme` token layer in `app/globals.css`
    - Add semantic state colors (success/warning/error/info + subtle/contrast) as HSL, formalize text opacity tokens (primary 95% / secondary 70% / tertiary 50%), typography scale utilities (`.text-display`…`.text-overline` with weights 400/500/600/700), 4px spacing steps (4…96), elevation-1..4 layered shadows, motion duration (100/200/300/500) + easing (`--ease-out`, `--ease-spring`) tokens, and radius tokens (sm/md/lg/xl/full); re-point `--radius-card` to `--radius-md`
    - Preserve existing brand/surface ramp tokens
    - Define the shimmer keyframe (1.5s left-to-right sweep) as a token-driven utility
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 20.4_
  - [ ] 1.2 Add global reduced-motion and scroll guards in `app/globals.css`
    - `@media (prefers-reduced-motion: reduce)` zeroing CSS transitions/animations, disabling `scroll-behavior: smooth`, view-transition durations, and shimmer sweep
    - Enable `scroll-behavior: smooth` for the default (non-reduced) case
    - _Requirements: 14.5, 20.3, 20.6_
  - [ ] 1.3 Update `next.config.ts` for Next.js 16 rules
    - Add `experimental.viewTransition: true`, `images.qualities: [50, 75]`, and `images.remotePatterns` scaffolding (Drive/CDN hosts; `Media` falls back to `unoptimized` when a host is not listed)
    - Read the current `next/image` and config docs under `node_modules/next/dist/docs/` first
    - _Requirements: 14.1, 17.1_
  - [ ] 1.4 Set up the test toolchain
    - Add Vitest, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fast-check`, and an axe integration as dev dependencies; add `vitest.config.ts` and a jsdom setup file; add a `test` script using single-run (no watch)
    - _Requirements: (supports all property/interaction/a11y testing)_

- [ ] 2. Pure logic: color/contrast, formatting, and layout math (`lib/ui/*`)
  - [ ] 2.1 Implement `lib/ui/contrast.ts`
    - `contrastRatio(a, b)` via relative luminance; helper enumerating the design's `(text token, surface token)` co-occurring pairings and asserting AA thresholds
    - _Requirements: 1.7, 16.1, 20.1_
  - [ ]* 2.2 Write property test for contrast
    - **Property 1: Contrast ratios are well-formed and all token pairings pass WCAG AA**
    - **Validates: Requirements 1.7, 16.1, 20.1**
  - [ ] 2.3 Implement `lib/ui/format.ts`
    - `formatDuration`, `formatRating` (one decimal), `formatFileSize` (one decimal), `relativeTime`, `sanitizeErrorMessage` (≤120 chars, strip status codes/URLs/stack markers, non-empty fallback), and the saved-item metadata-omission helper (≤3 genres, omit missing fields)
    - _Requirements: 6.3, 10.2, 11.1, 19.2_
  - [ ]* 2.4 Write property test for duration/rating formatting
    - **Property 6: Duration and rating formatting obey their format invariants**
    - **Validates: Requirements 6.3**
  - [ ]* 2.5 Write property test for file-size formatting
    - **Property 18: File size formatting has one decimal and is monotonic**
    - **Validates: Requirements 11.1**
  - [ ]* 2.6 Write property test for relative time and metadata omission
    - **Property 16: Relative-time and metadata omission are well-formed**
    - **Validates: Requirements 10.2**
  - [ ]* 2.7 Write property test for error sanitization
    - **Property 28: Error messages are sanitized and bounded**
    - **Validates: Requirements 19.2**
  - [ ] 2.8 Implement `lib/ui/layout-math.ts`
    - `gridColumnsForWidth`, `fluidType`, `staggerDelays(count, step, cap)`, `progressWidth(position, duration)`
    - _Requirements: 4.7, 5.3, 7.2, 7.3, 10.5, 12.4, 15.3, 15.4_
  - [ ]* 2.9 Write property test for progress-bar width
    - **Property 4: Progress-bar width is a clamped, monotonic ratio**
    - **Validates: Requirements 5.3, 12.4**
  - [ ]* 2.10 Write property test for responsive grid columns
    - **Property 7: Responsive grid column count is a correct, non-decreasing step function**
    - **Validates: Requirements 7.2, 15.3**
  - [ ]* 2.11 Write property test for stagger delays
    - **Property 8: Stagger delays apply the step up to the cap, then zero**
    - **Validates: Requirements 2.5, 6.7, 7.3, 10.5, 14.6**

- [ ] 3. Pure logic: routing, sorting, pagination, responsive visibility (`lib/ui/*`)
  - [ ] 3.1 Implement `lib/ui/active-route.ts`
    - `isTabActive(pathname, tabRoot)` with full path-segment prefix matching; `"/"` matches only exact `"/"`; at most one active tab
    - _Requirements: 3.2, 3.7_
  - [ ]* 3.2 Write property test for active-tab detection
    - **Property 2: Bottom-tab active detection matches route roots without false prefixes**
    - **Validates: Requirements 3.2, 3.7**
  - [ ] 3.3 Implement `lib/ui/sort.ts`
    - Comparators: Trending (views desc), Newest (year desc), Highest Rated (rating desc), A–Z (case-insensitive asc); stable and total
    - _Requirements: 7.4, 7.7, 13.3_
  - [ ]* 3.4 Write property test for sort comparators
    - **Property 9: Sort comparators produce an ordered permutation**
    - **Validates: Requirements 7.7, 13.3**
  - [ ] 3.5 Implement `lib/ui/pagination.ts`
    - `paginate(items, pageSize)` (default 50) partitioning without loss/duplication
    - _Requirements: 10.7, 13.3_
  - [ ]* 3.6 Write property test for pagination
    - **Property 10: Pagination partitions items without loss or duplication**
    - **Validates: Requirements 10.7, 13.3**
  - [ ] 3.7 Implement `lib/ui/responsive.ts`
    - `isVisibleAt(width, kind)` for mobile-only vs desktop-only across the 768px boundary
    - _Requirements: 15.5, 15.7_
  - [ ]* 3.8 Write property test for responsive visibility
    - **Property 30: Responsive visibility is mutually exclusive across the 768px boundary**
    - **Validates: Requirements 15.5, 15.7**

- [ ] 4. Pure logic: watch stats, related movies, avatars, presence, chat (`lib/ui/*`)
  - [ ] 4.1 Implement `lib/ui/watch-stats.ts`
    - `computeWatchStats` (unique movies, total hours = round(sum/3600), favorite genre or null) and `continueWatching` (position > 0 and < 90% duration, most-recent order, cap 30)
    - _Requirements: 12.2, 12.3, 12.4_
  - [ ]* 4.2 Write property test for watch statistics
    - **Property 20: Watch statistics aggregate correctly (including the empty case)**
    - **Validates: Requirements 12.2, 12.3**
  - [ ]* 4.3 Write property test for continue-watching filter
    - **Property 21: Continue-watching filter selects in-progress items, ordered and capped**
    - **Validates: Requirements 12.4**
  - [ ] 4.4 Implement `lib/ui/related.ts`
    - `relatedMovies(current, catalogue)` sharing ≥1 genre, excluding self, capped at 20
    - _Requirements: 6.6_
  - [ ]* 4.5 Write property test for related-movie selection
    - **Property 5: Related-movie selection shares a genre, excludes self, and is capped**
    - **Validates: Requirements 6.6**
  - [ ] 4.6 Implement `lib/ui/avatars.ts`
    - `visibleAvatars(participants)` returning ≤8 visible + exact overflow count
    - _Requirements: 8.3_
  - [ ]* 4.7 Write property test for avatar overflow
    - **Property 11: Avatar overflow accounting is exact**
    - **Validates: Requirements 8.3**
  - [ ] 4.8 Implement `lib/ui/presence.ts`
    - `isOnline(lastSeen, now)` with 5-minute boundary treated as online
    - _Requirements: 9.3_
  - [ ]* 4.9 Write property test for online status
    - **Property 14: Online status respects the 5-minute boundary**
    - **Validates: Requirements 9.3**
  - [ ] 4.10 Implement `lib/ui/chat.ts`
    - `isValidMessage`/`clampMessage` (trimmed length 1–500, 500 accepted) and `applyIncoming` auto-scroll/unread reducer keyed on bottom-anchored scroll state
    - _Requirements: 8.2, 8.7_
  - [ ]* 4.11 Write property test for chat message validation
    - **Property 12: Chat message validation enforces the 1–500 character bound**
    - **Validates: Requirements 8.7**
  - [ ]* 4.12 Write property test for chat auto-scroll/unread accounting
    - **Property 13: Chat auto-scroll and unread accounting depend on scroll position**
    - **Validates: Requirements 8.2**

- [ ] 5. Pure logic: search, toast stacking, optimistic updates, preferences, a11y (`lib/ui/*`)
  - [ ] 5.1 Implement `lib/ui/search.ts`
    - `matches(query, title)` (gated at ≥2 chars, case-insensitive, cap 10), `highlightRanges` (non-overlapping segments that rejoin to the title), `groupByRecency` (Today/This Week/Earlier partition), and recent-search history (dedup, cap 5, most-recent-first)
    - _Requirements: 11.5, 18.1, 18.2, 18.3_
  - [ ]* 5.2 Write property test for search matching
    - **Property 26: Search matching gates on length and returns only matching, capped results**
    - **Validates: Requirements 18.2**
  - [ ]* 5.3 Write property test for search highlighting
    - **Property 27: Search highlighting round-trips the title**
    - **Validates: Requirements 18.3**
  - [ ]* 5.4 Write property test for recency grouping
    - **Property 19: Recency grouping partitions items by age**
    - **Validates: Requirements 11.5**
  - [ ]* 5.5 Write property test for recent-search history
    - **Property 25: Recent-search history is deduplicated, capped, and most-recent-first**
    - **Validates: Requirements 18.1**
  - [ ] 5.6 Implement `lib/ui/toast-stack.ts`
    - Reducer capping visible toasts at 3, evicting oldest on a 4th, dismiss removes only the target
    - _Requirements: 19.5_
  - [ ]* 5.7 Write property test for toast stacking
    - **Property 29: Toast stacking never exceeds 3 and evicts the oldest**
    - **Validates: Requirements 19.5**
  - [ ] 5.8 Implement `lib/ui/optimistic.ts`
    - `applyOptimistic`/`confirm`/`revert` (revert restores exact prior state and is idempotent)
    - _Requirements: 17.2_
  - [ ]* 5.9 Write property test for optimistic updates
    - **Property 24: Optimistic updates round-trip on revert**
    - **Validates: Requirements 17.2**
  - [ ] 5.10 Implement `lib/ui/preferences.ts` and `lib/ui/selection.ts`
    - Saved-view preference read/write round-trip (grid/list); batch-selection toggle set with count and set-consistent removal
    - _Requirements: 10.1, 10.6_
  - [ ]* 5.11 Write property test for saved-view preference persistence
    - **Property 15: Saved-view preference round-trips through persistence**
    - **Validates: Requirements 10.1**
  - [ ]* 5.12 Write property test for batch selection
    - **Property 17: Batch selection count and removal are set-consistent**
    - **Validates: Requirements 10.6**
  - [ ] 5.13 Implement `lib/ui/a11y.ts`
    - `isValidAltText` (meaningful 5–150, decorative exactly ""), `isValidIconLabel` (≥3)
    - _Requirements: 16.5_
  - [ ]* 5.14 Write property test for alt-text/icon-label validation
    - **Property 23: Alt-text and icon-label validation enforce length bounds**
    - **Validates: Requirements 16.5**

- [ ] 6. Checkpoint - pure-logic layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Motion layer (`lib/motion/*` + providers)
  - [ ] 7.1 Implement `lib/motion/reduced-motion.ts`
    - `useAppReducedMotion()` (framer-motion `useReducedMotion` + app override) and `resolveDuration(ms)` returning 0 under reduced motion
    - _Requirements: 14.5, 16.6, 20.6_
  - [ ]* 7.2 Write property test for reduced-motion duration resolution
    - **Property 22: Reduced motion collapses duration to zero while preserving end state**
    - **Validates: Requirements 14.5, 16.6, 20.6**
  - [ ] 7.3 Implement `lib/motion/variants.ts`
    - `fadeUp`, `scalePress`, `modalContent` (spring stiffness 300 damping 24), `saveBounce` (1→1.3→1 spring), `staggerContainer`
    - _Requirements: 5.6, 6.5, 14.3, 14.4, 14.6, 20.2_
  - [ ] 7.4 Mount `<MotionConfig reducedMotion="user">` in `lib/providers.tsx`
    - Wrap the existing client provider tree so all framer-motion animations respect the OS setting
    - _Requirements: 14.2, 14.5, 16.6_

- [ ] 8. Design-system primitives (`components/ui/*`)
  - [ ] 8.1 Implement `Button` and `IconButton`
    - Token-driven variants (brand/surface/ghost/danger), sizes, pill, loading; 150ms ease-out hover/focus color transitions; `scalePress`; icon-only buttons require `aria-label`
    - _Requirements: 6.4, 6.5, 20.5, 16.5_
  - [ ] 8.2 Implement the `Media` image wrapper
    - `next/image` with `fill`/`sizes`, `onLoad` 300ms fade-in reveal, `onError`/missing-src fallback graphic, `preload` + `fetchPriority="high"` for LCP images (never deprecated `priority`), defaulting to `unoptimized` when host not in `remotePatterns`
    - _Requirements: 5.4, 5.5, 6.2, 17.1_
  - [ ] 8.3 Implement `Card`, `Skeleton`, and `ProgressBar`
    - Elevation tokens; shimmer skeleton matching content dimensions appearing within 100ms; `ProgressBar` using clamped `progressWidth`
    - _Requirements: 5.3, 12.4, 20.4_
  - [ ] 8.4 Implement `FocusTrap` (`components/layout/FocusTrap.tsx`)
    - Move focus in on open, cycle Tab/Shift+Tab, Escape closes, return focus to trigger on close
    - _Requirements: 2.6, 2.8, 16.4_
  - [ ] 8.5 Implement `Modal` and `Sheet`
    - Compose `FocusTrap`; `role="dialog"`, `aria-modal`, `aria-labelledby`; backdrop-blur; open (backdrop 0→target 200ms, content 0.95→1 spring) / close (150ms) via `modalContent`; `Sheet` bottom sheet with `heightVh`
    - _Requirements: 8.1, 12.7, 13.4, 13.5, 14.3, 14.4, 16.4_
  - [ ] 8.6 Implement `Tabs` and `SegmentedControl`
    - `role="tablist"`, arrow-key navigation, sliding active indicator (framer-motion `layoutId`, 200ms)
    - _Requirements: 7.4, 9.1, 16.3, 16.4_
  - [ ] 8.7 Implement `Toast` and `ToastProvider`
    - `ToastProvider` mounted in `lib/providers.tsx`, backed by `lib/ui/toast-stack.ts`; slide-in-from-top ≤300ms, auto-dismiss 3s, aria-live region; max 3 visible
    - _Requirements: 16.3, 19.5, 20.2_
  - [ ] 8.8 Implement `EmptyState` and `ErrorState`
    - Illustration + copy + single CTA; `ErrorState` shows sanitized message (≤120 chars) + Retry with retrying loading indicator; brand gradient-mesh background (0.03–0.15 opacity)
    - _Requirements: 19.1, 19.2, 19.3, 20.1_
  - [ ]* 8.9 Write interaction and axe tests for primitives
    - Modal/Sheet focus trap + Escape/cancel dismissal + focus return; Media fade-in on `onLoad` and fallback on `onError`; Toast stacking behavior; axe roles/labels/aria-modal/live regions on each primitive
    - _Requirements: 5.4, 5.5, 12.7, 12.8, 13.4, 16.3, 16.4, 19.5_

- [ ] 9. Carousel, hero, and layout components (`components/carousel|hero|layout/*`)
  - [ ] 9.1 Implement edge-fade visibility logic in `lib/ui/carousel.ts`
    - `edgeFadeVisibility(scrollLeft, clientWidth, scrollWidth)` returning leading/trailing gradient flags
    - _Requirements: 4.6_
  - [ ]* 9.2 Write property test for carousel edge-fade
    - **Property 3: Carousel edge-fade visibility follows scroll metrics**
    - **Validates: Requirements 4.6**
  - [ ] 9.3 Implement `Carousel`, `CarouselRow`, and `EdgeFade`
    - Evolve `components/home/CarouselRow.tsx`: scroll-snap + touch momentum, `EdgeFade` driven by `edgeFadeVisibility`, `role="region"` + `aria-roledescription`, arrow-key navigation, "See All" link
    - _Requirements: 4.6, 4.9, 16.3, 16.4_
  - [ ] 9.4 Implement `Hero` / `HeroCarousel` (`components/hero/Hero.tsx`)
    - 8s auto-advance (disabled under reduced motion), pause on hover/touch/manual + resume after 15s idle, 500ms crossfade, swipe (`@use-gesture/react`) + arrows, gradient overlay with title/year/rating/Play CTA
    - _Requirements: 4.1, 4.2, 4.3, 16.6_
  - [ ] 9.5 Implement `Backdrop` parallax (`components/hero/Backdrop.tsx`)
    - Full-width backdrop (min 288px mobile / 384px ≥640px), multi-stop gradient, parallax 0.5x on ≥1024px via framer-motion `useScroll`, backdrop→poster→black fallback chain through `Media`
    - _Requirements: 6.1, 6.2_
  - [ ] 9.6 Implement `PageTransition` and `ScrollReveal` (`components/layout/*`)
    - `PageTransition` using React `<ViewTransition>` (`enter="fade-up"`) with `<Link transitionTypes>`; `ScrollReveal` using IntersectionObserver (threshold 0.1) revealing fade + 12px translate over 400ms with 75ms child stagger
    - _Requirements: 14.1, 14.6_

- [ ] 10. Navigation redesign (`app/(site)/_components/*`)
  - [ ] 10.1 Rebuild `TopNav`
    - Brand, links, search trigger, notification badge (hidden at 0), avatar ≥768px; scroll-aware condense (64→48px, bg 80%→95% at >64px, 200ms ease-out); animated hover underline (150ms); z-index ≥50 + `backdrop-filter: blur(12px)`; full-screen mobile overlay (8px backdrop blur, 50ms staggered items, `FocusTrap`, Escape/backdrop/close dismissal returning focus to hamburger)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  - [ ] 10.2 Rebuild `BottomTabs`
    - Exactly 5 tabs, ≥48px touch targets, active pill (`layoutId`, 200ms spring) via `isTabActive`, `aria-current="page"`, `role="navigation"` + label, frosted glass (blur ≥10px, 70–90% opacity), `safe-area-inset-bottom` padding, Vibration API haptic with graceful fallback + scale press, tap-active-tab-scrolls-to-top, hidden ≥768px
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  - [ ]* 10.3 Write nav interaction tests
    - Mobile overlay open/close via backdrop/close/Escape + focus return; tapping active tab scrolls to top; haptic fallback when Vibration API absent
    - _Requirements: 2.6, 2.8, 3.3, 3.8_

- [ ] 11. Home page and movie card
  - [ ] 11.1 Rebuild `MovieCard` (`components/home/MovieCard.tsx`)
    - Desktop hover scale 1.05 + elevation + overlay (title/year/rating/Play, 200ms ease-out); mobile long-press ≥300ms context menu (Play/Watchlist/Download/Share) with pre-threshold release navigating; press scale 0.97 then navigate; lazy poster via `Media` (fade-in + fallback); optional progress bar via `progressWidth`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 11.2 Write MovieCard interaction tests
    - Long-press vs pre-threshold release; image fade-in on `onLoad`, fallback on `onError`
    - _Requirements: 5.2, 5.4, 5.5, 5.7_
  - [ ] 11.3 Rebuild the Home page (`app/(site)/page.tsx`) and add `loading.tsx`
    - Hero + auth-branched row set (include/omit "Continue Watching"), each row with "See All"; dimension-matched skeletons via `loading.tsx`; 10s client watchdog swapping skeleton → `ErrorState` with retry; wire `Hero`, `Carousel`, `MovieCard`
    - _Requirements: 4.4, 4.5, 4.7, 4.8_

- [ ] 12. Movie detail page (`app/(site)/movie/[slug]/*`)
  - [ ] 12.1 Rebuild `MovieDetailContent` and add `loading.tsx`
    - `Backdrop` parallax; two-column grid ≥640px collapsing to centered single column; poster 2:3, formatted duration/rating, genre pill links; pill action buttons (Play brand-fill, others surface-3) with scale pulse; "More Like This" carousel via `relatedMovies` (≤20); staggered entry (50ms, ≤400ms); non-critical section unmounts on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 19.4_
  - [ ]* 12.2 Write movie-detail interaction tests
    - Staggered entry ordering; action-button scale-pulse; backdrop fallback chain; "More Like This" section removal on fetch failure
    - _Requirements: 6.2, 6.7, 19.4_

- [ ] 13. Checkpoint - core surfaces
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Category/genre page (`app/(site)/category/[genre]/*`)
  - [ ] 14.1 Rebuild the Category page and add `loading.tsx`
    - Header (display-type genre name, ≤10% genre gradient accent, count badge); responsive grid via `gridColumnsForWidth` (16px gap); `SegmentedControl` sort (Trending default) via `lib/ui/sort.ts`; re-sort with framer-motion `layout` (300ms); staggered entry 30ms/item capped 40; empty state with genre name + home link
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 15. Watch party room (`app/(site)/party/[roomId]/_components/*`)
  - [ ] 15.1 Rebuild `PartyRoomClient` (+ `ChatPanel`, `VoiceStrip`) and add `loading.tsx`
    - 16:9 player max width; chat as collapsible 320px side panel ≥1024px, `Sheet` at 50vh <1024px; auto-scroll/unread via `lib/ui/chat.ts` with slide-up-fade; participant strip via `visibleAvatars` (≤8 + "+N"), online dots, host crown, join/leave system messages + scale in/out; host-only sync controls with 2s confirmation + guest toast (3s); chat input hard-capped 500 chars
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 16. Friends, Saved, Downloads, Profile
  - [ ] 16.1 Rebuild the Friends page (`app/(site)/friends/_components/FriendsContent.tsx`)
    - `Tabs` (Friends/Requests/Discover) sliding indicator; accept morph (`layoutId`) Requests→Friends (≤400ms); online dot via `isOnline`; debounced search (≤300ms) ≤20 staggered results + empty state; send-request checkmark→Pending; reject fade-out with no re-show
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 19.1_
  - [ ] 16.2 Rebuild the Saved page (`app/(site)/saved/*`)
    - Grid/list toggle persisted via `lib/ui/preferences.ts`; item fields with graceful omission; remove exit (fade+scale) + collapse; empty state (CTA to Home); staggered entry capped 20; batch select via `lib/ui/selection.ts` + confirm; 50/page pagination via `lib/ui/pagination.ts` ordered by saved desc
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 19.1_
  - [ ] 16.3 Rebuild the Downloads page (`app/(site)/downloads/page.tsx`)
    - Cards with 60×90 thumb, title, file size via `formatFileSize`, 3-state action button (idle/spinner/checkmark); vertical list 12px gap + dividers; empty state; recency grouping via `groupByRecency` when >10; disabled state for expired links
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 19.1_
  - [ ] 16.4 Rebuild the Profile page (`app/(site)/profile/page.tsx`) with a client `SignOutButton`
    - Header (avatar + edit overlay, name, email, role badge, "Member since MMM YYYY"); stats card row via `computeWatchStats` (zeros/None when empty); Continue Watching carousel via `continueWatching` (≤30, progress bars) + empty state; account action list with chevrons/dividers; sign-out confirmation `Modal` with cancel path
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 17. Admin panel (`app/(admin)/*`, `components/admin/*`)
  - [ ] 17.1 Rebuild `AdminSidebar`
    - Collapse toggle (→64px icon-only ≥768px), Content/Users/System groupings, brand active state; <768px converts to bottom `Sheet` triggered by a menu button
    - _Requirements: 13.1, 13.5_
  - [ ] 17.2 Rebuild admin dashboard and data tables (+ `loading.tsx`)
    - Stat cards (gradient bg brand-adjacent 10%, trend indicators, icon accents); data tables (alternating shading, hover, sortable headers via `lib/ui/sort.ts`, pagination default 20 with 10/20/50) via `lib/ui/pagination.ts`; destructive-action danger `Modal` (Escape/cancel dismiss); <768px tables → one-record cards; dimension-matched skeletons with 10s watchdog
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ] 18. Search overlay, 404, and connectivity
  - [ ] 18.1 Implement `SearchOverlay` and wire it into `TopNav`/`BottomTabs`
    - Full-screen (mobile) / dropdown (desktop) with backdrop blur; ≤5 recent searches from `lib/ui/search.ts`; ≥2 chars → debounced (300ms) ≤10 results (poster/title/year) via `matches`; title highlight via `highlightRanges`; empty state ≤6 trending suggestions; select navigates + 150ms fade-out; Escape/backdrop/back dismiss without navigating; error state retains query text
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 19.1_
  - [ ] 18.2 Implement custom `not-found.tsx` (404)
    - MovieZone logo, "content not found" message, "Back home" link
    - _Requirements: 19.6_
  - [ ] 18.3 Implement the connectivity watcher and optimistic-action wiring
    - Status toast on RTT > 3s / offline (visible ≥5s or until restored) without interrupting content; wire `save`/`unsave`/`send friend request` through `lib/ui/optimistic.ts` with 10s revert + error toast
    - _Requirements: 17.2, 17.5_

- [ ] 19. Checkpoint - all surfaces
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Integration, accessibility, and reduced-motion verification
  - [ ]* 20.1 Write axe and keyboard-traversal tests for page shells and primitives
    - axe assertions (roles, labels, `aria-current`, `aria-modal`, live regions); keyboard traversal for carousels (arrow keys), tabs, and modals; focus-ring visibility toggling between keyboard and pointer
    - _Requirements: 16.2, 16.3, 16.4_
  - [ ]* 20.2 Write reduced-motion and Next.js config smoke tests
    - With `prefers-reduced-motion` emulated, assert Hero auto-advance disabled and durations resolve to 0; assert `experimental.viewTransition` enabled and `images.qualities` present in `next.config.ts`
    - _Requirements: 14.5, 16.6, 20.6_

- [ ] 21. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each of the 30 correctness properties maps to exactly one `fast-check` property test (min 100 iterations), placed next to its `lib/ui/*` or `lib/motion/*` implementation and tagged `// Feature: ui-ux-overhaul, Property {n}: {text}`.
- Property→task index: P1→2.2, P2→3.2, P3→9.2, P4→2.9, P5→4.5, P6→2.4, P7→2.10, P8→2.11, P9→3.4, P10→3.6, P11→4.7, P12→4.11, P13→4.12, P14→4.9, P15→5.11, P16→2.6, P17→5.12, P18→2.5, P19→5.4, P20→4.2, P21→4.3, P22→7.2, P23→5.14, P24→5.9, P25→5.5, P26→5.2, P27→5.3, P28→2.7, P29→5.7, P30→3.8.
- Visual/animation-timing, responsive-pixel, frosted-glass, LCP, and prefetch criteria are validated by example/interaction/integration tests (tasks 8.9, 10.3, 11.2, 12.2, 20.1, 20.2) and manual/Lighthouse review, not by property tests — matching the design's Testing Strategy.
- Next.js 16 constraints (`preload` vs `priority`, `images.qualities`/`remotePatterns`, `ViewTransition`, `onLoad`, `Media` for remote images) are enforced in tasks 1.3, 8.2, 9.5, 9.6 and the config smoke test 20.2.
- Full WCAG AA conformance still requires manual assistive-technology testing beyond automated axe + contrast checks.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.3", "2.8", "3.1", "3.3", "3.5", "3.7", "4.1", "4.4", "4.6", "4.8", "4.10", "5.1", "5.6", "5.8", "5.10", "5.13", "7.1", "9.1"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.5", "2.6", "2.7", "2.9", "2.10", "2.11", "3.2", "3.4", "3.6", "3.8", "4.2", "4.3", "4.5", "4.7", "4.9", "4.11", "4.12", "5.2", "5.3", "5.4", "5.5", "5.7", "5.9", "5.11", "5.12", "5.14", "7.2", "7.3", "9.2"] },
    { "id": 3, "tasks": ["7.4", "8.1", "8.2", "8.3", "8.4", "8.8"] },
    { "id": 4, "tasks": ["8.5", "8.6", "8.7", "9.3", "9.6"] },
    { "id": 5, "tasks": ["8.9", "9.4", "9.5", "11.1"] },
    { "id": 6, "tasks": ["10.1", "10.2", "11.2", "12.1"] },
    { "id": 7, "tasks": ["10.3", "11.3", "12.2", "14.1", "15.1", "16.1", "16.2", "16.3", "16.4", "17.1", "17.2", "18.1", "18.2", "18.3"] },
    { "id": 8, "tasks": ["20.1", "20.2"] }
  ]
}
```

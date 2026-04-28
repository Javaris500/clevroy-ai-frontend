# Clevroy — Competitor UX Research & Honest Gap Audit

Last updated: 2026-04-28. Synthesizes web research on the current state of competing tools (linked sources at the bottom of each section) with internal product analysis. Grounded in fact-checked feature inventories, not vibes.

Pair with:
- `docs/Clevroy_Settings_Projects_Brief.md` — internal design briefs.
- `docs/Clevroy_Routes_Build_Audit.md` — what we're building.
- `docs/Clevroy_Chat_Surface.md` — locked spec.

---

## 1. The competitive map (current state)

The space splits into four overlapping markets. Clevroy is positioned in the first.

### 1.1 Direct script-to-film (head-to-head)
- **LTX Studio** (Lightricks) — most direct competitor.
- **Showrunner** (Fable) — TV episode generation, not v1 fight.
- **Higgsfield AI** — character consistency + DoP cinematography.

### 1.2 Generic AI video (eats same wallet)
- **Runway** (Gen-4 / Gen-4.5) — category leader.
- **Sora** (OpenAI) — premium, gated, prestige play.
- **Pika** — playful, short-form, Discord heritage.
- **Luma Dream Machine** — mobile-friendly, motion-strong.
- **Kling** (Kuaishou) — high-fidelity.
- **Veo** (Google) — integrated into Google ecosystem.
- **Krea** — multimodal canvas.

### 1.3 AI avatars / talking head (adjacent, not competing)
- **Synthesia, HeyGen, D-ID** — corporate explainers.
- **Captions** — mobile creator tool.

### 1.4 Edit-side AI (different shape, same wallet)
- **Descript** — script-as-edit (closest brand cousin).
- **Opus Clip, Submagic** — long-to-short repurposing.

---

## 2. Competitor deep dive

### 2.1 LTX Studio — the most direct UX competitor

**The feature stack (verified 2026):**

- **Script breakdown.** Paste a screenplay → automatic scene division → storyboard thumbnails per shot → AI-suggested camera framing per shot.
- **Character consistency.** Persistent Character Profiles (age, ethnicity, hairstyle, wardrobe, facial details) — define once, applied across every shot in the project. This is their **headline differentiator**.
- **Element extraction.** AI extracts characters and objects as reusable Elements you reference in later shots.
- **Camera controls.** Keyframes for crane lifts, 3D orbits, tracking shots. Sketch-on-canvas interface to specify object placement.
- **Audio-to-video.** Upload audio (dialogue, music, voiceover); the system generates video where timing/pacing is shaped by the sound.
- **Output.** Up to 4K at 50fps with synced audio.
- **Model choice.** Switch between FLUX or Nano Banana for image generation per project.
- **Aspect locked upfront.** Set 16:9 / 9:16 / 1:1 once for the whole project; can't mix.

**UX shape:** Three-pane layout — Script (left) | Storyboard grid (center) | Shot detail/preview (right). Timeline-style, not chat-style. Each shot is a card; you click in to refine.

**Honest assessment:**

| Where they win | Where they lose |
|---|---|
| Most thorough script-to-shot pipeline in the category | Three-pane layout is a desktop power-user view; mobile is mostly broken |
| Character consistency is their moat | Brand voice is generic SaaS ("AI-powered," "magical") — your brand voice rules would lint half their UI |
| Camera controls are filmmaker-literate | No narrative arc / no anticipation building during generation |
| Audio-to-video is genuinely unique | Heavy upfront commitment (script + characters + style locked) before first preview |

**Sources:**
- [LTX Studio homepage](https://ltx.studio/)
- [LTX Studio top features 2026](https://ltx.studio/blog/top-ltx-studio-features)
- [LTX Studio Review (Dupple)](https://dupple.com/tools/ltx-studio)
- [LTX Studio Review (DigitalbyDefault)](https://digitalbydefault.ai/blog/ltx-studio)

---

### 2.2 Runway — the elder statesman

**The feature stack (Gen-4 / Gen-4.5, verified 2026):**

- **Director Mode.** Node-based interface. Camera control via **sliders, not text**: Zoom In, Pan Right, Truck, Tilt, Orbit, Dolly. Combine multiple moves on one shot ("Zoom In 2x + Pan Right").
- **Motion Brush.** Paint regions of a still to specify where motion happens. The most "physical" interaction in the category.
- **Reference images in Director Mode.** Lock first frame to prevent character drift.
- **Multi-scene scripts** with consistent characters via reference imagery.
- **Frame guidance.** Drag a still onto a shot to lock as start frame.
- **Watermark-free creator community.** Public gallery with prompts visible — discovery + remix culture.

**UX shape:** Timeline + canvas duality. Flat timeline of shots; click any shot → canvas with knobs. Mature node graph for advanced workflows.

**Honest assessment:**

| Where they win | Where they lose |
|---|---|
| Director Mode (slider-based camera language) is the gold standard for "make a vague creative intent legible to the model" | Dense, expert-feeling — new users don't know where to start |
| Motion Brush is genuinely unique | No native script→multi-shot flow; you build shot-by-shot |
| Creator community / discovery feed onboards new users for free | Settings panels feel SaaS-clichéd (collapsible accordions, dense forms) |
| Most mature timeline editor in the category | Brand voice is corporate-creative ("more control, fidelity, expressibility") |

**Sources:**
- [Runway Gen-4 Guide 2026](https://aitoolsdevpro.com/ai-tools/runway-guide/)
- [Runway Gen-4.5 Review](https://aitoolssmarthub.com/runway-gen-4-5-review/)
- [Runway Research: Introducing Gen-4](https://runwayml.com/research/introducing-runway-gen-4)
- [Runway Research: More control, fidelity, expressibility](https://runwayml.com/research/more-control-fidelity-and-expressibility)

---

### 2.3 Sora — the prestige play

**The feature stack (Sora 2, verified 2026):**

- **Storyboards.** Web-only, Pro-tier. Composer has a "Storyboard" button that opens a timeline-based editor. Sketch the video second-by-second with text descriptions per beat.
- **Two storyboard modes:**
  1. Build from scratch — frame by frame, you describe each.
  2. Describe scene + duration → Sora generates a detailed storyboard you can edit.
- **Reference images / videos** per scene to guide the AI.
- **Pro: 25-second videos**; Free: 15-second.
- **Curated Explore feed** — every visible video is high quality. Discovery is core to onboarding.
- **App on iOS, web parity for Pro features.**

**UX shape:** Composer (single prompt or storyboard mode). Cinematic-first prompt suggestions. Subdued, premium chrome — feels like a film tool, not a meme generator.

**Honest assessment:**

| Where they win | Where they lose |
|---|---|
| Curated Explore feed sets quality expectations from first paint | Heavily gated, slow generation, Pro-tier required for storyboards |
| Storyboard auto-generation from a single prompt is a powerful onboarding shortcut | No persistent thread / project model; each generation is somewhat orphaned |
| Premium brand chrome — restraint, no emoji, no "magical" | Lacks deep refinement — you mostly re-prompt rather than iterate |
| Cinematic-first prompt suggestions teach taste | No character consistency surface; no per-shot direct manipulation |

**Sources:**
- [Sora release notes (OpenAI)](https://help.openai.com/en/articles/12593142-sora-release-notes)
- [Sora 2 Update (eWeek)](https://www.eweek.com/openai/openai-adds-longer-clips-sora-2/)
- [Sora homepage (OpenAI)](https://openai.com/sora/)

---

### 2.4 Higgsfield AI — the cinematography play

**The feature stack (DoP I2V-01-preview, verified 2026):**

- **50+ camera presets.** Dolly-in/out, whip pans, crash zooms, FPV drone, Snorricam, bullet time, crane shots, orbit, push-in, pull-back. Each named, each thumbnailed.
- **DoP mode.** Open Camera Control → upload input image → select camera preset → add motion/action prompt → generate.
- **Camera language as first-class UI.** Lens choices, focal lengths, apertures exposed as controls.
- **Glassmorphism dark UI.** Responsive desktop + mobile.

**UX shape:** Image-to-video first. Camera move is the primary creative variable, prompt describes the action within the move.

**Honest assessment:**

| Where they win | Where they lose |
|---|---|
| **The most filmmaker-literate UI in the entire AI video category** | Niche — appeals to people who already know what a Snorricam is |
| 50+ named, thumbnailed camera presets is a category-leading affordance | Image-to-video first means the user must already have a still; no script→film flow |
| Lens / focal length / aperture controls treat creators as adults | Brand voice is functional, not narrative |

**Sources:**
- [Higgsfield Camera Controls](https://higgsfield.ai/camera-controls)
- [Higgsfield DoP I2V-01-preview blog](https://higgsfield.ai/blog/Introducing-Higgsfield-DoP-preview)
- [Higgsfield WAN Camera Control guide](https://higgsfield.ai/blog/WAN-AI-Camera-Control-Your-Guide-to-Cinematic-Motion)
- [Higgsfield homepage](https://higgsfield.ai/)

---

## 3. UX patterns inventory — what each pattern is good for

A pattern catalogue grouped by intent. For each, who does it best and what Clevroy should learn.

### 3.1 Script breakdown
- **Best in class:** LTX Studio — automatic scene split + storyboard thumbnails + element extraction.
- **Clevroy today:** Six-phase walker conceptually similar but the user *doesn't see the breakdown* — narration is the only proxy.
- **Lesson:** Surface the script breakdown explicitly. After parsing, render a horizontal scene-strip showing N scenes; user can see what's about to happen before the first asset lands.

### 3.2 Camera language as UI
- **Best in class:** Higgsfield (50+ presets, thumbnailed) and Runway (Director Mode sliders).
- **Clevroy today:** Zero. AspectToggle and StylePreset are aesthetic; no shot-language vocabulary.
- **Lesson:** This is the biggest single missing affordance. See the dedicated UX spec at `docs/Clevroy_Cinematography_Vocabulary_Spec.md` (creative bet writeup).

### 3.3 Discovery / community feed
- **Best in class:** Sora (curated quality), Runway (community gallery with prompts).
- **Clevroy today:** Zero. New users don't see what's possible.
- **Lesson:** A `/explore` route is a top-3 priority for category competitiveness. Even fixture-driven for v1.

### 3.4 Direct manipulation on assets
- **Best in class:** LTX Studio (click any shot → side panel), Runway (canvas with knobs).
- **Clevroy today:** Pure chat refinement. No fallback when the LLM fails.
- **Lesson:** Direct manipulation as a *complement* to chat, not a replacement. See `docs/Clevroy_Scene_Manipulation_Prompt.md`.

### 3.5 Character consistency UI
- **Best in class:** LTX Studio (Persistent Character Profiles), Higgsfield (image-to-video with character lock), Runway (reference images).
- **Clevroy today:** AI Twin (voice + face) exists in `/ai-twin` settings but isn't surfaced during film generation.
- **Lesson:** Promote AI Twin from settings to a first-class chat-input affordance. "Use my voice for the narrator" / "Cast my face as the lead" buttons next to the prompt.

### 3.6 Storyboard auto-generation from prompt
- **Best in class:** Sora 2 — describe a scene + duration, get an editable storyboard.
- **Clevroy today:** Storyboard suggestion *cards* exist but they fill the prompt; they don't *generate* a multi-beat storyboard.
- **Lesson:** A "Build storyboard" mode that takes one-line input and returns a 6-beat storyboard the user can edit before committing. Major retention win for first-timers.

### 3.7 Camera moves as named presets
- **Best in class:** Higgsfield (50+ thumbnailed).
- **Clevroy today:** None.
- **Lesson:** Steal this. Filmmaking has a vocabulary; expose it.

### 3.8 Audio-driven generation
- **Best in class:** LTX Studio (audio-to-video — pacing/motion shaped by sound).
- **Clevroy today:** None — voice is reserved real estate but unwired.
- **Lesson:** The mic affordance in the chat input could be more than dictation; it could be **audio-as-script** (paste a voice memo, get a film with that as VO).

### 3.9 Hover preview / motion thumbnails
- **Best in class:** Runway (gallery autoplays on hover), Pika (gif previews).
- **Clevroy today:** Static covers only.
- **Lesson:** When Layer 5 mints playable thumbnails, make `/projects` cards autoplay-on-hover. Already noted as a Layer-5 concern.

### 3.10 Templates / starter gallery
- **Best in class:** Pika ("Pikaffects" with thumbnails), Captions (template marketplace).
- **Clevroy today:** 12-prompt rotation on `/home`. Good but small.
- **Lesson:** A more substantial template gallery with thumbnails + remix-by-default. Pair with the discovery feed.

### 3.11 Real-time canvas mode
- **Best in class:** Krea (low-latency model regenerates as you type).
- **Clevroy today:** N/A — generation is minutes-scale.
- **Lesson:** Out of scope until model latency drops; flag for v2.

### 3.12 Mobile-first capture
- **Best in class:** Captions, Luma.
- **Clevroy today:** Mobile-respectful but not mobile-native.
- **Lesson:** Capacitor build needs first-class mobile capture (record voice memo as script, take a selfie for AI Twin) — distinct from the desktop chat surface.

---

## 4. Where Clevroy is genuinely differentiated today

The bets nobody else is making. Roughly descending order of strength.

### 4.1 Chat-as-canvas with the thread = the film
**Spec D1**: `/films/[id]` IS the thread, post-completion. The thread is the artifact.

No competitor does this. Runway has projects (database rows with shots inside). Pika has flat generations. LTX has a timeline. Sora has storyboards but not persistent threads. **You have a *narrative* of how the film came to be, attached to the film.** Strongest UX bet.

### 4.2 Templated cinematic narration in brand voice
"Reading your script. Casting your characters. Directing your scenes."

You have a *narrator*. Runway has a progress bar. Pika has loading shimmer. Sora has nothing. The narrator turns dead-time-during-generation into emotional through-line. **Second-strongest bet.**

### 4.3 The wow moment is by-design
First `scene_playback` autoplaying-muted with the Fraunces unmute tooltip is a *designed peak*. Most competitors have "your video is ready" + a play button. You have a moment.

### 4.4 Six-phase arc as state model
The 12-state backend enum compressed to 6 user-facing phases is a clean mental model. Most competitors expose a flat progress bar or a confusing list of substeps. Yours reads as a film production.

### 4.5 Anti-empty-stage rules
Spec §3 mandates activity beats during long phases. Risk 2 has explicit mitigation. Most competitors let dead air kill engagement.

### 4.6 Brand voice runtime filter
Server-side regex rejects "Oops / magical / AI-powered / generate." Your assistant text can never drift. Nobody else enforces voice at runtime.

### 4.7 "Reshoot" / "Take it home" verbs
Cinematic vocabulary is consistent. Pika says "regenerate"; you say "reshoot." Cumulative differentiation.

### 4.8 AI Twin as first-party surface
Most competitors require BYO LoRA or have nothing. Clevroy has voice + face twin training in the product. Underexposed in the current flow but a real moat.

### 4.9 The Atmosphere component
Letterbox, Timecode, CueMarks, Grain — your chat surface has *cinema chrome*. Audacious, no competitor does this.

### 4.10 NUMERIC(8,2) "films" as currency
Films-as-currency, integer or fraction, never coerced to float. Most competitors have unclear pricing. You have a unit and a metaphor.

---

## 5. Honest gap audit — where Clevroy loses today

Calling out the things you'd lose to in a head-to-head demo right now. Stack-ranked by how much they hurt.

### 5.1 No camera-language vocabulary (critical)
**Loses to:** Higgsfield, Runway Director Mode.

A serious creator wants "dolly in on the detective" or "Snorricam on Maya." Clevroy has AspectToggle and StylePreset; zero shot-language. The biggest single missing affordance. **Creative bet 3 (cinematography vocabulary) addresses this — see dedicated spec.**

### 5.2 No direct manipulation on assets (critical)
**Loses to:** LTX Studio, Runway.

Once an asset lands in the thread, no clickable knobs exist. The user types "make scene 3 darker" or nothing. If the LLM router fails or is slow, **zero fallback**. **Layer prompt addresses this — see `docs/Clevroy_Scene_Manipulation_Prompt.md`.**

### 5.3 No discovery / community feed (critical)
**Loses to:** Sora, Runway.

New users have no idea what's possible. Existing users don't share or remix. Inspiration deficit is a category-level gap.

### 5.4 No timeline / scene-strip view of a completed film (high)
**Loses to:** LTX Studio, Runway.

Once a film completes, the user has 6+ assets in a vertical chat thread and no horizontal "this is the film" view. You have `<SceneStrip>` built — unused on `/films/[id]`. **Layer prompt addresses this.**

### 5.5 No template / starter gallery (high)
**Loses to:** Pika, Captions, Sora.

12-prompt rotation is novel but small. Most users want to *modify* an existing thing, not write from scratch.

### 5.6 No character-consistency surface during generation (high)
**Loses to:** LTX Studio, Higgsfield.

AI Twin is buried in `/ai-twin` settings. During film generation there's no "use my face" / "consistent character across scenes" affordance.

### 5.7 No storyboard generation from prompt (medium)
**Loses to:** Sora 2.

A first-timer typing one line should be able to get a 6-beat storyboard, edit it, then generate. You go straight from prompt to phase walker — the user can't preview or edit the structure.

### 5.8 No motion / hover thumbnails on `/projects` (medium)
**Loses to:** Runway, Pika.

Static covers only. Layer 5 dependency.

### 5.9 Brand voice may feel niche (medium, latent risk)
**Loses to:** Pika (mass-market warmth), Captions (creator-friendly).

Fraunces italic, "Take 1," "Reshoot," cinematic narration — gorgeous, but presumes the user thinks of themselves as a filmmaker. Mass-market users (creators, marketers, hobbyists) may find it presumptuous. Biggest UX bet *and* biggest risk.

### 5.10 Refinement quotas are unclear at the moment of refinement (medium)
**Loses to:** All competitors (most show cost per action).

Cost chip says "1 film for this video" at first generation. Doesn't tell you what a *refinement* costs. Risk 3 (fake refinement) needs honest cost preview at refinement time.

### 5.11 No collaboration (low for v1)
**Loses to:** Nobody yet — but Sora and Runway are gesturing toward shared projects.

Spec says "single-tenant for the foreseeable future." Fine for v1; flag for v1.5.

### 5.12 No mobile-native capture flow (low for v1)
**Loses to:** Captions.

Capacitor build will land but isn't the primary surface today.

---

## 6. Differentiation thesis — where to push

Three positioning calls for Clevroy to lean into. Each is a thing nobody else owns.

### 6.1 "Filmmaking, not video generation."
Brand voice, vocabulary, six-phase narrative, "Take 1," "Reshoot." You're not building a faster Pika; you're building a film studio. Lean **harder** into this — every page should reinforce it. Your biggest moat is also your biggest risk; commit fully or moderate, but don't half-commit.

### 6.2 "The thread is the artifact."
The persistent chat thread that IS the film's history is unique. Two extensions worth pursuing:
- **Roy as a character** (creative bet 2) — the narrator becomes a director with personality.
- **Threads as remixable assets** (creative bet 5) — fork someone's thread, edit the script, get your version.

### 6.3 "AI Twin as the casting couch."
Voice + face training already exists in the product. Surface it during generation:
- "Cast me as the lead" toggle on `/home`.
- "Use my voice for narration" affordance.
- Persistent character profiles (your AI Twin per-character) — match LTX Studio's headline feature with personality.

---

## 7. Build priorities derived from research

Sequenced by impact-per-week-of-work:

1. **Cinematography vocabulary surface** — see `docs/Clevroy_Cinematography_Vocabulary_Spec.md`. Closes gap 5.1, the biggest single hole.
2. **Scene strip + direct manipulation panel on `/films/[id]`** — see `docs/Clevroy_Scene_Manipulation_Prompt.md`. Closes gaps 5.2 and 5.4 in one surface.
3. **Discovery feed `/explore`** — fixture-driven for v1, real Realtime-driven for v2. Closes gap 5.3.
4. **Template gallery on `/home`** — extend the 12-prompt rotation to a richer browse-with-thumbnails surface. Closes gap 5.5.
5. **AI Twin promotion** — surface voice/face affordances on `/home` and per-character. Closes gap 5.6.
6. **Storyboard generation from prompt** — Sora-style preview-before-commit. Closes gap 5.7.
7. **Cost preview at refinement time** — honest pricing in the chat input when a refinement is detected. Closes gap 5.10.

Out of scope for now: collaboration (5.11), mobile-native capture (5.12).

---

## 8. The honest closing read

Clevroy's strongest assets — chat-thread-as-film, cinematic brand voice, designed wow moment — are genuinely differentiated and would carry a great demo.

Clevroy's biggest risks are **brand voice presumption** (filmmakers will love it; mass market may bounce), **no direct-manipulation fallback** (when chat refinement fails, there's nowhere to go), and **no discovery surface** (new users have no way to know what's possible).

The single highest-leverage move is **a horizontal scene-strip + direct-manipulation panel on `/films/[id]`** — closes three top-five gaps (no timeline, no direct manipulation, refinement fallback) in one surface. Spec'd in the companion prompt doc.

The second-highest is **cinematography vocabulary as first-class UI** — closes the biggest single competitive hole (no camera language) and reinforces the brand thesis. Spec'd in the companion creative bet doc.

// Curated template catalogue. v1 is hand-written, Clevroy-team-authored;
// community submissions are a Layer 6+ surface. Each entry is a complete
// bundle the user can mint into a film with one click — script, style,
// aspect, and a sample preview clip so the page never feels theoretical.
//
// Layer 5 swaps these constants for backend-served data; the type contract
// is intentionally serializable.

import type { Aspect, StylePreset } from "@/stores/create-options-store";

export type TemplateCategory =
  | "drama"
  | "comedy"
  | "documentary"
  | "horror"
  | "romance"
  | "trailer"
  | "short"
  | "music";

export interface Template {
  id: string;
  title: string;
  /** 2–3 sentences, brand voice. The blurb under the title in the detail sheet. */
  description: string;
  category: TemplateCategory;
  /** Approximate output length the template produces. */
  duration_seconds: number;
  style: StylePreset;
  aspect: Aspect;
  /** What lands in the chat textarea on "Use this template." */
  script: string;
  poster_url: string;
  /** 5–10s sample clip auto-played in the detail sheet hero. */
  preview_url: string;
  /** Featured row at the top of /templates. Mark 2–3. */
  featured?: boolean;
  created_at: string;
}

const POSTER = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/900`;

// Consistent with the phase-walker fixture so ad blockers / network
// shenanigans behave the same everywhere.
const PREVIEW = "https://www.w3schools.com/html/mov_bbb.mp4";

export const TEMPLATES: ReadonlyArray<Template> = [
  // ── Drama ──────────────────────────────────────────────────────────────
  {
    id: "tpl-lighthouse",
    title: "Letters from a lighthouse keeper",
    description:
      "A keeper writes the same letter every Sunday for forty years. The film is the slow accumulation of one routine made sacred.",
    category: "drama",
    duration_seconds: 90,
    style: "Noir",
    aspect: "16:9",
    script:
      "A 90-second drama. A lighthouse keeper writes the same letter every Sunday for forty years. We see the routine in close-up — pen, paper, candle, sea. The letter is never sent. On the last Sunday he addresses it differently for the first time.",
    poster_url: POSTER("clevroy-tpl-lighthouse"),
    preview_url: PREVIEW,
    featured: true,
    created_at: "2026-04-22T00:00:00Z",
  },
  {
    id: "tpl-piano-teacher",
    title: "The piano teacher's last student",
    description:
      "A retiring piano teacher meets her last lesson of the day, who turns out to be her own granddaughter.",
    category: "drama",
    duration_seconds: 75,
    style: "Cinematic",
    aspect: "16:9",
    script:
      "A 75-second drama. A piano teacher in her 70s prepares for her final lesson before retirement. The student arrives — a girl of nine, nervous, holding sheet music she can't read yet. By the end of the lesson, the teacher recognizes her own daughter's handwriting on the sheet.",
    poster_url: POSTER("clevroy-tpl-piano"),
    preview_url: PREVIEW,
    created_at: "2026-04-19T00:00:00Z",
  },
  {
    id: "tpl-bridge-hour",
    title: "The bridge hour",
    description:
      "Two strangers meet on a bridge at 4:14 a.m. — neither is jumping, but neither will say why they're there.",
    category: "drama",
    duration_seconds: 90,
    style: "Cinematic",
    aspect: "16:9",
    script:
      "A 90-second drama. Two strangers stand at opposite railings of a bridge at 4:14 in the morning. They notice each other. Neither speaks. Slowly they walk toward the middle. The film ends before either says a word.",
    poster_url: POSTER("clevroy-tpl-bridge"),
    preview_url: PREVIEW,
    created_at: "2026-04-15T00:00:00Z",
  },

  // ── Comedy ─────────────────────────────────────────────────────────────
  {
    id: "tpl-dog-pov",
    title: "Birthday party from the family dog's point of view",
    description:
      "A golden retriever narrates a child's birthday. The cake is a threat; the candles, prey; the singing, a warning call.",
    category: "comedy",
    duration_seconds: 60,
    style: "Animated",
    aspect: "16:9",
    script:
      "A 60-second comedy. A child's seventh birthday party rendered from the family dog's point of view. The dog narrates internally — earnest, confused. Cake is a threat. Candles are prey. The singing is a warning call. The dog saves everyone by eating the cake.",
    poster_url: POSTER("clevroy-tpl-dog"),
    preview_url: PREVIEW,
    featured: true,
    created_at: "2026-04-18T00:00:00Z",
  },
  {
    id: "tpl-coffee-out",
    title: "We're out of coffee",
    description:
      "A morning argument about coffee escalates into a meditation on marriage. Played for warmth, not heat.",
    category: "comedy",
    duration_seconds: 45,
    style: "Cinematic",
    aspect: "16:9",
    script:
      "A 45-second comedy. A married couple realizes they're out of coffee. The argument escalates from \"who used the last filter\" to \"who we became after the kids left.\" Played for warmth. Resolves with one of them leaving — for the corner store, with a list.",
    poster_url: POSTER("clevroy-tpl-coffee"),
    preview_url: PREVIEW,
    created_at: "2026-04-12T00:00:00Z",
  },

  // ── Documentary ────────────────────────────────────────────────────────
  {
    id: "tpl-grandmas-recipe",
    title: "My grandmother's recipe",
    description:
      "An interview with a grandmother making a recipe she's never written down. The hands do the explaining.",
    category: "documentary",
    duration_seconds: 60,
    style: "Documentary",
    aspect: "16:9",
    script:
      "A 60-second documentary portrait. An 80-year-old grandmother makes a recipe she's never written down. The narrator (her grandchild) asks questions; she answers in shorthand and her hands fill in the rest. End on a single bite.",
    poster_url: POSTER("clevroy-tpl-grandma"),
    preview_url: PREVIEW,
    created_at: "2026-04-10T00:00:00Z",
  },
  {
    id: "tpl-90-year-surfer",
    title: "Documentary portrait of a 90-year-old surfer",
    description:
      "Eight decades of dawn patrol, told in long takes and salt water.",
    category: "documentary",
    duration_seconds: 90,
    style: "Documentary",
    aspect: "16:9",
    script:
      "A 90-second documentary portrait. A 90-year-old surfer prepares for his morning paddle. He doesn't talk much; we hear his daughter recall what he taught her. He goes in. We watch from the beach. He comes back out walking slowly, smiling.",
    poster_url: POSTER("clevroy-tpl-surfer"),
    preview_url: PREVIEW,
    created_at: "2026-04-08T00:00:00Z",
  },

  // ── Horror ─────────────────────────────────────────────────────────────
  {
    id: "tpl-thrift-store",
    title: "Trailer for a fake horror movie about a haunted thrift store",
    description:
      "Every donation comes with a previous owner. Some of them are still attached.",
    category: "horror",
    duration_seconds: 30,
    style: "Noir",
    aspect: "16:9",
    script:
      "A 30-second trailer for a horror film that doesn't exist. A young woman starts a job at a thrift store. Donations arrive with belongings their previous owners haven't quite let go of. The customers don't notice. She does. Cut on her tying a tag to a wedding dress.",
    poster_url: POSTER("clevroy-tpl-thrift"),
    preview_url: PREVIEW,
    created_at: "2026-04-05T00:00:00Z",
  },
  {
    id: "tpl-fog-bike",
    title: "Teenager bikes home through fog",
    description:
      "A short, quiet horror about the moment before something happens. Whether it does is left to the viewer.",
    category: "horror",
    duration_seconds: 45,
    style: "Noir",
    aspect: "9:16",
    script:
      "A 45-second short. A teenager bikes home through dense fog after a bad night. We hear only her breath and the chain. Something moves alongside her at one point — or doesn't. She gets home. The door is unlocked. She closes it slowly.",
    poster_url: POSTER("clevroy-tpl-fog"),
    preview_url: PREVIEW,
    created_at: "2026-04-02T00:00:00Z",
  },

  // ── Romance ────────────────────────────────────────────────────────────
  {
    id: "tpl-coffee-shop",
    title: "Coffee-shop romance, late autumn",
    description:
      "Almost no dialogue. Two people, one window, one barista who notices.",
    category: "romance",
    duration_seconds: 60,
    style: "Cinematic",
    aspect: "16:9",
    script:
      "A 60-second romance. A coffee shop in late autumn. Two regulars sit at separate tables, never quite looking at each other. The barista notices. Over the course of a week, the barista subtly rearranges the seating until the two regulars are at the same table. They don't speak.",
    poster_url: POSTER("clevroy-tpl-coffee-shop"),
    preview_url: PREVIEW,
    created_at: "2026-03-28T00:00:00Z",
  },
  {
    id: "tpl-mom-song",
    title: "Birthday message for Mom",
    description:
      "A vertical short for the family chat. Set to her favorite song. Watch it twice.",
    category: "romance",
    duration_seconds: 30,
    style: "Cinematic",
    aspect: "9:16",
    script:
      "A 30-second vertical short, for sharing in a family group chat. A birthday message for Mom set to her favorite song. Use specific memories — the kitchen window, her car, the dog she gave the wrong name to. End on a still photo.",
    poster_url: POSTER("clevroy-tpl-mom"),
    preview_url: PREVIEW,
    created_at: "2026-03-22T00:00:00Z",
  },

  // ── Trailer ────────────────────────────────────────────────────────────
  {
    id: "tpl-noir-detective",
    title: "Noir detective finds a film camera",
    description:
      "The detective doesn't know what to do with it. The camera does.",
    category: "trailer",
    duration_seconds: 30,
    style: "Noir",
    aspect: "16:9",
    script:
      "A 30-second noir trailer. A detective in 1958 finds a film camera in a junkyard. He doesn't know what to do with it. He films the case anyway. The footage becomes evidence — and not the kind he expected. Cut on his face the moment he understands what he's seeing.",
    poster_url: POSTER("clevroy-tpl-detective"),
    preview_url: PREVIEW,
    featured: true,
    created_at: "2026-04-20T00:00:00Z",
  },

  // ── Short ──────────────────────────────────────────────────────────────
  {
    id: "tpl-mountain-three-takes",
    title: "Mountain expedition in three takes",
    description:
      "A climb told as three long held shots. Cut to silence between each.",
    category: "short",
    duration_seconds: 90,
    style: "Documentary",
    aspect: "16:9",
    script:
      "A 90-second short. A mountain expedition told in exactly three takes — basecamp at dawn, summit at noon, descent at dusk. Hold each shot longer than feels comfortable. Cut to silence between each. The summit shot has no people in it.",
    poster_url: POSTER("clevroy-tpl-mountain"),
    preview_url: PREVIEW,
    created_at: "2026-03-18T00:00:00Z",
  },
  {
    id: "tpl-paper-plane",
    title: "Animated short — paper plane finds its way home",
    description:
      "A paper plane crosses a city. Hand-drawn warmth, no dialogue, one note of music.",
    category: "short",
    duration_seconds: 45,
    style: "Animated",
    aspect: "16:9",
    script:
      "A 45-second animated short. A paper plane is folded by a child and thrown out a classroom window. It crosses a city — over a bus, through a market, past a wedding — and lands back at the same school, in the lap of a different child. Hand-drawn warmth.",
    poster_url: POSTER("clevroy-tpl-plane"),
    preview_url: PREVIEW,
    created_at: "2026-03-14T00:00:00Z",
  },

  // ── Music video ────────────────────────────────────────────────────────
  {
    id: "tpl-astronaut-postcard",
    title: "An astronaut gets a postcard from Earth",
    description:
      "A music video set in low orbit. The earth fits in one window. So does the postcard.",
    category: "music",
    duration_seconds: 60,
    style: "Cinematic",
    aspect: "16:9",
    script:
      "A 60-second music video. An astronaut on the International Space Station receives a postcard from Earth. The postcard shows the small town she grew up in. She looks out the window — Earth fits in one porthole, the postcard in the other. Set to instrumental indie folk.",
    poster_url: POSTER("clevroy-tpl-astronaut"),
    preview_url: PREVIEW,
    created_at: "2026-03-10T00:00:00Z",
  },
] as const;

export function templatesByCategory(
  category: TemplateCategory | "all",
): ReadonlyArray<Template> {
  if (category === "all") return TEMPLATES;
  return TEMPLATES.filter((t) => t.category === category);
}

export function templateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

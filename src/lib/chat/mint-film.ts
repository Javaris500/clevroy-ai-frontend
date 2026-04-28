// Layer 2 fixture mint. Layer 5 replaces this with a real
// `POST /api/films` call that mints a draft film_id server-side
// (Backend_Handoff §8.3). The 250ms delay simulates network latency
// so the optimistic-bubble path is exercised.

export async function mintFilm(): Promise<{ film_id: string }> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return { film_id: crypto.randomUUID() };
}

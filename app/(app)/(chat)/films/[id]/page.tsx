// /films/[id] — chat-thread surface. The visible surface is owned by
// the (chat) route group's layout in thread mode. This page is a stub.
//
// TODO(layer 5): hydrate `thread_messages` server-side here and pass
// the initial message array down to the layout (or a shared store)
// so the thread renders with full history on first paint. Until then
// the thread starts empty and only carries optimistic messages from
// the in-process Zustand store.

export default function FilmPage() {
  return null;
}

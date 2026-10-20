export type EpicGame = {
  id: string;
  title: string;
  image: string | null;
  url: string;
  seller: string | null;
  offerType: string | null;
  originalPrice: string | null;
  kind: "promotion" | "upcoming" | "free_to_play";
  start: string | null;
  end: string | null;
};

export type EpicSnapshot = {
  fetchedAt: string;
  source: string;
  promotions: EpicGame[];
  upcoming: EpicGame[];
  freeToPlay: EpicGame[];
};

export function partitionEpic(snapshot: EpicSnapshot, now = Date.now()) {
  const timed = [...snapshot.promotions, ...snapshot.upcoming];
  const current: EpicGame[] = [];
  const upcoming: EpicGame[] = [];
  for (const game of timed) {
    const start = game.start ? Date.parse(game.start) : NaN;
    const end = game.end ? Date.parse(game.end) : NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && now >= start && now < end) current.push(game);
    else if (Number.isFinite(start) && now < start) upcoming.push(game);
  }
  current.sort((a, b) => Date.parse(a.end ?? "") - Date.parse(b.end ?? ""));
  upcoming.sort((a, b) => Date.parse(a.start ?? "") - Date.parse(b.start ?? ""));
  return {
    current,
    upcoming,
    freeToPlay: snapshot.freeToPlay
  };
}

export type Rating = "unsure" | "understood";
export type Ratings = Record<string, Rating>;
export function rateCard(ratings: Ratings, cardId: string, rating: Rating): Ratings { return { ...ratings, [cardId]: rating }; }
export function ratingCounts(ratings: Ratings) { return Object.values(ratings).reduce((counts, rating) => { counts[rating] += 1; return counts; }, { unsure: 0, understood: 0 }); }
export function boundedIndex(index: number, delta: number, length: number) { return Math.min(Math.max(index + delta, 0), Math.max(length - 1, 0)); }

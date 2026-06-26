export const GAME_IDS = ['flashcards', 'nback', 'match-pairs', 'dictsaber'] as const;
export type GameId = typeof GAME_IDS[number];

export const GAMES_COUNT = GAME_IDS.length;

export const SectRank = {
  Outer: 'Candidate',
  Inner: 'Member',
  Core: 'Elite',
  Elder: 'Lieutenant',
  Leader: 'Leader',
} as const;

export type SectRank = typeof SectRank[keyof typeof SectRank];

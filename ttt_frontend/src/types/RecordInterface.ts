export default interface LeaderboardData {
  leaderboardData: RecordData[];
}

interface RecordData {
  userId: string;
  rank: number;
  score: number;
  subscore: number;
  metadata: {
    won: number;
    draw: number;
    lost: number;
    fast: number;
    slow: number;
  };
}

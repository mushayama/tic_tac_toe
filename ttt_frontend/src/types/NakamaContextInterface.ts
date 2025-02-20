import { MatchData } from "@heroiclabs/nakama-js";
import Nakama from "../lib/nakama";
import LeaderboardData from "./RecordInterface";

export interface NakamaContextInterface {
  nakama: Nakama | null;
  authenticate: () => Promise<void>;
  getDisplayName: () => Promise<string | undefined>;
  setDisplayName: (name: string) => Promise<void>;
  healthcheck: () => Promise<void>;
  findMatchUsingMatchmaker: (fast: boolean) => Promise<void>;
  cancelMatchmakerTicket: () => Promise<void>;
  getUserId: () => string;
  getOpponentName: () => Promise<string | undefined>;
  setMatchDataCallback: (
    matchDataCallback: (matchData: MatchData) => void
  ) => void;
  writeRecord: (result: string, fast: boolean) => Promise<void>;
  getRecords: () => Promise<LeaderboardData>;
  makeMove: (index: number) => Promise<void>;
  disconnect: () => void;
}

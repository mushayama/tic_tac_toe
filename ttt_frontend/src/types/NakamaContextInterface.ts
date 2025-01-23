import { MatchData } from "@heroiclabs/nakama-js";
import Nakama from "../lib/nakama";

export interface NakamaContextInterface {
  nakama: Nakama | null;
  authenticate: () => Promise<void>;
  getDisplayName: () => Promise<string | undefined>;
  setDisplayName: (name: string) => Promise<void>;
  healthcheck: () => Promise<void>;
  findMatchUsingMatchmaker: () => Promise<void>;
  cancelMatchmakerTicket: () => Promise<void>;
  getUserId: () => string;
  getOpponentName: () => string;
  setMatchDataCallback: (
    matchDataCallback: (matchData: MatchData) => void
  ) => void;
  makeMove: (index: number) => Promise<void>;
  disconnect: () => void;
}

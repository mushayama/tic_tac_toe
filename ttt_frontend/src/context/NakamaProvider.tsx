import { ReactNode, useEffect, useState } from "react";
import Nakama from "../lib/nakama";
import { NakamaContext } from "./NakamaContext";
import { MatchData } from "@heroiclabs/nakama-js";

export const NakamaProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [nakama, setNakama] = useState<Nakama | null>(null);

  useEffect(() => {
    const nakamaInstance = new Nakama();
    setNakama(nakamaInstance);
  }, []);

  const authenticate = async () => {
    if (nakama) {
      await nakama.authenticate();
    }
  };

  const getDisplayName = async (): Promise<string | undefined> => {
    if (nakama) {
      return await nakama.getDisplayName();
    } else throw new Error("Nakama instance not found");
  };

  const setDisplayName = async (name: string) => {
    if (nakama) {
      await nakama.setDisplayName(name);
    } else throw new Error("Nakama instance not found");
  };

  const healthcheck = async () => {
    if (nakama) {
      await nakama.healthcheck();
    } else {
      throw new Error("Nakama instance not found");
    }
  };

  const findMatchUsingMatchmaker = async () => {
    if (nakama) {
      await nakama.findMatchUsingMatchmaker();
    } else {
      throw new Error("Nakama instance not found");
    }
  };

  const cancelMatchmakerTicket = async () => {
    if (nakama) {
      await nakama.cancelMatchmakerTicket();
    } else {
      throw new Error("Nakama instance not found");
    }
  };

  const getUserId = (): string => {
    if (nakama) {
      return nakama.getUserId();
    } else {
      throw new Error("Did not get user id");
    }
  };

  const getOpponentName = (): string => {
    if (nakama) {
      return nakama.getOpponentName();
    } else {
      throw new Error("Nakama instance not found");
    }
  };

  const setMatchDataCallback = (
    matchDataCallback: (matchData: MatchData) => void
  ) => {
    if (nakama) {
      nakama.setMatchDataCallback(matchDataCallback);
    } else throw new Error("Nakama instance not found");
  };

  const makeMove = async (index: number) => {
    if (nakama) {
      await nakama.makeMove(index);
    } else throw new Error("Nakama instance not found");
  };

  const disconnect = () => {
    if (nakama) {
      nakama.disconnect(true);
      setNakama(null);
    }
  };

  return (
    <NakamaContext.Provider
      value={{
        nakama,
        authenticate,
        getDisplayName,
        setDisplayName,
        healthcheck,
        findMatchUsingMatchmaker,
        cancelMatchmakerTicket,
        getUserId,
        getOpponentName,
        setMatchDataCallback,
        makeMove,
        disconnect,
      }}
    >
      {children}
    </NakamaContext.Provider>
  );
};

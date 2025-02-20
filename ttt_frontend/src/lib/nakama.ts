import {
  Client,
  MatchData,
  MatchmakerMatched,
  Session,
  Socket,
} from "@heroiclabs/nakama-js";
import { v4 as uuid } from "uuid";
import LeaderboardData from "../types/RecordInterface";
import {
  NakamaHandlerError,
  NakamaResponseError,
  SessionError,
} from "../Errors";

class Nakama {
  private client: Client;
  private session: Session | null = null;
  private socket: Socket | null = null;
  private useSSL: boolean = false;
  private displayName: string | undefined = undefined;
  private noOfPlayers: number = 2;
  private ticket: string | null = null;
  private matchId: string | null = null;
  private opponentName: string | undefined = undefined;
  private opponentId: string | null = null;

  private DEVICE_ID_KEY = "deviceId";
  private USER_ID_KEY = "userId";

  constructor() {
    this.client = new Client("defaultkey", "34.60.79.173", "7350", this.useSSL);
  }

  async authenticate(): Promise<void> {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = uuid();
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }

    try {
      this.session = await this.client.authenticateDevice(deviceId, true);
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Error creating session");
    }

    if (!this.session.user_id)
      throw new NakamaResponseError("Unexpected behaviour: user Id missing");
    localStorage.setItem(this.USER_ID_KEY, this.session.user_id);

    try {
      const trace = false;
      this.socket = this.client.createSocket(this.useSSL, trace);
      await this.socket.connect(this.session, true);
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Error connecting websocket");
    }
  }

  disconnect(fireDisconnectEvent: boolean = true) {
    if (this.socket) this.socket.disconnect(fireDisconnectEvent);
  }

  async getDisplayName(): Promise<string | undefined> {
    if (!this.session || !this.socket) throw new SessionError();

    try {
      if (this.displayName) return this.displayName;

      const account = await this.client.getAccount(this.session);

      if (!account.user)
        throw new NakamaResponseError("User missing in account response");
      this.displayName = account.user.display_name;
      return account.user.display_name;
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Unable to fetch account data");
    }
  }

  async setDisplayName(name: string): Promise<void> {
    const rpcid = "update_display_name";
    if (!this.session || !this.socket) {
      throw new SessionError();
    }
    try {
      await this.client.rpc(this.session, rpcid, {
        display_name: name,
      });
      this.displayName = name;
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Unable to update display name");
    }
  }

  async healthcheck(): Promise<void> {
    if (!this.socket || !this.session) throw new SessionError();
    if (!this.displayName) throw new Error("User display name missing");

    const rpcid = "healthcheck";
    try {
      await this.client.rpc(this.session, rpcid, {});
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError(
        "Healthcheck failed. Problem with server connection."
      );
    }
  }

  async findMatchUsingMatchmaker(fast: boolean): Promise<void> {
    if (!this.session || !this.socket) throw new SessionError();

    this.opponentName = undefined;
    this.opponentId = null;
    const query = `+properties.fast:${String(fast)}`;
    const stringProperties = {
      fast: String(fast),
    };
    try {
      this.socket.onmatchmakermatched = (matched: MatchmakerMatched) => {
        if (!this.session || !this.socket) return;

        const homePlayerId = this.session.user_id;
        const opponent = matched.users.find(
          (user) => user.presence.user_id !== homePlayerId
        );
        if (!opponent || !opponent.presence) {
          console.error("Opponent data invalid");
          return;
        }

        this.socket.joinMatch(matched.match_id).then(
          (match) => {
            this.matchId = match.match_id;
            this.opponentId = opponent.presence.user_id;
            this.getOpponentDisplayName().then((opponentName) => {
              this.opponentName = opponentName;
            });
          },
          () => {
            console.error("Unable to join match");
          }
        );
      };

      const ticket = await this.socket.addMatchmaker(
        query,
        this.noOfPlayers,
        this.noOfPlayers,
        stringProperties
      );
      this.ticket = ticket.ticket;
      console.debug("match requested: ", ticket);
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Unable to use matchmaker");
    }
  }

  async getOpponentDisplayName(): Promise<string | undefined> {
    if (!this.session || !this.socket) throw new SessionError();
    if (!this.opponentId) throw new Error("OpponentId not present");

    try {
      const response = await this.client.getUsers(this.session, [
        this.opponentId,
      ]);

      if (!response.users || response.users.length === 0)
        throw new NakamaResponseError("Users not present in response");
      return response.users[0].display_name;
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Unable to fetch user data");
    }
  }

  async cancelMatchmakerTicket(): Promise<void> {
    if (!this.session || !this.socket) throw new SessionError();
    if (!this.ticket) return;
    try {
      await this.socket.removeMatchmaker(this.ticket);
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Problem cancelling matchmaker ticket");
    }
  }

  getUserId(): string {
    if (!this.session || !this.socket) throw new SessionError();
    if (!this.session.user_id) throw new Error("User id not found");
    return this.session.user_id;
  }

  async getOpponentName(): Promise<string | undefined> {
    if (!this.opponentName) {
      try {
        const name = await this.getOpponentDisplayName();
        this.opponentName = name;
      } catch (err) {
        console.error(err);
        throw new NakamaHandlerError("Unable to get opponent name");
      }
    }
    return this.opponentName;
  }

  setMatchDataCallback(matchDataCallback: (matchData: MatchData) => void) {
    if (!this.socket) throw new SessionError();
    this.socket.onmatchdata = matchDataCallback;
  }

  async writeRecord(result: string, fast: boolean): Promise<void> {
    if (!this.session || !this.socket) throw new SessionError();
    const rpcid = "update_leaderboard";

    try {
      await this.client.rpc(this.session, rpcid, {
        result: result,
        fast: fast,
      });
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Error updating user record to leaderboard");
    }
  }

  async getRecords(): Promise<LeaderboardData> {
    if (!this.session || !this.socket) throw new SessionError();
    const rpcid = "get_leaderboard_data";

    try {
      const response = await this.client.rpc(this.session, rpcid, {
        userId: this.session.user_id,
        opponentId: this.opponentId,
      });
      console.debug(response);

      if (
        typeof response === "object" &&
        response !== null &&
        response.payload !== undefined &&
        typeof response.payload === "object"
      ) {
        const safeParsedJson = response.payload as LeaderboardData;

        safeParsedJson.leaderboardData.sort((a, b) => a.rank - b.rank);
        console.debug(safeParsedJson);
        return safeParsedJson;
      } else throw new NakamaResponseError("Invalid response");
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError(
        "Error fetching user records from leaderboard"
      );
    }
  }

  async makeMove(index: number): Promise<void> {
    if (!this.session || !this.socket || !this.matchId) {
      throw new SessionError();
    }
    const data = { position: index };
    try {
      await this.socket.sendMatchState(this.matchId, 4, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      throw new NakamaHandlerError("Error sending match state");
    }
  }
}

export default Nakama;

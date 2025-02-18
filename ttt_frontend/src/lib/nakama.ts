import {
  Client,
  MatchData,
  MatchmakerMatched,
  Session,
  Socket,
} from "@heroiclabs/nakama-js";
import { v4 as uuid } from "uuid";
import LeaderboardData from "../types/RecordInterface";

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

  constructor() {
    this.client = new Client(
      "defaultkey",
      "192.168.97.107",
      "7350",
      this.useSSL
    );
  }

  async authenticate(): Promise<void> {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuid();
      localStorage.setItem("deviceId", deviceId);
    }

    try {
      this.session = await this.client.authenticateDevice(deviceId, true);
    } catch (err) {
      console.error(err);
      throw new Error("Error creating session");
    }

    if (!this.session.user_id)
      throw new Error("Unexpected behaviour: user Id missing");
    localStorage.setItem("userId", this.session.user_id);

    try {
      const trace = false;
      this.socket = this.client.createSocket(this.useSSL, trace);
      await this.socket.connect(this.session, true);
    } catch (err) {
      console.error(err);
      throw new Error("Error connecting websocket");
    }
  }

  disconnect(fireDisconnectEvent: boolean = true) {
    if (this.socket) this.socket.disconnect(fireDisconnectEvent);
  }

  async getDisplayName(): Promise<string | undefined> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");

    try {
      if (this.displayName) return this.displayName;

      const account = await this.client.getAccount(this.session);

      if (!account.user) throw new Error("User missing in account response");
      this.displayName = account.user.display_name;
      return account.user.display_name;
    } catch (err) {
      console.error(err);
      throw new Error("Unable to fetch account data");
    }
  }

  async setDisplayName(name: string): Promise<void> {
    const rpcid = "update_display_name";
    if (!this.session || !this.socket) {
      throw new Error("Session or socket is not found");
    }
    try {
      await this.client.rpc(this.session, rpcid, {
        display_name: name,
      });
      this.displayName = name;
    } catch (err) {
      console.error(err);
      throw new Error("Unable to update display name");
    }
  }

  async healthcheck(): Promise<void> {
    if (!this.socket || !this.session)
      throw new Error("Nakama socket or session missing");
    if (!this.displayName) throw new Error("User display name missing");

    const rpcid = "healthcheck";
    try {
      await this.client.rpc(this.session, rpcid, {});
    } catch (err) {
      console.error(err);
      throw new Error("Healthcheck failed. Problem with server connection.");
    }
  }

  async findMatchUsingMatchmaker(fast: boolean): Promise<void> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket not found");

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
            this.getUserDisplayName(opponent.presence.user_id).then(
              (opponentName) => {
                this.opponentName = opponentName;
              }
            );
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
      throw new Error("Unable to use matchmaker");
    }
  }

  async getUserDisplayName(userId: string): Promise<string | undefined> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");

    try {
      const response = await this.client.getUsers(this.session, [userId]);

      if (!response.users || response.users.length === 0)
        throw new Error("Users not present in response");
      return response.users[0].display_name;
    } catch (err) {
      console.error(err);
      throw new Error("Unable to fetch user data");
    }
  }

  async cancelMatchmakerTicket(): Promise<void> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");
    if (!this.ticket) return;
    try {
      await this.socket.removeMatchmaker(this.ticket);
    } catch (err) {
      console.error(err);
      throw new Error("Problem cancelling matchmaker ticket");
    }
  }

  getUserId(): string {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");
    if (!this.session.user_id) throw new Error("User id not found");
    return this.session.user_id;
  }

  getOpponentName(): string {
    if (!this.opponentName) throw new Error("opponent name not found");
    return this.opponentName;
  }

  setMatchDataCallback(matchDataCallback: (matchData: MatchData) => void) {
    if (!this.socket) throw new Error("socket not found");
    this.socket.onmatchdata = matchDataCallback;
  }

  async writeRecord(result: string, fast: boolean): Promise<void> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");
    const rpcid = "update_leaderboard";

    try {
      await this.client.rpc(this.session, rpcid, {
        result: result,
        fast: fast,
      });
    } catch (err) {
      console.error(err);
      throw new Error("Error updating user record to leaderboard");
    }
  }

  async getRecords(): Promise<LeaderboardData> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket is not found");
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
      } else throw new Error("Invalid response");
    } catch (err) {
      console.error(err);
      throw new Error("Error updating user record to leaderboard");
    }
  }

  async makeMove(index: number): Promise<void> {
    if (!this.session || !this.socket || !this.matchId) {
      throw new Error("Session, socket or matchId not found");
    }
    const data = { position: index };
    try {
      await this.socket.sendMatchState(this.matchId, 4, JSON.stringify(data));
    } catch (err) {
      console.error(err);
      throw new Error("Error sending match state");
    }
  }
}

export default Nakama;

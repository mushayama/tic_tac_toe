import {
  Client,
  MatchData,
  MatchmakerMatched,
  Session,
  Socket,
} from "@heroiclabs/nakama-js";
import { v4 as uuid } from "uuid";

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

  constructor() {
    this.client = new Client("defaultkey", "127.0.0.1", "7350", this.useSSL);
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

  async findMatchUsingMatchmaker(): Promise<void> {
    if (!this.session || !this.socket)
      throw new Error("Session or socket not found");

    const query = "*";
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
        this.noOfPlayers
      );
      this.ticket = ticket.ticket;
      console.log("match requested: ", ticket);
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

  // async createMatch(): Promise<void> {
  //   if (!this.socket || !this.session) return;
  //   const match = await this.socket.createMatch();
  //   console.log("Match created:", match.match_id);
  // }

  // async findMatch(ai: boolean = false): Promise<void> {
  //   const rpcid = "find_match";
  //   if (!this.session || !this.socket) {
  //     console.log("Session or socket not found");
  //     return;
  //   }
  //   try {
  //     const matches = await this.client.rpc(this.session, rpcid, {
  //       fast: false,
  //       ai: ai,
  //     });
  //     console.log(matches);

  //     if (typeof matches === "object" && matches !== null) {
  //       const safeParsedJson = matches as {
  //         payload: {
  //           matchIds: string[];
  //         };
  //       };
  //       this.matchId = safeParsedJson.payload.matchIds[0];
  //       const response = await this.socket.joinMatch(this.matchId!);
  //       console.log("Matched joined!: ", response);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

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

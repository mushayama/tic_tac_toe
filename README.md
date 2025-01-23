a deployable multiplayer Tic-Tac-Toe game using react.js and Nakama backend with Go plugins

# project requirements

- Install Nakama with PostgreSQL as the database. Create custom Go plugins for Nakama that control the server logic.
- Implement device-based authentication. Generate JWT tokens to securely authenticate users.
- Establish a WebSocket connection between the client and Nakama server to manage real-time communication.
- Implement server-authoritative multiplayer mode to control and update the state of the Tic-Tac-Toe game. Ensure that the server manages the game state rather than relying on the client.
- Create a matchmaking mechanism to allow 2 players to join a game. Use matchmaking tokens for the players and implement queuing for 2 different game modes.
- Implement a leaderboard system that tracks the ranking and performance of players.
- Deploy the Nakama server and game to Google Cloud. Ensure that the server is scalable and can handle multiple simultaneous games.

# to-do

- add leaderboard functionality
- complete result page on react side
- finish logic loop on react side
- add multiple game modes including ai
- furnish ui
- final cleanup
- google cloud deployment

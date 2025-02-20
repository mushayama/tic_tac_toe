a deployable multiplayer Tic-Tac-Toe game using react.js and Nakama backend with Go plugins

# project requirements

- Install Nakama with PostgreSQL as the database. Create custom Go plugins for Nakama that control the server logic.
- Implement device-based authentication. Generate JWT tokens to securely authenticate users.
- Establish a WebSocket connection between the client and Nakama server to manage real-time communication.
- Implement server-authoritative multiplayer mode to control and update the state of the Tic-Tac-Toe game. Ensure that the server manages the game state rather than relying on the client.
- Create a matchmaking mechanism to allow 2 players to join a game. Use matchmaking tokens for the players and implement queuing for 2 different game modes.
- Implement a leaderboard system that tracks the ranking and performance of players.
- Deploy the Nakama server and game to Google Cloud. Ensure that the server is scalable and can handle multiple simultaneous games.

# result

- Front-end: A react-js web app built with vite. It utilises React Context API to hold context of a nakama instance throughout the app.
- Back-end: A golang plugin utilising docker-compose to deploy it with a postgres image and remote nakama apis.
- We utilise device authentication. We generate uuid (universally unique identifier) and save it on the local local storage. This is browser specific local storage and handled at frontend.
- All nakama functions and calls, including game logic, are made through backend with the frontend nakama context serving as bridge.
- nakama maintains its session by a websocket by itself within the frontend context.
- We utilise nakama Matchmaker to match players instead of implementing it by ourselves. We provide two game modes: fast and slow, with varying time per move. Matchmaker sorts these two types of games by itself.
- We have implemented a leaderboard that displays upto 5 ranks on the result page of a match. The 5 ranks are the 2 users and whoever the other 3 top rankers are.
- Deployed this on gcp temporarily. Created a VM on GCE (google compute engine) where we hosted the built distribution of react and hosted those static files through nginx. For the backend, I uploaded the whole repo to the VM, installed docker and docker-compose and deployed the docker-stack much like on local machine with a couple small changes that have been added as comments in the backend repo.

module tictactoe.com/backend

go 1.23.3 // commented this out on gcp vm cause the go version there was lower than this and this one was not available. Had no issues

require (
	github.com/heroiclabs/nakama-common v1.35.0
	google.golang.org/protobuf v1.35.2
)

require github.com/heroiclabs/nakama-project-template v0.0.0-20250110122259-8b47f7a50ac2

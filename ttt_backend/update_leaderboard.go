package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"math"

	"github.com/heroiclabs/nakama-common/runtime"
)

type GameResult int

const (
	WON GameResult = iota + 1
	LOST
	DRAW
)

func (r GameResult) String() string {
	return [...]string{"won", "lost", "draw"}[r-1]
}

func (r GameResult) EnumIndex() int {
	return int(r)
}

func (r *GameResult) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}

	switch s {
	case "won":
		*r = WON
	case "lost":
		*r = LOST
	case "draw":
		*r = DRAW
	default:
		return fmt.Errorf("invalid GameResult: %s, must be one of: 'won', 'lost', or 'draw'", s)
	}

	return nil
}

type RpcUpdateLeaderboardRequest struct {
	Result GameResult `json:"result"`
}

// func (r *RpcUpdateLeaderboardRequest) Validate() error {
// 	if r.Result != WON && r.Result != LOST && r.Result != DRAW {
// 		return fmt.Errorf("invalid result: %s, must be one of: 'won', 'lost', or 'draw'", r.Result)
// 	}
// 	return nil
// }

type RecordMetadata struct {
	Won  int `json:"won"`
	Draw int `json:"draw"`
	Lost int `json:"lost"`
}

type UpdateLeaderboardResponse struct {
	Success bool `json:"success"`
}

func rpcUpdateLeaderboard(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	logger.Debug("update leaderboard RPC called")

	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok {
		return "", errNoUserIdFound
	}
	username, ok := ctx.Value(runtime.RUNTIME_CTX_USERNAME).(string)
	if !ok {
		return "", errNoUserIdFound
	}
	leaderboardId := "tic-tac-toe"

	request := &RpcUpdateLeaderboardRequest{}
	logger.Debug(payload)
	if err := json.Unmarshal([]byte(payload), request); err != nil {
		return "", errUnmarshal
	}

	// if err := request.Validate(); err != nil {
	// 	return "", err
	// }

	won := 0
	lost := 0
	draw := 0
	if request.Result == WON {
		won++
	} else if request.Result == LOST {
		lost++
	} else {
		draw++
	}

	_, ownerRecords, _, _, err := nk.LeaderboardRecordsList(ctx, leaderboardId, []string{userId}, 5, "", 0)
	if err != nil {
		logger.Error("Error getting owner records", err)
		return "", errInternalError
	}

	if len(ownerRecords) == 1 {
		metadata := &RecordMetadata{}
		if err := json.Unmarshal([]byte(ownerRecords[0].Metadata), metadata); err != nil {
			return "", errUnmarshal
		}
		won += metadata.Won
		lost += metadata.Lost
		draw += metadata.Draw
	}

	_, err = nk.LeaderboardRecordWrite(ctx, leaderboardId, userId, username, int64(2*won+1*draw), int64(math.MaxInt-1*lost), map[string]interface{}{"won": won, "lost": lost, "draw": draw}, nil)
	if err != nil {
		logger.Error("Error setting owner records", err)
		return "", errInternalError
	}

	response, err := json.Marshal(UpdateLeaderboardResponse{Success: true})

	if err != nil {
		logger.Error("error marshaling response payload: %v", err.Error())
		return "", errMarshal
	}

	return string(response), nil
}

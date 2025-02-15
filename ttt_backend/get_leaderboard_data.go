package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

type RpcGetLeaderboardDataRequest struct {
	UserId     string `json:"userId"`
	OpponentId string `json:"opponentId"`
}

type GetLeaderboardDataResponse struct {
	LeaderboardData []RecordData `json:"leaderboardData"`
}

type RecordData struct {
	UserId   string         `json:"userId"`
	Rank     int            `json:"rank"`
	Score    int            `json:"score"`
	Subscore int            `json:"subscore"`
	Metadata RecordMetadata `json:"metadata"`
}

func rpcGetLeaderboardData(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	logger.Debug("get leaderboard data RPC called")

	userId, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok {
		return "", errNoUserIdFound
	}
	leaderboardId := "tic-tac-toe"

	request := &RpcGetLeaderboardDataRequest{}
	logger.Debug(payload)
	if err := json.Unmarshal([]byte(payload), request); err != nil {
		return "", errUnmarshal
	}

	if request.UserId != userId {
		logger.Error("userId not correct")
		return "", runtime.NewError("userId not correct", 3)
	}

	_, ownerRecords, _, _, err := nk.LeaderboardRecordsList(ctx, leaderboardId, []string{request.UserId, request.OpponentId}, 5, "", 0)
	if err != nil {
		logger.Error("Error getting leaderboard records", err)
		return "", errInternalError
	}
	if len(ownerRecords) != 2 {
		logger.Error("Inavlid number of records fetched: ", len(ownerRecords))
		return "", runtime.NewError("Invalid response", 3)
	}

	leaderboardData := make([]RecordData, 0, len(ownerRecords))

	for i := 0; i < len(ownerRecords); i++ {
		metadata := &RecordMetadata{}
		if err := json.Unmarshal([]byte(ownerRecords[i].Metadata), metadata); err != nil {
			return "", errUnmarshal
		}
		leaderboardData = append(leaderboardData,
			RecordData{
				UserId:   ownerRecords[i].OwnerId,
				Rank:     int(ownerRecords[i].Rank),
				Score:    int(ownerRecords[i].Score),
				Subscore: int(ownerRecords[i].Subscore),
				Metadata: *metadata,
			},
		)
	}

	response, err := json.Marshal(GetLeaderboardDataResponse{LeaderboardData: leaderboardData})
	if err != nil {
		logger.Error("error marshaling response payload: %v", err.Error())
		return "", errMarshal
	}

	return string(response), nil
}

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

	records, ownerRecords, _, _, err := nk.LeaderboardRecordsList(ctx, leaderboardId, []string{request.UserId, request.OpponentId}, 5, "", 0)
	if err != nil {
		logger.Error("Error getting leaderboard records", err)
		return "", errInternalError
	}
	if len(ownerRecords) != 2 {
		logger.Error("Inavlid number of records fetched: ", len(ownerRecords))
		return "", runtime.NewError("Invalid response", 3)
	}
	logger.Debug("records: %v", records)

	ownerData := make([]RecordData, 0, len(ownerRecords))

	for i := 0; i < len(ownerRecords); i++ {
		metadata := &RecordMetadata{}
		if err := json.Unmarshal([]byte(ownerRecords[i].Metadata), metadata); err != nil {
			return "", errUnmarshal
		}
		ownerData = append(ownerData,
			RecordData{
				UserId:   ownerRecords[i].OwnerId,
				Rank:     int(ownerRecords[i].Rank),
				Score:    int(ownerRecords[i].Score),
				Subscore: int(ownerRecords[i].Subscore),
				Metadata: *metadata,
			},
		)
	}

	topRankData := make([]RecordData, 0)
	for i := 0; i < len(records) && len(topRankData) < 3; i++ {
		if records[i].OwnerId != request.UserId && records[i].OwnerId != request.OpponentId {
			metadata := &RecordMetadata{}
			if err := json.Unmarshal([]byte(records[i].Metadata), metadata); err != nil {
				return "", errUnmarshal
			}
			topRankData = append(topRankData,
				RecordData{
					UserId:   records[i].OwnerId,
					Rank:     int(records[i].Rank),
					Score:    int(records[i].Score),
					Subscore: int(records[i].Subscore),
					Metadata: *metadata,
				},
			)
		}
	}

	leaderboardData := append(ownerData, topRankData...)
	userIds := make([]string, 0, len(leaderboardData))

	for i := 0; i < len(leaderboardData); i++ {
		userIds = append(userIds, leaderboardData[i].UserId)
	}

	logger.Debug("leaderboardData: %v", leaderboardData)
	logger.Debug("userIds: %v", userIds)

	users, err := nk.UsersGetId(ctx, userIds, nil)
	if err != nil {
		logger.Error("Error getting users: %v", err)
		return "", errInternalError
	}
	for i := 0; i < len(leaderboardData); i++ {
		for j := 0; j < len(users); j++ {
			if leaderboardData[i].UserId == users[j].Id {
				leaderboardData[i].UserId = users[j].DisplayName
				break
			}
		}
	}

	logger.Debug("leaderboardData: %v", leaderboardData)

	response, err := json.Marshal(GetLeaderboardDataResponse{LeaderboardData: leaderboardData})
	if err != nil {
		logger.Error("error marshaling response payload: %v", err.Error())
		return "", errMarshal
	}

	return string(response), nil
}

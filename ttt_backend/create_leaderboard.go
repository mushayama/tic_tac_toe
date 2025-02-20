package main

import (
	"context"

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
)

func createLeaderboard(nk runtime.NakamaModule) func(context.Context, runtime.Logger, *api.Event) {
	return func(ctx context.Context, logger runtime.Logger, evt *api.Event) {
		logger.Debug("Create Leaderboard called")

		leaderboardId := "tic-tac-toe"

		// "0 0 1 1 *" is a CRON format reset schedule, telling to reset at 12AM on 1st Jan of every year
		err := nk.LeaderboardCreate(ctx, leaderboardId, false, "desc", "set", "0 0 1 1 *", map[string]interface{}{
			"ai": false}, true)

		if err != nil {
			logger.Error("Error creating leaderboard")
			return
		}
	}
}

package main

import (
	"context"
	"database/sql"
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/encoding/protojson"
)

var (
	errInternalError = runtime.NewError("internal server error", 13) // INTERNAL
	errMarshal       = runtime.NewError("cannot marshal type", 13)   // INTERNAL
	// errNoInputAllowed      = runtime.NewError("no input allowed", 3)       // INVALID_ARGUMENT
	errNoUserIdFound       = runtime.NewError("no user ID in context", 3)  // INVALID_ARGUMENT
	errUnmarshal           = runtime.NewError("cannot unmarshal type", 13) // INTERNAL
	errUnableToCreateMatch = runtime.NewError("unable to create match", 13)
)

const (
	// rpcIdRewards            = "rewards"
	// rpcIdFindMatch          = "find_match"
	rpcIdHealthcheck        = "healthcheck"
	rpcIdUpdateDisplayName  = "update_display_name"
	rpcIdUpdateLeaderboard  = "update_leaderboard"
	rpcIdGetLeaderboardData = "get_leaderboard_data"
	// rpcIdStartAiMatch       = "start_ai_match"
)

func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	initStart := time.Now()

	marshaler := &protojson.MarshalOptions{
		UseEnumNumbers: true,
	}
	unmarshaler := &protojson.UnmarshalOptions{
		DiscardUnknown: false,
	}

	if err := initializer.RegisterRpc(rpcIdHealthcheck, rpcHealthcheck); err != nil {
		return err
	}

	// if err := initializer.RegisterRpc(rpcIdRewards, rpcRewards); err != nil {
	// 	return err
	// }

	// if err := initializer.RegisterRpc(rpcIdFindMatch, rpcFindMatch(marshaler, unmarshaler)); err != nil {
	// 	return err
	// }

	// if err := initializer.RegisterRpc(rpcIdStartAiMatch, rpcStartAiMatch(marshaler, unmarshaler)); err != nil {
	// 	return err
	// }

	if err := initializer.RegisterRpc(rpcIdUpdateDisplayName, rpcUpdateDisplayName(unmarshaler)); err != nil {
		return err
	}

	if err := initializer.RegisterRpc(rpcIdUpdateLeaderboard, rpcUpdateLeaderboard); err != nil {
		return err
	}

	if err := initializer.RegisterRpc(rpcIdGetLeaderboardData, rpcGetLeaderboardData); err != nil {
		return err
	}

	if err := initializer.RegisterMatch(moduleName, func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
		return &MatchHandler{
			marshaler:        marshaler,
			unmarshaler:      unmarshaler,
			tfServingAddress: "http://tf:8501/v1/models/ttt:predict",
		}, nil
	}); err != nil {
		return err
	}

	if err := registerSessionEvents(db, nk, initializer); err != nil {
		return err
	}

	if err := initializer.RegisterMatchmakerMatched(func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, entries []runtime.MatchmakerEntry) (string, error) {
		for _, e := range entries {
			logger.Info("Matched user '%s' named '%s'", e.GetPresence().GetUserId(), e.GetPresence().GetUsername())

			for k, v := range e.GetProperties() {
				logger.Info("Matched on '%s' value '%v'", k, v)
			}
		}

		properties := entries[0].GetProperties()

		var fast bool
		if properties["fast"] == nil {
			return "", runtime.NewError("fast property not found", 3)
		}
		if properties["fast"] == "true" {
			fast = true
		} else {
			fast = false
		}

		matchId, err := nk.MatchCreate(ctx, moduleName, map[string]interface{}{"invited": entries, "fast": fast})
		if err != nil {
			return "", errUnableToCreateMatch
		}

		return matchId, nil
	}); err != nil {
		logger.Error("unable to register matchmaker matched hook: %v", err)
		return err
	}

	logger.Info("Plugin loaded in '%d' msec.", time.Since(initStart).Milliseconds())
	return nil

	// err := initializer.RegisterRpc("healthcheck", RpcHealthcheck)
	// if err != nil {
	// 	return err
	// }

	// err2 := initializer.RegisterRpc("findMatch", RpcFindMatch)
	// if err2 != nil {
	// 	return err2
	// }

	// logger.Info("module loaded in %dms", time.Since(initStart).Milliseconds())
	// return nil
}

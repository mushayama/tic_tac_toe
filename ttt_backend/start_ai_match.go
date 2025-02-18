package main

// import (
// 	"context"
// 	"database/sql"

// 	"github.com/heroiclabs/nakama-common/runtime"
// 	"github.com/heroiclabs/nakama-project-template/api"
// 	"google.golang.org/protobuf/encoding/protojson"
// )

// func rpcStartAiMatch(marshaler *protojson.MarshalOptions, unmarshaler *protojson.UnmarshalOptions) nakamaRpcFunc {
// 	return func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
// 		_, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
// 		if !ok {
// 			return "", errNoUserIdFound
// 		}

// 		request := &api.RpcFindMatchRequest{}
// 		logger.Debug(payload)
// 		if err := unmarshaler.Unmarshal([]byte(payload), request); err != nil {
// 			return "", errUnmarshal
// 		}

// 		matchID, err := nk.MatchCreate(
// 			ctx, moduleName, map[string]interface{}{
// 				"ai": true, "fast": request.Fast})
// 		if err != nil {
// 			logger.Error("error creating match: %v", err)
// 			return "", errInternalError
// 		}

// 		response, err := marshaler.Marshal(&api.RpcFindMatchResponse{
// 			MatchIds: []string{matchID}})
// 		if err != nil {
// 			logger.Error("error marshaling response payload: %v", err.Error())
// 			return "", errMarshal
// 		}

// 		logger.Info("new AI match created %s", matchID)

// 		return string(response), nil
// 	}
// }

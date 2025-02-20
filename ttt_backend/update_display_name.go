package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/api"
	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/encoding/protojson"
)

type UpdateDisplayNameResponse struct {
	Success bool `json:"success"`
}

type nakamaRpcFunc func(context.Context, runtime.Logger, *sql.DB, runtime.NakamaModule, string) (string, error)

func rpcUpdateDisplayName(unmarshaler *protojson.UnmarshalOptions) nakamaRpcFunc {
	return func(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
		_, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
		if !ok {
			return "", errNoUserIdFound
		}

		request := &api.UpdateAccountRequest{}
		logger.Debug(payload)
		if err := unmarshaler.Unmarshal([]byte(payload), request); err != nil {
			return "", errUnmarshal
		}

		account, _ := nk.AccountGetId(ctx, ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string))

		account.User.DisplayName = request.DisplayName.Value

		if err := nk.AccountUpdateId(ctx, ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string), account.User.Username, make(map[string]interface{}), account.User.DisplayName, account.User.Timezone, account.User.Location, account.User.LangTag, account.User.AvatarUrl); err != nil {
			logger.Error("Error updating account: %v", err)
			return "", errInternalError
		}

		response, err := json.Marshal(UpdateDisplayNameResponse{Success: true})

		if err != nil {
			logger.Error("error marshaling response payload: %v", err.Error())
			return "", errMarshal
		}

		return string(response), nil
	}
}

FROM heroiclabs/nakama-pluginbuilder:3.25.0 AS builder

ENV GO111MODULE on
ENV CGO_ENABLED 1

WORKDIR /backend
COPY go.mod .
# made the following line:  *.go ./  on gcp vm cause of some error. it worked fine afterwords.
COPY *.go .
COPY vendor/ vendor/

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM heroiclabs/nakama:3.25.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY local.yml /nakama/data/
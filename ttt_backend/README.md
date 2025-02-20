# GoLang Nakama Plugin

## Golang installation

- Go can be easily installed by going to the go.dev website or maybe by other ways I dont know.
- managing the go versions though is more of a hassle mainly because the documentation isnt clear.
- when you download a specific version after the initial go download by:

  ```bash
  go install golang.org/dl/go1.23.3@latest
  ```

  it will get downloaded to $(go env GOPATH)/bin

  Which is most likely ~/go/bin

- after that add this to your $PATH: \$(go env GOPATH)/bin

  and now you can access the specific go version simply by:

  ```bash
  go1.23.3 version
  ```

## docker-compose:

- docker compose up:
  ```bash
  docker-compose up --build
  ```
- docker compose down:
  ```bash
  docker-compose down
  ```

## deploying to gcp gce vm:

- to deploy this to the VM, I simply uploaded this whole repo, installed docker and docker-compose on the VM and ran docker-compose as I would locally.
  ```bash
  sudo gcloud compute scp --recurse ./ttt_backend instance-20250220-133151:/home/marbab_arbab/project
  ```
- There were a 3 small changes I made that are marked as comments in Dockerfile, docker-compose.yml and go.mod

## nakama console:

login for nakama console:

- username: admin
- password: password

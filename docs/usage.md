---
title: Usage
description: producer.Config reference, logger adapters, and failure handling for kinesis-producer.
---

# Usage

## Installation

```sh
go get github.com/kinesis-producer-go/kinesis-producer
```

### Optional CBOR + gzip Kinesis client

The producer's `Client` field accepts the standard AWS SDK Kinesis client
interface. To keep the same imports while using the project-maintained
RPC v2 CBOR and gzip-enabled client, add this module replacement:

```sh
go mod edit --replace \
  github.com/aws/aws-sdk-go-v2/service/kinesis=github.com/kinesis-producer-go/aws-sdk-go-v2/service/kinesis@kinesis-rpcv2-cbor-gzip
go mod tidy
```

The first command uses the branch as a version query. `go mod tidy` resolves
its current tip to an immutable pseudo-version in `go.mod`; run both commands
again whenever you intentionally want to refresh to a newer branch tip.
Application imports and client construction remain unchanged.

See [CBOR + gzip transport](/cbor-gzip) for the improvements, defaults,
operational scope, and rollback command.

## Creating a producer

```go
client := kinesis.NewFromConfig(cfg)
pr := producer.New(&producer.Config{
	StreamName:   aws.String("test"),
	BacklogCount: 2000,
	Client:       client,
})

pr.Start()
```

`producer.New` panics if the config is invalid (for example, if neither `StreamARN` nor `StreamName` is set) — validation runs once, at construction time, not on every `Put`.

## Config reference

| Field | Type | Default | Notes |
|---|---|---|---|
| `StreamARN` | `*string` | — | Recommended over `StreamName`. Must match `arn:aws.*:kinesis:.*:\d{12}:stream/\S+`. |
| `StreamName` | `*string` | — | Must match `[a-zA-Z0-9_.-]+`. If both `StreamARN` and `StreamName` are set, the name must match the ARN's stream name suffix. |
| `FlushInterval` | `time.Duration` | `5s` | Regular interval for flushing the buffer. |
| `BatchCount` | `int` | `500` | Max items per `PutRecords` request. Cannot exceed 500. |
| `BatchSize` | `int` | `5MiB` | Max bytes per `PutRecords` request. Cannot exceed 5MiB. |
| `AggregateBatchCount` | `int` | `4294967295` | Max items packed into one aggregated record. |
| `AggregateBatchSize` | `int` | `50KB` | Max bytes packed into one aggregated record. Larger user records bypass aggregation. Cannot exceed 1MiB. |
| `BacklogCount` | `int` | `BatchCount` | Channel capacity before `Put` starts blocking. |
| `MaxConnections` | `int` | `24` | Concurrent `PutRecords` requests in flight. Must be between 1 and 256. |
| `Logger` | `*slog.Logger` | `slog.Default()` | See [logger adapters](#specifying-a-logger) below. |
| `Verbose` | `bool` | `false` | Logs a line per record on every flush (success and failure). |
| `Client` | `Putter` | — | Anything implementing `PutRecords`, typically `*kinesis.Client` from aws-sdk-go-v2. |

Either `StreamARN` or `StreamName` must be set, or `New` panics.

## Putting records

```go
if err := pr.Put([]byte("foo")); err != nil {
	log.Printf("error producing: %+v\n", err)
}
```

`Put` is thread-safe and asynchronous: it enqueues `data` and returns immediately. Records smaller than `AggregateBatchSize` are packed into KPL-aggregated records; larger ones (up to 1MiB) are sent as plain Kinesis records. The producer batches, retries transient `PutRecords` failures with backoff, and flushes on whichever comes first: `BatchCount`, `BatchSize`, or `FlushInterval`.

## Handling failures

Unrecoverable errors (for example, putting to a stream that doesn't exist) are not retried. Register a listener to receive them:

```go
go func() {
	for r := range pr.NotifyFailures() {
		// r contains `Data`, `PartitionKey`, and `Error()`
		log.Printf("failure record: %+v\n", r)
	}
}()
```

If you never call `NotifyFailures`, undeliverable records are dropped after the retry loop gives up.

## Stopping

```go
pr.Stop()
```

`Stop` flushes any in-flight/aggregated data, waits for outstanding `PutRecords` calls to complete, and closes the failure channel (if registered). No `Put` calls are accepted after `Stop`.

## Specifying a logger

`producer.Config.Logger` takes any `*slog.Logger`.

### Standard library handler

```go
logger := slog.New(
	slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelError,
	}),
)
pr := producer.New(&producer.Config{
	StreamName:   aws.String("test"),
	BacklogCount: 2000,
	Client:       client,
	Logger:       logger,
})
```

### logrus

```go
import (
	producer "github.com/kinesis-producer-go/kinesis-producer"
	sloglogrus "github.com/samber/slog-logrus/v2"
	"github.com/sirupsen/logrus"
)

logrusLogger := logrus.New()
logger := slog.New(sloglogrus.Option{Level: slog.LevelError, Logger: logrusLogger}.NewLogrusHandler())

pr := producer.New(&producer.Config{
	StreamName:   aws.String("test"),
	BacklogCount: 2000,
	Client:       client,
	Logger:       logger,
})
```

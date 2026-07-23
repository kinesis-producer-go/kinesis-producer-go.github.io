---
title: CBOR + gzip transport
description: Use the project-maintained AWS SDK for Go V2 Kinesis client fork to send PutRecords requests with Smithy RPC v2 CBOR and gzip.
---

# CBOR + gzip transport

`kinesis-producer` normally works with the upstream AWS SDK for Go V2 Kinesis
client. For applications where producer-to-Kinesis wire size matters, the
project also maintains an optional
[Kinesis client fork](https://github.com/kinesis-producer-go/aws-sdk-go-v2/tree/kinesis-rpcv2-cbor-gzip).

The fork preserves the upstream package path and public Go API. A module
replacement is therefore enough to opt in; producer configuration and
application imports do not change.

## Enable the fork

Run these commands in the application that consumes `kinesis-producer`:

```sh
go mod edit --replace \
  github.com/aws/aws-sdk-go-v2/service/kinesis=github.com/kinesis-producer-go/aws-sdk-go-v2/service/kinesis@kinesis-rpcv2-cbor-gzip
go mod tidy
```

The branch name in the first command is a Go version query. The second command
resolves its current commit and writes an immutable pseudo-version to
`go.mod`, for example:

```go
replace github.com/aws/aws-sdk-go-v2/service/kinesis => github.com/kinesis-producer-go/aws-sdk-go-v2/service/kinesis v0.0.0-20260723090400-265bd3a48161
```

The committed module remains reproducible; it does not silently follow a
moving branch. To intentionally update to a newer branch tip, run the same
two commands again and review the resulting `go.mod` and `go.sum` diff.

## What the replacement improves

| Area | Upstream Kinesis client | Optional fork |
|---|---|---|
| Request and response protocol | AWS JSON 1.1 | [Smithy RPC v2 CBOR](https://smithy.io/2.0/additional-specs/protocols/smithy-rpc-v2.html) |
| Record `Data` in the request document | JSON base64 text | Native CBOR byte string |
| `PutRecords` request compression | No generated compression middleware at the fork's upstream baseline | Generated gzip request compression |
| Go package path and API | `github.com/aws/aws-sdk-go-v2/service/kinesis` | Unchanged through `replace` |
| KPL aggregation and consumer format | KPL-compatible protobuf record | Unchanged |

### Native binary record data

AWS JSON protocols represent blob fields as base64 text. Base64 adds roughly
one byte for every three input bytes before JSON document overhead. RPC v2
CBOR represents Smithy blob fields as native CBOR byte strings, so a
payload-dominated `PutRecords` request avoids that expansion.

This changes only the SDK request document. The `Data` supplied to the
producer, the KPL protobuf aggregate, its checksum, and the logical records
accepted by Kinesis remain byte-for-byte the same.

### Batch-level gzip

The fork declares gzip request compression for `PutRecords`. When clients are
constructed through `config.LoadDefaultConfig` and
`kinesis.NewFromConfig`, the AWS SDK's standard defaults apply:

- request compression is enabled unless
  `AWS_DISABLE_REQUEST_COMPRESSION=true`;
- the request body is compressed when its serialized size is at least
  10,240 bytes;
- `AWS_REQUEST_MIN_COMPRESSION_SIZE_BYTES` can change that inclusive
  threshold.

The threshold applies to the complete serialized `PutRecords` body, not to
each user record. Batching and KPL aggregation mean a request can cross the
threshold even when its individual logical records are small. Compression
ratios still depend on the data: repeated fields and similar records benefit
more, while already-compressed or high-entropy payloads benefit less.

These settings are documented in the
[AWS SDK request-compression reference](https://docs.aws.amazon.com/sdkref/latest/guide/feature-compression.html).

## Application code stays the same

Continue using the upstream import path:

```go
import (
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	producer "github.com/kinesis-producer-go/kinesis-producer"
)

cfg, err := config.LoadDefaultConfig(ctx)
if err != nil {
	return err
}

client := kinesis.NewFromConfig(cfg)
pr := producer.New(&producer.Config{
	StreamARN: streamARN,
	Client:    client,
})
```

`producer.Config.Client` only requires the `PutRecords` method, so no adapter
or producer-library fork is needed.

## Scope and operational boundary

- This is a `kinesis-producer-go` project fork, not an official AWS SDK
  release.
- The generated Kinesis client uses RPC v2 CBOR only; it does not fall back to
  AWS JSON.
- The complete Kinesis client is generated, compiled, and covered by generated
  protocol snapshots. Live service acceptance is focused on `PutRecords`,
  which is the operation this producer uses.
- The fork changes client-to-service transport bytes. Do not assume it changes
  Kinesis record sizes after request decoding, stream capacity accounting, or
  downstream consumer and delivery costs.
- Treat a branch refresh like any dependency upgrade: inspect the resolved
  pseudo-version and run the application's tests before deployment.

Go intentionally converts branch queries into canonical versions; see the
[Go module reference](https://go.dev/ref/mod#versions) for the version-query
and pseudo-version behavior.

## Verify the selected client

After `go mod tidy`, inspect the replacement:

```sh
go list -m -json github.com/aws/aws-sdk-go-v2/service/kinesis
```

The output should contain a `Replace` object whose path is
`github.com/kinesis-producer-go/aws-sdk-go-v2/service/kinesis` and whose
version is an immutable pseudo-version.

## Roll back

Remove the replacement and restore the upstream Kinesis module:

```sh
go mod edit -dropreplace github.com/aws/aws-sdk-go-v2/service/kinesis
go mod tidy
```

No source-code import changes are needed in either direction.

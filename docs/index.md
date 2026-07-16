---
title: KPL-compatible Kinesis producer for Go
titleTemplate: kinesis-producer
description: A KPL-like batch producer for Amazon Kinesis, built on the AWS SDK for Go V2, using the same aggregation format as the KPL.
layout: home

hero:
  name: kinesis-producer
  text: A KPL-like batch producer for Amazon Kinesis
  tagline: Built on the official AWS SDK for Go V2, using the same aggregation format the KPL uses.
  image:
    src: /logo.svg
    alt: kinesis-producer aggregation logo
  actions:
    - theme: brand
      text: Usage
      link: /usage
    - theme: alt
      text: Aggregation Format
      link: /aggregation-format
    - theme: alt
      text: View on GitHub
      link: https://github.com/kinesis-producer-go/kinesis-producer

features:
  - title: KPL-compatible aggregation
    details: Packs multiple user records into a single Kinesis record using the same protobuf aggregation format as the Amazon KPL, so consumers using KCL deaggregation work unmodified.
  - title: AWS SDK for Go V2
    details: Built directly on aws-sdk-go-v2, no JVM/KPL daemon or CGo dependency to run alongside your Go process.
  - title: Batching & backpressure built in
    details: Configurable batch size/count, flush interval, backlog capacity, and concurrent PutRecords connections, with automatic retry and backoff on transient failures.
  - title: Pluggable logging
    details: Takes any slog.Logger, with drop-in adapters shown for the standard library and logrus.
---

## Quick start

```go
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	producer "github.com/kinesis-producer-go/kinesis-producer"
)

func main() {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConns = 20
	transport.MaxIdleConnsPerHost = 20
	httpClient := &http.Client{
		Transport: transport,
	}
	cfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion("us-west-2"), config.WithHTTPClient(httpClient))
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}
	client := kinesis.NewFromConfig(cfg)
	pr := producer.New(&producer.Config{
		StreamName:   aws.String("test"),
		BacklogCount: 2000,
		Client:       client,
	})

	pr.Start()

	// Handle failures
	go func() {
		for r := range pr.NotifyFailures() {
			// r contains `Data`, `PartitionKey` and `Error()`
			log.Printf("failure record: %+v\n", r)
		}
	}()

	for i := 0; i < 5000; i++ {
		if err := pr.Put([]byte("foo")); err != nil {
			log.Printf("error producing: %+v\n", err)
			time.Sleep(1 * time.Second)
		}
	}

	time.Sleep(1 * time.Minute)
	pr.Stop()
}
```

See [Usage](/usage) for the full `producer.Config` reference and logger adapters, or [Aggregation Format](/aggregation-format) for the on-wire record layout.

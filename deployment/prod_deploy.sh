#!/bin/bash
export _ENV="prod"
export SERVICE_NAME="${_ENV}-telemetry"
export PROJECT_ID="ascentfs-sg-live"
export MAX_INSTANCES=5
export MIN_INSTANCES=0
export APP_REGION="asia-southeast1"
export APP_SERVICE_ACCOUNT="ascentfs-server-access@ascentfs-sg-live.iam.gserviceaccount.com"
export VPC_CONNECTOR=""
export VPC_NETWORK="vpc-instance1-ascentfs"
export VPC_SUBNET="vpc-subnet-singapore"
bash ./deployment/utils/gcloud_run.sh
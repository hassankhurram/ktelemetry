#!/bin/bash
export _ENV="eng01"
export SERVICE_NAME="${_ENV}-telemetry"
export PROJECT_ID="one-constellation-dev"
export MAX_INSTANCES=5
export MIN_INSTANCES=0
export APP_REGION="asia-southeast1"
export APP_SERVICE_ACCOUNT="oc-dev-server-access@one-constellation-dev.iam.gserviceaccount.com"
export VPC_CONNECTOR=""
export VPC_NETWORK="one-constellation-dev-vpc"
export VPC_SUBNET="one-constellation-dev-vpc"

bash ./deployment/utils/gcloud_run.sh
#!/bin/bash
export _ENV="scb"
export SERVICE_NAME="${_ENV}-telemetry"
export PROJECT_ID="one-constellation-scb"
export MAX_INSTANCES=5
export MIN_INSTANCES=0
export APP_REGION="asia-southeast1"
export APP_SERVICE_ACCOUNT="oc-scb-server-access@one-constellation-scb.iam.gserviceaccount.com"
export VPC_CONNECTOR=""
export VPC_NETWORK="one-constellation-scb-vpc"
export VPC_SUBNET="one-constellation-scb-sg"

bash ./deployment/utils/gcloud_run.sh
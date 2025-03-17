#!/bin/bash
export _ENV="local"
export SERVICE_NAME="${_ENV}-telemetry"
export PROJECT_ID="fund-leads-dev"
export MAX_INSTANCES=5
export MIN_INSTANCES=0
export APP_REGION="asia-southeast1"
export APP_SERVICE_ACCOUNT="app-access@fund-leads-dev.iam.gserviceaccount.com"
export VPC_CONNECTOR=""
export VPC_NETWORK="default"
export VPC_SUBNET="default"

bash ./deployment/utils/gcloud_run.sh
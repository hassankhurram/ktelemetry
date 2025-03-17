#!/bin/bash

# Print the environment variable
echo "Deploying for ${_ENV}"

# Remove the existing .env file if it exists
rm -f .env 
npm i 
# Generate a new environment configuration
node ./deployment/utils/create_env_json.js ${_ENV}

# Copy the environment file for the current environment
cp ./deployment/envs/${_ENV}.env .env

# Create a temporary file for the environment variables
temp_env_file=$(mktemp)
rm $temp_env_file
cat env.json > "$temp_env_file"
rm env.json

# Copy the service account file for the current environment
cp ./deployment/service_accounts/${_ENV}_service_account.json service_account.json

# Define a unique tag for the deployment
unique_tag="t$(date +%s)"

# Define a unique revision suffix
revision_suffix="rev-$(date +%Y%m%d%H%M%S)"

# Deploy the application using gcloud run deploy

# exit;

gcloud auth login hassan.khurram@heuristicsol.com

gcloud run deploy ${SERVICE_NAME} --source . \
                    --platform=managed \
                    --project="${PROJECT_ID}" \
                    --max-instances=${MAX_INSTANCES} \
                    --min-instances=${MIN_INSTANCES} \
                    --cpu=2 \
                    --memory=1G \
                    --allow-unauthenticated \
                    --execution-environment="gen2" \
                    --tag="${unique_tag}" \
                    --revision-suffix="${revision_suffix}" \
                    --description="Deployed at $(date)" \
                    --region="${APP_REGION}" \
                    --service-account=${APP_SERVICE_ACCOUNT} \
                    --network=${VPC_NETWORK} \
                    --subnet=${VPC_SUBNET} \
                    --network-tags="telemetry-service" \
                    --vpc-egress=private-ranges-only \
                    --vpc-connector="${VPC_CONNECTOR}" \
                    --env-vars-file="$temp_env_file" \
                    --quiet

# Remove the temporary environment variables file
rm $temp_env_file
rm service_account.json
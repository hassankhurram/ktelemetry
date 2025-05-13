import { configDotenv } from "dotenv";

import util from "util";

configDotenv();

const { PROJECT_ENV, SERVICE_NAME, CLOUD_PROVIDER, PROJECT_ID } = process.env;

import { stateManager } from "./stateManager.js";

import { BigQuery } from "@google-cloud/bigquery";

import { Logging } from "@google-cloud/logging";

import fs from "fs";

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : JSON.parse(fs.readFileSync("./service_account.json"));

const _projectId = process.env.PROJECT_ID; // serviceAccount.project_id;


const bigquery = new BigQuery({
  projectId: _projectId,
  credentials: serviceAccount,
});

async function createDatasetIfNotExists(datasetId, location) {
  if (stateManager.getState(`dataset_created:${datasetId}`)) {
    //console.log(`Dataset ${datasetId} already created.`);
    return;
  }

  try {
    await bigquery
      .dataset(datasetId, {
        location,
      })
      .create();

    console.log(`Dataset ${datasetId} created.`);

    stateManager.setState(`dataset_created:${datasetId}`, true);
  } catch (error) {
    if (error.code === 409) {
      console.log(`Dataset ${datasetId} in ${location} already exists.`);
      stateManager.setState(`dataset_created:${datasetId}`, true);
    } else {
      console.error(`Error creating dataset ${datasetId}:`, error);
    }
  }
  return;
}

async function createTableIfNotExists(datasetId, location, tableName) {
  try {
    const dataset = bigquery.dataset(datasetId);

    // Check if the table already exists
    const [tables] = await dataset.getTables();
    const tableExists = tables.some((table) => table.id === tableName);

    if (tableExists) {
      stateManager.setState(`table_created:${tableName}`, true);
      console.log(`Table ${tableName} already exists in dataset ${datasetId}.`);
      return;
    }

    // Define the schema
    const schema = [
      { name: "log_id", type: "STRING", mode: "REQUIRED" },
      { name: "event_name", type: "STRING", mode: "REQUIRED" },
      { name: "service", type: "STRING", mode: "REQUIRED" },
      { name: "region", type: "STRING", mode: "NULLABLE" },
      { name: "source_identifier", type: "STRING", mode: "REQUIRED" },
      { name: "status", type: "BOOLEAN", mode: "REQUIRED" },
      {
        name: "browser",
        type: "RECORD",
        mode: "REQUIRED",
        fields: [
          { name: "url", type: "STRING", mode: "NULLABLE" },
          { name: "browser_time", type: "STRING", mode: "NULLABLE" },
          { name: "useragent", type: "STRING", mode: "NULLABLE" },
          { name: "userip", type: "STRING", mode: "NULLABLE" },
          { name: "user_location", type: "STRING", mode: "NULLABLE" },
        ],
      },
      {
        name: "action",
        type: "RECORD",
        mode: "REQUIRED",
        fields: [
          { name: "type", type: "STRING", mode: "REQUIRED" },
          {
            name: "details",
            type: "RECORD",
            mode: "REQUIRED",
            fields: [
              { name: "api_tag", type: "STRING", mode: "REQUIRED" },
              { name: "method", type: "STRING", mode: "REQUIRED" },
              { name: "url", type: "STRING", mode: "REQUIRED" },
              { name: "params", type: "JSON", mode: "NULLABLE" },
              { name: "body", type: "JSON", mode: "NULLABLE" },
              { name: "headers", type: "JSON", mode: "NULLABLE" },
              { name: "http_code", type: "INT64", mode: "REQUIRED" },
              { name: "response_identifier", type: "STRING", mode: "NULLABLE" },
            ],
          },
        ],
      },
      {
        name: "actor",
        type: "RECORD",
        mode: "REQUIRED",
        fields: [
          { name: "type", type: "STRING", mode: "REQUIRED" },
          {
            name: "user",
            type: "RECORD",
            mode: "NULLABLE",
            fields: [{ name: "id", type: "STRING", mode: "NULLABLE" }],
          },
          {
            name: "entity",
            type: "RECORD",
            mode: "NULLABLE",
            fields: [{ name: "id", type: "STRING", mode: "NULLABLE" }],
          },
          { name: "additional_info", type: "JSON", mode: "NULLABLE" },
        ],
      },
      {
        name: "file_details",
        type: "RECORD",
        mode: "NULLABLE",
        fields: [
          { name: "file_name", type: "STRING", mode: "REQUIRED" },
          { name: "function_name", type: "STRING", mode: "REQUIRED" },
        ],
      },
      {
        name: "api_response",
        type: "RECORD",
        mode: "NULLABLE",
        fields: [
          { name: "http_status_code", type: "INT64", mode: "REQUIRED" },
          { name: "http_error_response", type: "STRING", mode: "REQUIRED" },
        ],
      },
      { name: "descriptive_info", type: "STRING", mode: "NULLABLE" },
      {
        name: "log_severity",
        type: "STRING",
        mode: "NULLABLE",
        description: "Log severity, defaults to INFO",
      },
      { name: "time_in_msec", type: "INT64", mode: "REQUIRED" },
      { name: "time_out_msec", type: "INT64", mode: "REQUIRED" },
      {
        name: "time_api_delay",
        type: "INT64",
        mode: "NULLABLE",
        defaultValue: 0,
      },
      { name: "timestamp", type: "TIMESTAMP", mode: "NULLABLE" },
    ];

    // Create the table
    await dataset.createTable(tableName, { schema, location });

    console.log(
      `Table ${tableName} created successfully in dataset ${datasetId}.`
    );
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
  }
}

// Example usage:

async function insertDataBigQuery(datasetId, serviceName, region, log) {
  // Instantiate a BigQuery client
  const tableName = `${serviceName}-${region}`;
  // await bigquery.dataset(datasetId).table(tableName).delete();
  if (!stateManager.getState(`dataset_created:${datasetId}`)) {
    await createDatasetIfNotExists(datasetId, region);
  }

  if (!stateManager.getState(`table_created:${tableName}`)) {
    await createTableIfNotExists(datasetId, region, tableName);
  }

  // Define the table ID

  try {
    // Insert rows into the table
    await bigquery
      .dataset(datasetId)
      .table(tableName, {
        location: region,
      })
      .insert([log], {});

   // console.log(`Inserted into table ${tableName}.`);
  } catch (error) {
    // Handle errors during the insertion
    // if (error.name === "PartialFailureError") {
    //   console.error("Some rows failed to insert:");
    //   for (const err of error.errors.errors) {
    //     console.error("Insert error:", err);
    //   }
    // } else {
    //   console.error("Error inserting rows:", error);
    // }
    console.log(error)
  }
}

const logging = new Logging({
  keyFilename: "service_account.json",
  projectId: PROJECT_ID,
});

async function sendLogsToGCPLogger(values) {
  try {
    const log = logging.log(
      `projects/${PROJECT_ID}/logs/${PROJECT_ENV}_${values.service}`,
      {
        removeCircular: true,
      }
    );

    const logConfiguration = {
      severity: values.log_severity,
      labels: {
        app: values.service + "_logs",
      },
    };
    const entry = log.entry(logConfiguration, values);
    await log.write(entry);

    console.log(values.event_name);
  } catch (error) {
    console.error(error);
  }
}



export { sendLogsToGCPLogger, insertDataBigQuery };

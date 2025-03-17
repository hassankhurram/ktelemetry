"use strict";
import { BaseController } from "./baseController.js";
import Debugger from "../utils/debugger.js";
import Joi from "joi";
import { sendLogsToGCPLogger, insertDataBigQuery } from "../utils/logHelper.js";
import { SlackBot } from "../utils/slackbot.js";
import { getUserIp, convertTimestampToMicroseconds, formatTimestamp, formatMilliseconds, replaceEmptyObjectsWithNull  } from "../utils/utils.js";
import { BigQuery } from "@google-cloud/bigquery";
import reportGenerator from "../utils/reportGenerator.js";
import fs from "fs";
import { randomUUID } from "crypto";

const defaultLocation = "asia-southeast1";
const _datasetId = `telemetry_${process.env.PROJECT_ENV}`;
export class LogsController extends BaseController {
  constructor() {
    super();
  }

  /*
    SAMPLE DATA:

        {
            "event_name": "GET_ENTITY_DOMAINS",
            "service": "oc_portal",
            "source_identifier": "gcp_prod_oc_portal",
            "status": true,
            "browser": {
                "url": "https://portal.one-constellation.com/domains/",
                "useragent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                "userip": "192.168.1.1",
                "user_location": "US"
            },
            "action": {
                "type": "API_REQUEST",
                "details": {
                    "api_tag": "GET_ENTITY_DOMAINS",
                    "method": "GET",
                    "url": "https://api.one-constellation.com/domains/get/1230u213912-123-12-3-1234-12-",
                    "params": {
                        "accountId": "12345678-1234-1234-1234-123456789012"
                    },
                    "body": {},
                    "headers": {},
                    "http_code": 200,
                    "response_identifier": ""
                }
            },
            "actor": {
                "type": "entity",
                "entity": {
                    "id": "12345678-1234-1234-1234-123456789012"
                },
                "user":{
                    "id":"12345678-1234-1234-1234-123456789012"
                }
            },
            "file_details": {
                "file_name": "components/domains.tsx",
                "function_name": "getUsersDomains()"
            },
            "log_severity": "INFO", 
            "time_in_msec": 1688114200000,
            "time_out_msec": 1688114260000
        }
   */

  static async ingestLogs(req, res) {
    const userIp = getUserIp(req);
    //SlackBot.sendMessage("IP: " + userIp + " | Url: " + req.url);

    // Attach to req object
    req.user_ip = userIp;
    res.event_name = req.body.event_name;
    try {
      const apiRequest = Joi.object({
        type: Joi.string().required(),
        details: Joi.object({
          api_tag: Joi.string().required(),
          method: Joi.string()
            .valid("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
            .required(),
          url: Joi.string().uri().required(),
          params: Joi.object().unknown(true),
          body: Joi.object().unknown(true),
          headers: Joi.object().unknown(true),
          http_code: Joi.number().required(),
          response_identifier: Joi.string().allow("").optional(),
        }).required(),
      }).unknown(true);

      const actorSchema = Joi.object({
        type: Joi.string().required(),
        entity: Joi.object({
          id: Joi.string().guid().required(),
        })
          .unknown(true)
          .optional(),
        additional_info: Joi.object().unknown(true).optional(),
      }).unknown(true);

      const schema = Joi.object({
        event_name: Joi.string().required(),
        service: Joi.string().required(),
        region: Joi.string().allow("").optional(),
        source_identifier: Joi.string().required(),
        status: Joi.boolean().required(),
        browser: Joi.object({
          url: Joi.string().uri().allow("").optional(),
          browser_time: Joi.string().allow("").optional(),
          useragent: Joi.any().allow("").optional(), // to be removed
          userip: Joi.any().allow("").optional(), // to be removed
          user_location: Joi.any().allow("").optional(), // to be removed
        }).required(),
        action: apiRequest.required(),
        actor: actorSchema.required(),
        file_details: Joi.object({
          file_name: Joi.string().required(),
          function_name: Joi.string().required(),
        }).optional(),
        api_response: Joi.object({
          http_status_code: Joi.number().required(),
          http_error_response: Joi.string().required(),
        })
          .unknown(true)
          .optional(),
        descriptive_info: Joi.string().allow("").optional(),
        log_severity: Joi.string()
          .valid("INFO", "WARN", "ERROR", "FATAL")
          .optional()
          .default("INFO"),
        time_in_msec: Joi.number().required(),
        time_out_msec: Joi.number().required(),
        time_api_delay: Joi.number().optional().default(0),
        timestamp: Joi.number().optional().default(Date.now()),
      });

      if (req.body) {
        if (!req.body.browser) req.body.browser = {};

        req.body.browser.userip = userIp;

        if (req.body.time_out_msec && req.body.time_in_msec) {
          req.body.time_api_delay =
            req.body.time_out_msec - req.body.time_in_msec;
        }

        if (req.body.api_response.http_error_response) {
          if (typeof req.body.api_response.http_error_response === "object") {
            req.body.api_response.http_error_response = JSON.stringify(
              req.body.api_response.http_error_response
            );
          }
        }
      }

      const { error, value } = schema.validate(req.body);

      value.action.details.params =
        Object.keys(value.action.details.params ?? {}).length === 0
          ? null
          : JSON.stringify(value.action.details.params);
      value.action.details.headers =
        Object.keys(value.action.details.headers ?? {}).length === 0
          ? null
          : JSON.stringify(value.action.details.headers);
      value.action.details.body =
        Object.keys(value.action.details.body ?? {}).length === 0
          ? null
          : JSON.stringify(value.action.details.body);
      value.api_response.http_error_response = value.api_response
        .http_error_response
        ? value.api_response.http_error_response
        : null;
      value.actor.additional_info =
        Object.keys(value.actor.additional_info ?? {}).length === 0
          ? null
          : JSON.stringify(value.actor.additional_info);
      value.file_details.function_name =
        value.file_details.function_name ?? null;
      value.descriptive_info = value.descriptive_info ?? null;

      //console.log(" req.body.browser.userip", req.body.browser.userip)

      // value.time_in_msec = LogsController.convertTimestampToMicroseconds(
      //   value.time_in_msec
      // );

      // value.time_out_msec = LogsController.convertTimestampToMicroseconds(
      //   value.time_out_msec
      // );

      value.timestamp = convertTimestampToMicroseconds(
        value.timestamp
      );

      const filteredValues = replaceEmptyObjectsWithNull(value);
      filteredValues.log_id = randomUUID();

      if (error) {
        SlackBot.sendMessage(
          `[ERROR] Validation failed for: \`${
            value.event_name
          }\` from ${userIp} \`\`\`on: ${
            value.browser.url ?? value.action.details.url
          } ${JSON.stringify(error.message, null, 4)}\`\`\``
        );

        console.error("Validation error:", error.details);
        console.error("for: " + value.browser.url ?? value.action.details.url);
        BaseController.failedResponse(res, error.message, 400);
      } else {
        await insertDataBigQuery(
          _datasetId,
          value.service,
          value.region ?? defaultLocation,
          filteredValues
        );
        await sendLogsToGCPLogger(value);
        // SlackBot.sendMessage(`[INFO] Logged: \`${value.event_name}\``)
        return BaseController.successResponse(res, { response: "logged" });
      }
    } catch (error) {
      SlackBot.sendMessage(
        `[ERROR] Code error for: \`${req.body.event_name}\``
      );
      return Debugger.throw(res, "logsController.js", "ingestLogs", error);
    }
  }

  static async showLogs(req, res) {
    try {
      BaseController.successResponse(res, {});
    } catch (error) {
      return Debugger.throw(res, "logsController.js", "ingestLogs", error);
    }
  }

  static async generateReport(req, res) {
    try {
      const schema = Joi.object({
        service: Joi.string().required(),
        region: Joi.string().required(),
        // day_interval: Joi.number().required(),
        date: Joi.date().iso().allow("").optional(),
        type: Joi.string()
          .valid("BY_LATENCIES", "BY_ENTITIES", "BY_IP")
          .required(),
      });

      const { error, value } = schema.validate(req.body);

      if (error) {
        console.log("error", error);
        return BaseController.failedResponse(res, error.message, 400);
      }

      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : JSON.parse(fs.readFileSync("./service_account.json"));

      const _projectId = process.env.PROJECT_ID; // serviceAccount.project_id;

      const bigquery = new BigQuery({
        projectId: _projectId,
        credentials: serviceAccount,
      });

      switch (value.type) {
        case "BY_LATENCIES": {
          const data = await LogsController.getLatenciesByEvent(
            bigquery,
            value,
            res
          );

          if (data.length === 0) {
            return BaseController.failedResponse(res, "No data found", 404);
          }

          const headers = Object.keys(data[0]).map((header) => {
            return header.replace(/SECONDS/g, "(sec)").toUpperCase();
          });

          const parsedData = data.map((row) => {
            const values = Object.values(row);
            return values;
          });

          const humanReadAbleDate = new Date(
            value.date ?? new Date()
          ).toDateString();
          const report = await reportGenerator.generateReport(
            {
              headers,
              data: parsedData,
              date: humanReadAbleDate,
            },
            "report_api_latencies"
          );

          return BaseController.successResponse(
            res,
            {
              file: report.toString("base64"),
              date: humanReadAbleDate,
            }
          );
        }
        default:
          return BaseController.failedResponse(res, "Invalid type", 400);
      }
    } catch (error) {
      return Debugger.throw(res, "logsController.js", "generateReport", error);
    }
  }

  static async getLatenciesByEvent(bigquery, value, res) {
    try {
      const tableName = `${value.service}-${value.region}`;
      const dateFilter = value.date
        ? `DATE("${new Date(value.date).toISOString().split("T")[0]}")`
        : "CURRENT_DATE()";

      const query = `WITH ranked_events AS (
                        SELECT 
                          event_name,
                          action.details.url as api_url,
                          time_api_delay / 1000 AS latency_secs,
                          -- actor.entity.id AS entity_id,
                          status,
                          timestamp,
                          browser.userip as browserip,
                          log_id,
                          ROW_NUMBER() OVER (
                            PARTITION BY event_name 
                            ORDER BY time_api_delay DESC
                          ) AS rank,
                          MIN(time_api_delay ) OVER (PARTITION BY event_name) AS min_latency_msecs,
                          AVG(time_api_delay ) OVER (PARTITION BY event_name) AS avg_latency_msecs,
                          MAX(time_api_delay ) OVER (PARTITION BY event_name) AS max_latency_msecs
                        FROM 
                          \`${bigquery.projectId}.${_datasetId}.${tableName}\`
                        WHERE
                          status = true
                        AND
                          DATE(timestamp) = ${dateFilter}
                      )
                      SELECT 
                        event_name as \`EVENT NAME\`,
                        -- api_url as \`API URL\`,
                        max_latency_msecs as \`MAX LATENCY\`,
                        avg_latency_msecs as \`AVG LATENCY\`,
                        min_latency_msecs as \`MIN LATENCY\`,
                        -- entity_id, 
                        timestamp as \`TIMESTAMP\`,
                        browserip as \`USER IP\`,
                        log_id as \`MAX LAG LOG ID\`
                      FROM 
                        ranked_events
                      WHERE 
                        rank = 1
                      ORDER BY 
                        max_latency_msecs DESC
                      LIMIT 10000;`;
      const options = {
        query: query,
        location: value.region,
      };

      const [job] = await bigquery.createQueryJob(options);
      console.log(`Job ${job.id} started.`);
      const [rows] = await job.getQueryResults();
      console.log("got rows");
      for (const row of rows) {
        row.TIMESTAMP = row.TIMESTAMP.value
          ? formatTimestamp((new Date(row.TIMESTAMP.value)).toISOString())
          : null;
        row["MAX LATENCY"] = row["MAX LATENCY"]
          ? formatMilliseconds(row["MAX LATENCY"])
          : null;
        row["AVG LATENCY"] = row["AVG LATENCY"]
          ? formatMilliseconds(row["AVG LATENCY"])
          : null;
        row["MIN LATENCY"] = row["MIN LATENCY"]
          ? formatMilliseconds(row["MIN LATENCY"])
          : null;
        row[
          "MAX LAG LOG ID"
        ] = `<a href="${process.env.SERVER_URL}/logs/api/explorelog?log_id=${row["MAX LAG LOG ID"]}&service=${value.service}&region=${value.region}">${row["MAX LAG LOG ID"]}</a>`;
      }

      return rows;
    } catch (error) {
      return Debugger.throw(res, "logsController.js", "generateReport", error);
    }
  }
  static async getSpecificEntry(req, res) {
    try {
      const schema = Joi.object({
        service: Joi.string().required(),
        region: Joi.string().required(),
        log_id: Joi.string().uuid().required(),
      });

      const { error, value } = schema.validate(req.query);

      if (error) {
        console.error(error.message);
        return BaseController.failedResponse(res, "Validation Failed", 400);
      }

      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : JSON.parse(fs.readFileSync("./service_account.json"));

      const _projectId = process.env.PROJECT_ID; // serviceAccount.project_id;

      const bigquery = new BigQuery({
        projectId: _projectId,
        credentials: serviceAccount,
      });

      const tableName = `${value.service}-${value.region}`;
      const dateFilter = value.date
        ? `DATE("${new Date(value.date).toISOString().split("T")[0]}")`
        : "CURRENT_DATE()";

      const query = `SELECT * FROM \`${bigquery.projectId}.${_datasetId}.${tableName}\` WHERE log_id = '${value.log_id}';`;

      const options = {
        query: query,
        location: value.region,
      };

      const [job] = await bigquery.createQueryJob(options);
      console.log(`Job ${job.id} started.`);
      const [rows] = await job.getQueryResults();

      return BaseController.successResponse(res, rows);
    } catch (error) {
      return Debugger.throw(res, "logsController.js", "getSpecificLogs", error);
    }
  }


}

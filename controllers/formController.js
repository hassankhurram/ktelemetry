"use strict";
import { BaseController } from "./baseController.js";
import Debugger from "../utils/debugger.js";
import { getUserIp } from "../utils/utils.js";
import Reports from "../utils/reportGenerator.js";
import { sendEmail, sendEmailWithTemplate } from "../utils/emailHelper.js";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import AdmZip from "adm-zip";

const defaultLocation = "asia-southeast1";
const _datasetId = `telemetry_${process.env.PROJECT_ENV}`;

export class FormController extends BaseController {
  constructor() {
    super();
  }
  static async showForm(req, res) {
    try {
      const formFile = fs.readFileSync("./templates/oc_checklist.html");
      return res.send(formFile.toString());
    } catch (error) {
      Debugger.log(error);
      return BaseController.failedResponse(
        res,
        "An error occurred while rendering the form"
      );
    }
  }
  static async processForm(req, res) {
    try {
      const contextId = Math.random().toString(36).substring(7);
      const userIp = getUserIp(req);
      const files = req.files;
      const formData = req.body;
      const filesKeys = Object.keys(req.files);

      for (let file of filesKeys) {
        let contents = files[file];
        let i = 1;
        for (let content of contents) {
          content.newName = `${content.fieldname}_${i++}_${
            content.originalname
          }`;
          content.filedata = content.buffer.toString("base64");
        }
      }

      formData.files = {};

      formData.classTypes = JSON.parse(formData.classTypes || "[]");

      for (let file of filesKeys) {
        formData.files[file] = files[file].map((f) => {
          return {
            newName: f.newName,
            // content: f.buffer,
          };
        });
      }

      if (!fs.existsSync(`/tmp/${contextId}`)) {
        fs.mkdirSync(`/tmp/${contextId}`);
      }

      const { htmlContent, randomName } = await Reports.generateDocument(
        contextId,
        {
          OC_CHECKLIST_FORMDATA: `i*/${JSON.stringify(formData)}/*i`,
        },
        "oc_checklist"
      );

      const checklistFile = fs.readFileSync(randomName);

      const emailData = {
        subject: "Checklist Form Submission",
        html: `<p>Form submitted from IP: ${userIp}</p>`,
        attachments: [],
      };

      // store the files in tmp folder in contextId folder

      for (let file of filesKeys) {
        let contents = files[file];
        let i = 1;
        for (let content of contents) {
          fs.writeFileSync(
            `/tmp/${contextId}/${content.newName}`,
            content.buffer
          );
        }
      }

      // zip the files
      const zip = new AdmZip();
      const filesPath = fs.readdirSync(`/tmp/${contextId}`);
      for (let file of filesPath) {
        zip.addLocalFile(`/tmp/${contextId}/${file}`);
      }
      zip.writeZip(`/tmp/${contextId}/files.zip`);

      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : JSON.parse(fs.readFileSync("./service_account.json"));
      const storage = new Storage({
        projectId: serviceAccount.project_id,
        credentials: serviceAccount,
      });
      const bucket = storage.bucket(process.env.BUCKET_NAME);
      const checkListFiles = `checklistData/${contextId}/files.zip`;
      const checkListPDF = `checklistData/${contextId}/checklist.pdf`;

      await bucket.upload(`/tmp/${contextId}/files.zip`, {
        destination: checkListFiles,
        gzip: true,
      });

      await bucket.upload(`/tmp/${contextId}/checklist.pdf`, {
        destination: checkListPDF,
        gzip: true,
      });

      // generate bucket link for files.zip

      const [checkListFilesMetadata] = await bucket
        .file(checkListFiles)
        .getMetadata();
      const [checkListPDFMetadata] = await bucket
        .file(checkListPDF)
        .getMetadata();

      //generate signed url which can be sent over the email with no expiry
      const checkListFilesLink = await bucket
        .file(checkListFiles)
        .getSignedUrl({
          action: "read",
          expires: "03-09-2491",
        });
      const checkListPDFLink = await bucket.file(checkListPDF).getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });

      emailData.attachments.push({
        filename: `${contextId}_checklist.pdf`,
        content: checklistFile.toString("base64"),
      });

      emailData.templateId = "";
      emailData.templateVars = {
        contextId,
        form: JSON.stringify(formData),
        checkListPDFLink,
        checkListFilesLink,
      };

      const body = `<!DOCTYPE html>
    <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>One Constellation</title>
      <style>
         @import url('https://fonts.googleapis.com/css2?family=Tahoma:wght@300;400&display=swap');
         body {
            font-family: 'Calibri', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
         }
         .email-container {
            background-color: white;
            max-width: 600px;
            margin: 20px auto; /* Added margin for spacing */
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid #d5d5d5; /* Added grey border */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Optional subtle shadow */
         }
         .header {
            background-color: #151846;
            text-align: center;
            padding: 20px;
         }
         .header img {
            width: 150px;
            height: auto;
            display: block;
            margin: 0 auto;
         }
          .content {
         padding: 30px;
         background: linear-gradient(to right, #baccca, #d9d9d9, #baccca);
      }

      .card {
         background-color: #ffffff;
         border-radius: 0 0 4px 4px;
         font-size:18px;
         padding: 15px;
         text-align: left;
      }
         .footer {
         background-color: #d5d5d5;
         padding: 20px;
         text-align: center;
         font-size: 14px;
         color: #043768;
      }

      .footer p {
         margin: 0;
      }

      .footer a {
         color: #043768;
         text-decoration: none;
      }
      </style>
   </head>
   <body>
      <div class="email-container">
         <!-- Header -->
         <div class="header">
            <img src="https://storage.googleapis.com/ascentfs-media-public/public-data/application/oc_logo_sm.png" alt="One Constellation Logo">
         </div>
         <!-- Content -->
         <div class="content">
         <div class="card">
            <p>Dear User,</p>
            <p>Thank you for submitting your onboarding form and required documents. Please take a moment to review your submission by accessing the provided link below:</p> <br>
              <p style="text-align:center;text-decoration: solid;text-transform: uppercase;-webkit-mask-clip: text;border-style: solid; border-color:#406e9d"><a clicktracking=off href="${checkListFilesLink}">Click here to download checklist files</a></p>
            <p>If you need to make any changes or have any questions, please reach out to us.</p>
            <p><br>Regards,<br><b>One Constellation Team</b></p>
         </div>
          </div>
         <!-- Footer -->
         <div class="footer">
            <p>This is a system-generated email, please do not reply.</p>
            <p>Feel free to contact us at <b>support@one-constellation.com</b></p>
      </div>
      </div>
   </body>
</html>`;
      console.log(JSON.stringify(formData));
      const emails = process.env.SUPPORT_EMAILS.includes(",") ? process.env.SUPPORT_EMAILS.split(",") : [process.env.SUPPORT_EMAILS];
      const response = await sendEmail(
        emailData.subject,
        emails,
        body,
        emailData.attachments
      );
      console.log(response);
      return BaseController.successResponse(res, "Form submitted successfully");
    } catch (error) {
      Debugger.log(error);
      return BaseController.failedResponse(
        res,
        "An error occurred while processing the form"
      );
    }
  }
}

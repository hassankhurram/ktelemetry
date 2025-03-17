import puppeteer from "puppeteer";
import fs from "fs";
import pkg from 'hbs';
const { handlebars } = pkg;

export default class reports {
  static async generateReport({headers, data, date}, templateFileName) {

    const randomName = `/tmp/${Math.random().toString(36).substring(7)}.pdf`;
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true, // Ensure Puppeteer runs in headless mode
      protocolTimeout: 60000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Reduces shared memory issues
        "--disable-gpu", // Disable GPU acceleration (optional)
        "--single-process", // Avoid multi-process issues (optional)
      ],
    });

    // Open a new page
    const page = await browser.newPage();
    const template = fs.readFileSync(`./templates/${templateFileName}.html`, "utf8");
    const compiledTemplate = handlebars.compile(template);
    const htmlContent = compiledTemplate({ headers, data, date });
 
    await page.setContent(htmlContent,{ waitUntil: "networkidle0" });

    // Generate the PDF
    await page.pdf({
      path: randomName,
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
      printBackground: true,
    });


    // Close the browser
    await browser.close();
    const file = fs.readFileSync(randomName);
    fs.unlinkSync(randomName);
    return file;
  }

  static async generateDocument(contextId, data, templateFileName) {

    if(!contextId || !data || !templateFileName) {
      throw new Error("Missing required parameters");
    }
    // check if folder exists
    if (!fs.existsSync(`/tmp/${contextId}`)){
      fs.mkdirSync(`/tmp/${contextId}`);
    }

    

    const randomName = `/tmp/${contextId}/checklist.pdf` // `/tmp/${Math.random().toString(36).substring(7)}.pdf`;
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true, // Ensure Puppeteer runs in headless mode
      protocolTimeout: 60000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Reduces shared memory issues
        "--disable-gpu", // Disable GPU acceleration (optional)
        "--single-process", // Avoid multi-process issues (optional)
      ],
    });

    // Open a new page
    const page = await browser.newPage();
    const template = fs.readFileSync(`./templates/${templateFileName}.html`, "utf8");
    const compiledTemplate = handlebars.compile(template);
    const htmlContent = compiledTemplate(data);
 
    await page.setContent(htmlContent,{ waitUntil: "networkidle0" });

    // Generate the PDF
    await page.pdf({
      path: randomName,
      format: "A4",
      scale: 0.7,
    //  margin: { top: "20mm", bottom: "20mm", left: "10mm", right: "10mm" },
      printBackground: true,
    });


    // Close the browser
    await browser.close();
    //const file = fs.readFileSync(randomName);
    //fs.unlinkSync(randomName);
    //return file;
    return {htmlContent, randomName};
  }
}

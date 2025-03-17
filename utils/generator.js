"use strict";
import fs from "fs";
import hbs from "hbs";
import Debugger from "./debugger.js";
import { stateManager } from "./stateManager.js";

const defaultPageData = stateManager.getState("defaultPageData");

// Register partials once
hbs.registerPartials('./views/partials');
hbs.registerHelper('eq', function(arg1, arg2) {
    return arg1 == arg2;
});

export function generateView({ page = "http/404", layout = "default", title = "Dashboard", data = { message: "This route has no page assigned." }, js_includes = [] }, res = this, headers = {}) {
    try {
        // Merge default data with provided data
        data = {
            appTitle: `${process.env.APP_TITLE ?? "Bashcom"} - ${title}`,
            baseUrl: process.env.BASE_URL,
            ...data
        };

        if (res.hasOwnProperty("user_data")) {
            data = { ...res.user_data, ...data }
        }

        // Read the main page file
        const mainFile = fs.readFileSync(`./views/components/${page}.hbs`, "utf8");
        let custom_js = ""
        try {
            custom_js = fs.readFileSync(`./views/components/${page}.js`, "utf8", (err) => err) ?? "";
        }
        catch(error)
        {
            custom_js = "";
        }
        

        // Compile the main page template
        const template = hbs.compile(mainFile)(data);
        // Render the layout template with the main page content
       // console.log(data);
        return res.render(`layouts/${layout}`, { body: template, ...defaultPageData, js_includes, custom_js, ...data });

    } catch (error) {
        Debugger.error("Error rendering view:", error);
        return res.status(500).send("Internal Server Error");
    }
}

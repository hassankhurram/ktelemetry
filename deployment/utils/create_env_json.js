import dotenv from 'dotenv';
import fs from "fs"

const envProject = process.argv[2];
console.log("envProject",envProject)
const appConfig = dotenv.config({
   path: `./deployment/envs/${envProject}.env`
}).parsed;

console.log("appConfig",appConfig)

fs.writeFileSync("env.json",JSON.stringify(appConfig, null, 2), {encoding: "utf-8"});
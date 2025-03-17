import fs from 'fs';
import Debugger from '../utils/debugger.js';
const routersList = fs.readdirSync("./routers");

export default async function setRoutes(app, router)
{
    for(let routerFile of routersList)
    {
        if(routerFile === "routes.js") continue;
        try {
            console.log("Loading router: " + routerFile + "...");
            const routerClass = await import(`./${routerFile}`);
            const routerObject = new routerClass.default(router);
            app.use(routerClass.default.urlPath, routerObject.router);
        }
        catch(e)
        {
            console.error(e);
            Debugger.abort("failed to load router: " + routerFile + "...",e)
        }
        
    }
    
    return app;
}
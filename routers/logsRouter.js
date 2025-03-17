"use strict";


import { LogsController } from '../controllers/logsController.js';
import { middleManMiddleware } from '../middleware/middleManMiddleware.js';
import BaseRouter from './baseRouter.js';
export default class LogsRouter extends BaseRouter {

    static urlPath = "/logs/api";

    constructor(router)
    {
        super(router, LogsController)
       // this.router.get("/showLogs", middleManMiddleware , LogsController.showLogs)
        this.router.post("/ingest", middleManMiddleware , LogsController.ingestLogs.bind(LogsController))
        this.router.post("/generatereport", middleManMiddleware , LogsController.generateReport.bind(LogsController))
        this.router.get("/explorelog", middleManMiddleware , LogsController.getSpecificEntry.bind(LogsController))
    }

}
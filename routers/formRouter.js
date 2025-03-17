"use strict";


import { LogsController } from '../controllers/logsController.js';
import { FormController } from '../controllers/formController.js';
import { middleManMiddleware } from '../middleware/middleManMiddleware.js';
import multer from "multer";
import BaseRouter from './baseRouter.js';



const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
}).fields([
    { name: 'fundLogo', maxCount: 5 },
    { name: 'subscriptionAgreement', maxCount: 5 }, // Adjust as needed
    { name: 'additionalAgreement', maxCount: 5 },
    { name: 'redemptionDocument', maxCount: 5 },
    { name: 'others', maxCount: 5 },
    { name: 'referenceDocuments', maxCount: 5 },
    { name: 'entityLogo', maxCount: 5 }
]); 

export default class FormRouter extends BaseRouter {

    static urlPath = "/form";

    constructor(router)
    {
        super(router, FormController)
       // this.router.get("/showLogs", middleManMiddleware , LogsController.showLogs)
        this.router.post("/save", middleManMiddleware, upload, FormController.processForm.bind(FormController))
        this.router.get("/show", FormController.showForm.bind(FormController))
    }

}
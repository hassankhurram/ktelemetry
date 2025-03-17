"use strict";

import { BaseController } from '../controllers/baseController.js';
export default class BaseRouter {

    static urlPath = "/";

    constructor(router, controller)
    {
        this.router = router;
        this.controller = controller ? controller : BaseController;
        this.router.get("/", BaseController.home)
    }

}
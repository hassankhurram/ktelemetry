"use strict";

import {generateView} from "../utils/generator.js";
import Debugger from "../utils/debugger.js";

export class BaseController {

    static generateView = generateView;
    static Debugger = Debugger;

    constructor()
    {
        this.generateView = generateView;
        this.Debugger = Debugger;
    }

    static async home(req, res)
    {
        
        return generateView({ title: "Home", page: "splash", layout: "splash"}, res)
    }

    
    static successResponse(res, data, isRaw = null)
    {
        try {
            if(isRaw)
            {
                // send downloable file back
                return res.setHeaders(new Headers({
                    "Content-Type": isRaw.contentType,
                    "Content-Disposition": `attachment; filename=${isRaw.fileName}`
                })).status(200).send(data);

            }
            const response = BaseController.baseResponse({
                status: true,
                data: data
            });
            return res.status(200).json(response);
        }
        catch(error)
        {
            return BaseController.Debugger.throw(res, "baseController.js", "successResponse", error)
        }
    }

    static failedResponse(res, error, http_status = 500)
    {
        try {
            const response = BaseController.baseResponse({
                status: false,
                error: error 
            });
            return res.status(http_status).json(response);
        }
        catch(_error)
        {
            return BaseController.Debugger.throw(res, "baseController.js", "failedResponse", _error)
        }
    }

    static baseResponse({status = false, error = null, data = null})
    {
        return {
            status: status,
            error: error,
            data: data
        };
    }

}
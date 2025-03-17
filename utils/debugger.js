import util from 'util'
import { generateView } from './generator.js'
import { SlackBot } from './slackbot.js'
export default class Debugger {

    static log(...logs) {
       console.log(logs)
    }

    static warn(...warns) {
        console.warn(warns)
    }

    static error(...errors) {
        console.error(errors)
    }

    static info(...infos) {
        console.info(infos)
    }

    static abort(...msg)
    {
        throw new Error(msg);
    }
    static throw(res, _file, _function, _error) {
        // console.log(util.inspect({_file, _function, _error}));
        console.log(_error);

       
        
        const nodeEnv = process.env.NODE_ENV || "development"
        let err_message = util.inspect(_error,true, 10);
        (async()=>{
            await SlackBot.sendMessage(`[ERROR] Code error in: \`${_file}\` -> \`${_function}\` event: ${res.event_name ?? ""}`);
            await SlackBot.sendMessage(`${err_message}`);
        })();

        if(["production","prod"].includes(nodeEnv.toLowerCase()))
        {
            err_message = "Internal Server Error | Contact administrators";
        }
        if(res.hasOwnProperty('isWeb') && res.isWeb)
        {
            return generateView({page: "http/error", layout: "basic", title: "500 internal server error", data: {message: err_message}}, res);
        }
        else {
            return  res.status(500).json({status: false, message: 'Internal Server Error'});
        }

       
       
    }

}
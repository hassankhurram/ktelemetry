import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import path, { dirname } from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import setRoutes from "./routers/routes.js";
import { generateView } from './utils/generator.js';
import { stateManager } from './utils/stateManager.js';
import {BaseController} from './controllers/baseController.js';
import cors from "cors";
import { SlackBot } from './utils/slackbot.js';
import { getUserIp } from './utils/utils.js';

stateManager.init({
  startTime: Date.now()
});



stateManager.setState("defaultPageData", {

  // set default data for all pages
  
});



const defaultPageData = stateManager.getState("defaultPageData");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const expressRouter = express.Router();


const whiteListedUrls = process.env.WHITE_LISTED_URLS.split(",");

app.options("*", cors());
app.set('trust proxy', true)
app.use(function (req, res, next) {
 
  const origin = req.header('Origin') ?? req.header("Host") ?? "local";

  const userIp = getUserIp(req);

  req.user_ip = userIp;
  if(req.path == "/" || req.path.slice(0,7) == "/assets" || req.path.slice(0,10) == "/form/show" )
  {
    return next();
  }
  if(true || origin && whiteListedUrls.includes(origin))
  {
    res.header("Access-Control-Allow-Origin", whiteListedUrls.find(x => x === origin));
    res.header(
      "Access-Control-Allow-Methods",
      "GET,PUT,POST,DELETE,PATCH,HEAD,OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, x-uid, x-auth-token"
    );
    res.header("Access-Control-Expose-Headers", "x-auth-token");
    return next();
  }
  else {
    console.log("Invalid Origin: "+origin)
    SlackBot.sendMessage("[WARN] Invalid origin: "+origin+ " | IP: "+userIp+ " | Url: ");
    return BaseController.failedResponse(res, "Invalid request", 403)
  }
 
});

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const commonData = (req, res, next) => {
  res.locals = { ...res.locals, ...defaultPageData }
  res.generateView = generateView;
  next();
};

app.use(commonData);
//app.use(logger('dev'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


await setRoutes(app, expressRouter);

// error handler
app.use(function (req, res, next) {
  generateView({ page: "http/error", layout: "basic", title: "404 not found", data: { message: `Url: "${req.url}" 404 not found` } }, res);
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  if (err) {
    generateView({ page: "http/error", layout: "basic", title: "500 internal server error", data: { message: err.message } }, res);
    console.log(err);
  }
  // render the error page
  next();
  //res.status(err.status || 500).render('error');

});


const _PORT = process.env.PORT ?? 7896
app.listen(_PORT, async () => {
  // await DBConfig.initialize()
  console.log("server started at port: " + _PORT)
})



export default app
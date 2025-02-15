import express, { Express } from "express";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import logger from "morgan";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import chalk from "chalk";
// import cron from "node-cron";
import { IndexRouter } from "./routes/index_route";
import { CronRouter } from "./routes/cron_route";
// types
import type { Request } from "express";

export type AnyObj = Record<string, any>;

export type RequestQuery<T> = Request<AnyObj, any, AnyObj, T>;
export type RequestBody<T> = Request<AnyObj, any, T, AnyObj>;
export type RequestPlain = Request<AnyObj, any, AnyObj, AnyObj>;
export type RequestParams<T> = Request<T, any, AnyObj, AnyObj>;

const app: Express = express();
const indexRouter = new IndexRouter();
const cronRouter = new CronRouter();

app.set("views", path.resolve(process.cwd(), "views"));
app.set("view engine", "ejs");

app.use(express.json({ limit: "2100000kb" }));
app.use(
    cors({
        credentials: true,
        origin: ["http://localhost:3000", "https://hlkw.me", "https://holo-board.hlkw.me"],
    })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd(), "public")));

app.use((req, res, next) => {
    console.log(chalk.hex("#FFA500").bold("method: ", req.method));
    console.log(chalk.green("route: ", req.originalUrl));
    next();
});

app.get("/", (req, res) => {
    res.render("index", { title: "Express" });
});
app.use("/api", indexRouter.router);
app.use("/api/cron", cronRouter.router);
app.use("/:teams", express.static("public"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

export default app;

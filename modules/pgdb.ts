import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import pgPromise from "pg-promise";
import moment from "moment";
import chalk from "chalk";
// types
import type { IInitOptions, IDatabase } from "pg-promise";
import type { IConnectionParameters, IClient } from "pg-promise/typescript/pg-subset";

const initOptions: IInitOptions = {
    noWarnings: true,
    schema: process.env.DB_SCHEMA,
    error(err, e) {
        console.log(chalk.red("Error occured with db object: "), err);
        console.log(chalk.red("Context: "), e);
    },
    // pg-promise initialization options...
    query(e) {
        if (process.env.NODE_ENV === "dev") {
            if (typeof e.query === "string" && !e.query.includes("SET search_path TO ")) {
                const sqlLog =
                    "\n" +
                    e.query
                        .trim()
                        .replace(/[^\S\r\n]+/g, " ")
                        .replace(/[\t ]*(\r?\n)[\t ]*/g, "$1");
                console.log(chalk.cyan("QUERY:"), sqlLog);
            }
        }
    },
    transact(e) {
        if (e.ctx.finish) {
            // this is a transaction->finish event;
            console.log("Duration: ", e.ctx.duration);
            if (e.ctx.success) {
                // e.ctx.result = resolved data;
            } else {
                // e.ctx.result = error/rejection reason;
            }
        } else {
            // this is a transaction->start event;
            console.log("Start Time:", e.ctx.start);
        }
    },
    task(e) {
        if (e.ctx.finish) {
            // this is a task->finish event;
            console.log(chalk.yellow("Duration: "), e.ctx.duration);
            if (e.ctx.success) {
                // e.ctx.result = resolved data;
            } else {
                // e.ctx.result = error/rejection reason;
            }
        } else {
            // this is a task->start event;
            console.log(chalk.magenta("Start Time: "), e.ctx.start);
        }
    },
};

export const pgp = pgPromise(initOptions);

// 1114 is OID for timestamp in Postgres
pgp.pg.types.setTypeParser(1114, (str) => moment.utc(str).local());
// 1114 is OID for date in Postgres
pgp.pg.types.setTypeParser(1082, (str) => moment(str).format("YYYY-MM-DD"));

// Preparing the connection details:
const cn: IConnectionParameters<IClient> = {
    host: process.env.DB_HOST,
    port: 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.SSL === "false" ? false : true,
    application_name: "hlkw_server",
};

export const db: IDatabase<any> = pgp(cn);

import express, { Router } from "express";
import { HololiveTalentsController } from "../controller/hololiveTalentsController";
import requestErrorHandler from "../modules/requestErrorHandler";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// types
import type { RequestQuery, RequestBody } from "../app";

export const hololiveTalentsController = new HololiveTalentsController();

export class IndexRouter {
    router: Router;
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get("/talent_list", async (req, res) => {
            try {
                const hololiveTalents = await hololiveTalentsController.getTalents();
                res.status(200).json({
                    success: true,
                    message: "Successfully get talent list",
                    data: hololiveTalents,
                });
            } catch (error) {
                console.error("Error parsing talent list:", error);
                requestErrorHandler(res, error);
            }
        });
    }
}

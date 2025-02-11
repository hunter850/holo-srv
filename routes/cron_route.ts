import express, { Router } from "express";
import TalentParser from "../lib/talentParser";
import requestErrorHandler from "../modules/requestErrorHandler";
import { hololiveTalentsController } from "./index_route";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const talentParser = new TalentParser();

export class CronRouter {
    router: Router;
    constructor() {
        this.router = express.Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.get("/talent_list", async (req, res) => {
            try {
                const newTalents = await talentParser.getTalentInfoList();
                await hololiveTalentsController.upsertTalents(newTalents);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error("Error saving talent info:", error);
                requestErrorHandler(res, error);
            }
        });
    }
}

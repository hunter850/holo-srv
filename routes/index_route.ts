import express, { Router } from "express";
import { HololiveTalentsController } from "../controller/hololiveTalentsController";
import requestErrorHandler from "../modules/requestErrorHandler";
import * as path from "path";
import dotenv from "dotenv";
import { google } from "googleapis";
import { googleAuthMiddleware } from "../middleware/googleAuthMiddleware";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// types
import type { RequestQuery, RequestBody } from "../app";
import type { RequestWithGoogleAuth } from "../middleware/googleAuthMiddleware";

export const hololiveTalentsController = new HololiveTalentsController();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
const youtube = google.youtube({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY!,
});

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
        this.router.get("/google_login", async (req, res) => {
            try {
                const authUrl = oauth2Client.generateAuthUrl({
                    access_type: "offline", // 允許 Refresh Token
                    scope: [
                        "https://www.googleapis.com/auth/userinfo.profile",
                        "https://www.googleapis.com/auth/userinfo.email",
                        "https://www.googleapis.com/auth/youtube.readonly",
                        "openid",
                    ], // 只讀取 YouTube 頻道
                    prompt: "consent", // 確保每次都請求授權（避免 Google 不給 Refresh Token）
                    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                });
                res.status(302).redirect(authUrl);
            } catch (error: any) {
                console.error("Error getting auth:", error);
                requestErrorHandler(res, error);
            }
        });
        this.router.post("/google_login", async (req: RequestBody<{ code: string }>, res) => {
            try {
                if (typeof req.body?.code !== "string" || req.body?.code === "") {
                    return res.status(400).json({ success: false, message: "Missing code" });
                }
                const code = req.body.code;
                const { tokens } = await oauth2Client.getToken(code);
                res.cookie("accessToken", tokens.access_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 1 * 60 * 60 * 1000, // 1小時
                });
                res.cookie("refreshToken", tokens.refresh_token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
                });
                console.log("tokens: ", tokens);
                res.status(200).json({ success: true, data: tokens });
            } catch (error: any) {
                console.error("Error getting auth:", error);
                requestErrorHandler(res, error);
            }
        });
        this.router.get("/user_info", googleAuthMiddleware, async (req: RequestWithGoogleAuth, res) => {
            try {
                res.status(200).json({
                    success: true,
                    message: "Successfully got user info",
                    data: {
                        name: req.user?.name,
                        email: req.user?.email,
                        picture: req.user?.picture,
                    },
                });
            } catch (error) {
                requestErrorHandler(res, error);
            }
        });
    }
}

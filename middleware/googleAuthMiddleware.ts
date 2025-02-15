import { Request, Response, NextFunction } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export interface RequestWithGoogleAuth extends Request {
    user?: {
        name: string | null;
        email: string | null;
        picture: string | null;
        refreshToken: string | null;
        accessToken: string | null;
    };
}

export const googleAuthMiddleware = async (req: RequestWithGoogleAuth, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken as string | undefined;
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!accessToken && !refreshToken) {
        return res.status(401).json({ success: false, message: "No tokens provided" });
    }

    try {
        // 設置 access token
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        if (!accessToken) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            res.cookie("accessToken", credentials.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 1 * 60 * 60 * 1000, // 1小時
            });
            const oauth2 = google.oauth2("v2");
            const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });
            req.user = {
                name: userInfo.data.name ?? "",
                email: userInfo.data.email ?? "",
                picture: userInfo.data.picture ?? "",
                accessToken: credentials.access_token ?? null,
                refreshToken: credentials.refresh_token ?? null,
            };
            next();
        } else {
            const oauth2 = google.oauth2("v2");
            const userInfo = await oauth2.userinfo.get({ auth: oauth2Client });
            req.user = {
                name: userInfo.data.name ?? "",
                email: userInfo.data.email ?? "",
                picture: userInfo.data.picture ?? "",
                accessToken: accessToken,
                refreshToken: refreshToken ?? null,
            };
            next();
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ success: false, message: "Authentication failed" });
    }
};

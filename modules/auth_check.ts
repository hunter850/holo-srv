import jwt from "jsonwebtoken";
// types
import type { Request, Response, NextFunction } from "express";
import type { UserInfoRow } from "../controller/usersController";
import type { JwtPayload } from "jsonwebtoken";

export interface RequestWithAuth extends Request {
    user?: UserInfoRow;
}

function authCheck(req: RequestWithAuth, res: Response, next: NextFunction) {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;
        if (!accessToken && !refreshToken) {
            return res.status(401).json({ success: false, message: "No tokens provided" });
        }

        // 1. 驗證 accessToken
        if (accessToken) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { iss, sub, aud, exp, nbf, iat, jti, ...userData } = jwt.verify(
                accessToken,
                process.env.JWT_SECRET!
            ) as JwtPayload;
            if (userData) {
                req.user = userData as UserInfoRow;
                return next();
            }
        }
        // 2. 如果 accessToken 無效，檢查 refreshToken 是否存在
        if (refreshToken) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { iss, sub, aud, exp, nbf, iat, jti, ...refreshData } = jwt.verify(
                refreshToken,
                process.env.JWT_SECRET!
            ) as JwtPayload;
            if (refreshData) {
                const newAccessToken = jwt.sign(refreshData, process.env.JWT_SECRET!, {
                    expiresIn: "1h",
                });
                res.cookie("accessToken", newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 1 * 60 * 60 * 1000, // 1小時
                });
                req.user = refreshData as UserInfoRow;
                return next();
            }
        }
        return res.status(401).json({ success: false, message: "Invalid or expired tokens" });
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired tokens" });
    }
}

export default authCheck;

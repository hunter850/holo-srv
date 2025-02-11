import jwt from "jsonwebtoken";
import type { UserInfoRow } from "../controller/usersController";

function generateToken(userInfo: UserInfoRow) {
    const accessToken = jwt.sign(userInfo, process.env.JWT_SECRET!, { expiresIn: "1h" });
    const refreshToken = jwt.sign(userInfo, process.env.JWT_SECRET!, { expiresIn: "7d" });
    return { accessToken, refreshToken };
}

export default generateToken;

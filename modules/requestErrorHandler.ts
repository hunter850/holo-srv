import logger from "./logger";
import type { Response } from "express";

function requestErrorHandler(res: Response, error: any) {
    console.log("error: ", error);
    if (error.response) {
        // Request made and server responded
        const { status, data } = error.response;
        if (status === 401) {
            logger.error(`Responded: status code ${401} msg: Token expired or invalid`);
            res.status(401).send(`Token expired or invalid`);
        } else {
            logger.error(`Responded: status code ${status} msg: ${data?.error?.message ?? data?.message ?? data}`);
            res.status(status).send(`Responded: ${data?.error?.message ?? data}`);
        }
    } else if (error.request) {
        // The request was made but no response was received
        logger.error(`No response from server: ${error.request}`);
        res.status(503).send(`No response from server: ${error.request}`);
    } else {
        // Something happened in setting up the request that triggered an Error
        const errorMessage = error?.message ?? "";
        if (errorMessage === "jwt expired") {
            logger.error("Token has expired");
            res.status(401).json({ success: false, message: "Token has expired" });
        } else {
            logger.error(`Error in setting up the request: ${error?.message ?? ""}`);
            res.status(501).send(`Error in setting up the request: ${error?.message ?? ""}`);
        }
    }
}

export default requestErrorHandler;

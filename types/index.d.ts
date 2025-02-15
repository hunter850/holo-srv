declare namespace Express {
    export interface Request {
        user?: {
            name: string | null;
            email: string | null;
            picture: string | null;
            refreshToken: string | null;
            accessToken: string | null;
        };
    }
}

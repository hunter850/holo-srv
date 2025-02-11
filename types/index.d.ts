declare namespace Express {
    export interface Request {
        user?: {
            name: string | null;
            email: string | null;
            avatar_url: string | null;
            id: number;
            provider: string | null;
            provider_id: string | null;
            user_accounts_email: string | null;
            access_token: string | null;
            refresh_token: string | null;
        };
    }
}

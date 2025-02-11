import { db } from "../modules/pgdb";
// types
import type { Moment } from "moment";
import type { ITask } from "pg-promise";

export interface UsersRow {
    id: number;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    created_at: Moment;
    updated_at: Moment;
}

export interface UserInfoRow {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
    id: number;
    provider: string | null;
    provider_id: string | null;
    user_accounts_email: string | null;
    access_token: string | null;
    refresh_token: string | null;
}

export interface AddNewUserParams {
    userInfo: {
        name?: string;
        email?: string;
        avatar_url?: string;
    };
    userAccountInfo?: {
        provider?: string;
        provider_id?: string;
        email?: string;
        access_token?: string;
        refresh_token?: string;
    };
}

export type GetUsersParams = void | {
    id?: string | string[];
};

export class UsersController {
    async getUsers(params: GetUsersParams) {
        if (params === undefined || params.id === undefined) {
            const sql = `
                SELECT * FROM users;
            `;
            const { rows } = await db.result<UsersRow>(sql);
            return rows;
        } else if (typeof params.id === "string") {
            const userId = parseInt(params.id);
            if (Number.isNaN(userId) || userId + "" !== params.id) {
                throw { message: "Invalid user_id" };
            }
            const sql = `
                SELECT * FROM users
                WHERE id = $1;
            `;
            const { rows } = await db.result<UsersRow>(sql, [userId]);
            return rows;
        } else if (params.id.length > 0) {
            const userIds = params.id.map((id) => {
                const userId = parseInt(id);
                if (Number.isNaN(userId) || userId + "" !== id) {
                    return null;
                } else {
                    return userId;
                }
            });
            if (userIds.includes(null)) {
                throw { message: "Includes invalid user_id" };
            }
            const sql = `
                SELECT * FROM users
                WHERE id IN ($1:csv);
            `;
            const { rows } = await db.result<UsersRow>(sql, [userIds]);
            return rows;
        } else {
            return [];
        }
    }
    async getUsersByProviderId(providerId: string) {
        if (typeof providerId === "string" && providerId !== "") {
            const sql = `
                SELECT users.name, users.email, users.avatar_url, ua.id, ua.provider, ua.provider_id, ua.email AS user_accounts_email, ua.access_token, ua.refresh_token FROM user_accounts AS ua
                JOIN users ON ua.user_id = users.id
                WHERE provider_id = $1;
            `;
            const { rows } = await db.result<UserInfoRow>(sql, [providerId]);
            if (Array.isArray(rows) && rows.length > 0) {
                return rows[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    async addNewUser({ userInfo, userAccountInfo }: AddNewUserParams) {
        let userId: number | null = null;
        const checkUserSql = `
            SELECT id FROM users
            WHERE email = $1;
        `;
        if (typeof userInfo.email === "string" && userInfo.email !== "") {
            const idResult = await db.oneOrNone<{ id: number }>(checkUserSql, [userInfo.email]);
            if (idResult !== null) {
                userId = idResult.id;
            }
        }
        const responseUserId = await db.tx(async (t: ITask<unknown>) => {
            if (userId === null) {
                const addUserSql = `
                    INSERT INTO users (
                        "name", email, avatar_url
                    ) VALUES (
                        $1, $2, $3
                    ) RETURNING id;
                `;
                const userResult = await t.one<{ id: number }>(addUserSql, [
                    userInfo?.name ?? null,
                    userInfo?.email ?? null,
                    userInfo?.avatar_url ?? null,
                ]);
                userId = userResult.id;
            }
            if (userAccountInfo !== undefined) {
                const addUserAccountSql = `
                    INSERT INTO user_accounts (
                        user_id, provider, provider_id, email, access_token, refresh_token
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6
                    );
                `;
                await t.none(addUserAccountSql, [
                    userId,
                    userAccountInfo?.provider ?? null,
                    userAccountInfo?.provider_id ?? null,
                    userAccountInfo?.email ?? null,
                    userAccountInfo?.access_token ?? null,
                    userAccountInfo?.refresh_token ?? null,
                ]);
            }
            return userId;
        });
        return responseUserId;
    }
}

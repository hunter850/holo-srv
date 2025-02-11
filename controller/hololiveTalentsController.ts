import { db, pgp } from "../modules/pgdb";
import urlImageToS3 from "../utils/urlImageToS3";
// types
import type { Moment } from "moment";

export interface HololiveTalentsRow {
    id: number;
    name: string;
    en_name: string | null;
    live_avatar: string | null;
    avatar: string | null;
    status: string | null;
    youtube_link: string | null;
    deleted: boolean;
    created_at: Moment;
    updated_at: Moment;
}

export class HololiveTalentsController {
    async getTalents() {
        const sql = `
            SELECT * FROM hololive_talents
            WHERE deleted = FALSE;
        `;
        const { rows } = await db.result<HololiveTalentsRow>(sql);
        return rows;
    }
    async upsertTalents(talents: Partial<HololiveTalentsRow>[]) {
        const sqls: string[] = [];
        const allTalentsInDb = await this.getTalents();
        const dbTalentNames = allTalentsInDb.map((talent) => talent.name);
        const newTalentNames = talents.map((talent) => talent?.name ?? "");
        // insert
        const talentsToAdd = talents.filter((talent) => {
            return typeof talent.name !== "string" ? false : !dbTalentNames.includes(talent.name);
        });
        if (talentsToAdd.length > 0) {
            const talentsToAddWithS3Image = await Promise.all(
                talentsToAdd.map((talent) => {
                    return new Promise<Partial<HololiveTalentsRow>>((resolve, reject) => {
                        (async () => {
                            try {
                                const [avatar, live_avatar] = await Promise.all([
                                    urlImageToS3(talent.avatar),
                                    urlImageToS3(talent.live_avatar),
                                ]);
                                resolve({ ...talent, avatar, live_avatar });
                            } catch (error) {
                                reject(error);
                            }
                        })();
                    });
                })
            );
            const columnSet = new pgp.helpers.ColumnSet(
                ["name", { name: "en_name", prop: "en_name" }, "live_avatar", "youtube_link", "status", "avatar"],
                { table: "hololive_talents" }
            );
            const insertSql = pgp.helpers.insert(talentsToAddWithS3Image, columnSet);
            sqls.push(insertSql);
        }
        // delete
        const talentsToDelete = allTalentsInDb.filter((talent) => {
            return typeof talent.name !== "string" ? false : !newTalentNames.includes(talent.name);
        });
        if (talentsToDelete.length > 0) {
            const deleteSqlTemplate = `
                UPDATE hololive_talents
                SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE name NOT IN ($1:csv)
            `;
            const deleteSql = pgp.as.format(deleteSqlTemplate, [talentsToDelete.map((talent) => talent?.name ?? "")]);
            sqls.push(deleteSql);
        }
        // update
        const talentsToUpdate = talents.filter((talent) => {
            return typeof talent.name !== "string" ? false : dbTalentNames.includes(talent.name);
        });
        if (talentsToUpdate.length > 0) {
            const columnSet = new pgp.helpers.ColumnSet(
                [
                    "name",
                    "en_name",
                    // "live_avatar",
                    // "avatar",
                    "status",
                    "youtube_link",
                    { name: "updated_at", mod: "^", def: "CURRENT_TIMESTAMP" }, // 更新時間
                ],
                { table: "hololive_talents" }
            );
            console.log("talentsToUpdate: ", JSON.stringify(talentsToUpdate, null, 4));
            const updateSql =
                pgp.helpers.update(talentsToUpdate, columnSet, "hololive_talents") + " WHERE v.name = t.name";
            sqls.push(updateSql);
        }
        if (sqls.length > 0) {
            await db.tx((t) => {
                return t.batch(sqls.map((sql) => t.none(sql)));
            });
        }
    }
}

import axios from "axios";
import xml2js from "xml2js";
import * as cheerio from "cheerio";
import * as path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

class TalentParser {
    private TALENT_LIST_SITEMAP_URL: string;
    private TALENT_LIST_URL: string;
    constructor() {
        this.TALENT_LIST_SITEMAP_URL = process.env.TALENT_LIST_SITEMAP_URL!;
        this.TALENT_LIST_URL = process.env.TALENT_LIST_URL!;
    }
    statusParser(title: string) {
        const regexp = new RegExp("(?:【([^】]+)】)?(.+)");
        const match = title.match(regexp);
        if (match === null) {
            return { name: title, status: "" };
        } else {
            return { name: match?.[2]?.trim() ?? title.trim(), status: match?.[1]?.trim() ?? "" };
        }
    }
    async parseXmlUrls(): Promise<string[]> {
        try {
            const response = await axios.get(this.TALENT_LIST_SITEMAP_URL);
            return new Promise((resolve, reject) => {
                // 使用 xml2js 解析 XML
                xml2js.parseString(response.data, (err, result) => {
                    if (err) {
                        console.error("Error parsing XML:", err);
                        reject(err);
                    }
                    const urls = result.urlset.url.map((item: Record<string, any>) => item?.loc?.[0] ?? "") as string[];
                    resolve(urls);
                });
            });
        } catch (error) {
            console.error("Error fetching sitemap:", error);
            throw error;
        }
    }
    async parseVtuberInfo(url: string) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            // 日文名字, 英文名字
            const [jpName, enName] = $(".bg_box h1")
                .contents()
                .toArray()
                .map((item) => {
                    if (item.type === "text") {
                        return item.data.trim();
                    } else {
                        return $(item).text().trim();
                    }
                });
            const { name, status } = this.statusParser(jpName);
            // 全身大圖
            const liveAvatarLinks = $(".talent_left figure img:first-child")
                .toArray()
                .map((cheerEl) => {
                    return cheerEl?.attribs?.src;
                });
            // youtube 連結
            const youtubeLinks = $("ul.t_sns a:contains('YouTube')")
                .toArray()
                .map((cheerEl) => {
                    if (typeof cheerEl?.attribs?.href === "string") {
                        try {
                            const url = new URL(cheerEl?.attribs?.href);
                            const origin = url.origin;
                            const pathname =
                                url.pathname.slice(-1)[0] === "/" ? url.pathname.slice(0, -1) : url.pathname;
                            const pathnameCutTheFeature = pathname.replace(/\/featured$/, "");
                            return `${origin}${pathnameCutTheFeature}`;
                        } catch {
                            return cheerEl?.attribs?.href;
                        }
                    } else {
                        return cheerEl?.attribs?.href;
                    }
                });
            return {
                name: name ?? "",
                en_name: typeof enName !== "string" || enName === "" ? name : enName,
                live_avatar: liveAvatarLinks?.[0] ?? "",
                youtube_link: youtubeLinks?.[0] ?? "",
                status: status,
            };
        } catch (error: any) {
            console.error("Error fetching sitemap:", error);
            throw error;
        }
    }

    async parseAvatarLink() {
        const response = await axios.get(this.TALENT_LIST_URL);
        const $ = cheerio.load(response.data);
        const talentListItem = $(".talent_list a");
        const avatarLinkEntries = talentListItem.toArray().map((cheerEl) => {
            const imgSrc = $(cheerEl).find("img").attr("src") ?? "";
            const h3 = $(cheerEl).find("h3");
            const [jpName] = h3
                .contents()
                .toArray()
                .map((item) => {
                    if (item.type === "text") {
                        return item.data.trim();
                    } else {
                        return $(item).text().trim();
                    }
                });
            const { name } = this.statusParser(jpName);
            return [name, imgSrc];
        });
        return Object.fromEntries(avatarLinkEntries) as Record<string, string>;
    }
    async getTalentInfoList() {
        const [talentLinks, avatarMapping] = await Promise.all([this.parseXmlUrls(), this.parseAvatarLink()]);
        const regexp = /^https:\/\/hololive.hololivepro.com\/talents\//;
        const talentLinksInJp = talentLinks.filter((url) => regexp.test(url));
        const vtuberInfos = await Promise.all(
            talentLinksInJp.map((link) => {
                return this.parseVtuberInfo(link);
            })
        );
        const vtuberInfosWithAvatarLink = vtuberInfos.map((vtuberInfo) => {
            return {
                ...vtuberInfo,
                avatar: avatarMapping?.[vtuberInfo.name] ?? "",
            };
        });
        return vtuberInfosWithAvatarLink;
    }
}

export default TalentParser;

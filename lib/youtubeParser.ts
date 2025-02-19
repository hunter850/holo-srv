import axios from "axios";
import * as cheerio from "cheerio";
import * as path from "path";
import dotenv from "dotenv";
import urlRemoveQueryString from "../utils/urlRemoveQueryString";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface Video {
    videoId: string;
    thumbnails: {
        url: string;
        width: number;
        height: number;
    }[];
    title: string;
    viewCount: number;
    liveBroadcastContent: "live" | "upcoming" | "none";
    membershipOnly: boolean;
}

class TalentParser {
    private liveBroadcastContentMapping: Record<string, string> = {
        LIVE: "live",
        UPCOMING: "upcoming",
        DEFAULT: "none",
    };
    async parseStreams(youtubeChannelUrl: string) {
        const url = youtubeChannelUrl.endsWith("/streams") ? youtubeChannelUrl : `${youtubeChannelUrl}/streams`;
        const response = await axios.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
                Referer: "https://www.youtube.com/",
                "Accept-Language": "zh-TW,zh;q=0.9",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            },
        });
        const $ = cheerio.load(response.data);
        const scriptTags = $("script")
            .toArray()
            .filter((el) => $(el).html()?.includes("var ytInitialData"));
        const scriptTag = scriptTags?.[0] ?? null;
        const scriptContent = $(scriptTag).html();
        if (scriptTag === null || scriptContent === null) {
            return null;
        }
        const match = scriptContent.match(/var ytInitialData\s*=\s*({.*?});/s);
        if (typeof match?.[1] === "string" && match[1] !== "") {
            const data = JSON.parse(match[1]);
            return data;
        } else {
            return null;
        }
    }
    streamToVideos(streamData: Record<string, any> | null) {
        if (streamData === null) {
            return [];
        }
        const videos: Video[] =
            streamData?.contents?.twoColumnBrowseResultsRenderer?.tabs
                ?.find((tab: Record<string, any>) => {
                    return tab.tabRenderer.endpoint.commandMetadata.webCommandMetadata.url.includes("/streams");
                })
                ?.tabRenderer?.content?.richGridRenderer?.contents?.map((content: Record<string, any>) => {
                    const viewCountText =
                        content?.richItemRenderer?.content?.videoRenderer?.viewCountText?.runs?.[0]?.text.replace(
                            /,/g,
                            ""
                        ) ??
                        content?.richItemRenderer?.content?.videoRenderer?.viewCountText?.simpleText
                            .split("：")
                            .slice(-1)[0]
                            .replace(/,/g, "") ??
                        "0";
                    return {
                        videoId: content?.richItemRenderer?.content?.videoRenderer?.videoId ?? "",
                        thumbnails:
                            content?.richItemRenderer?.content?.videoRenderer?.thumbnail?.thumbnails?.map(
                                (thumbnail: Record<string, any>) => ({
                                    ...thumbnail,
                                    url: urlRemoveQueryString(thumbnail.url),
                                })
                            ) ?? [],
                        title: content?.richItemRenderer?.content?.videoRenderer?.title?.runs?.[0]?.text ?? "",
                        viewCount: parseInt(viewCountText),
                        liveBroadcastContent:
                            this.liveBroadcastContentMapping?.[
                                content?.richItemRenderer?.content?.videoRenderer?.thumbnailOverlays?.[0]
                                    ?.thumbnailOverlayTimeStatusRenderer?.style
                            ] ?? "none",
                        membershipOnly:
                            content?.richItemRenderer?.content?.videoRenderer?.badges?.find(
                                (badge: Record<string, any>) => badge?.metadataBadgeRenderer?.style === "BADGE_STYLE_TYPE_MEMBERS_ONLY"
                            ) !== undefined,
                    };
                }) ?? [];
        const videosFiltered = videos.filter((video) => typeof video.videoId === "string" && video.videoId.length > 0);
        return videosFiltered;
    }
}

export default TalentParser;

import loadUrlImageAsBuffer from "./loadUrlImageAsBuffer";
import updateImageToS3 from "./updateImageToS3";

async function urlImageToS3(url: string | null | undefined) {
    if (typeof url === "string" && url !== "") {
        const { buffer, mimetype } = await loadUrlImageAsBuffer(url);
        const newImageUrl = await updateImageToS3({ buffer, mimetype });
        return newImageUrl;
    } else {
        return url;
    }
}

export default urlImageToS3;

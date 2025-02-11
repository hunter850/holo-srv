import axios from "axios";

async function loadUrlImageAsBuffer(imageUrl: string): Promise<{ buffer: Buffer; mimetype: string }> {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const mimetype = response.headers["content-type"];
    return { buffer: Buffer.from(response.data), mimetype: mimetype };
}

export default loadUrlImageAsBuffer;

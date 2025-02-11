import app from "./app";
import * as dotenv from "dotenv";
dotenv.config();

const PORT = process?.env?.PORT ?? "3000";

app.set("port", PORT);

app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`);
});

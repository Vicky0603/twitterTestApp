import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp({ prisma });

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

require("dotenv").config();
import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost";
const CLIENT_URL = process.env.CLIENT_URL || "*";

createApp(CLIENT_URL).httpServer.listen(PORT, () => {
  console.log(`Server Running on  ${BACKEND_URL}:${PORT}`);
});

import { randomBytes } from "node:crypto";
import { ID_BYTES } from "./payload";

export const createPayloadId = () => randomBytes(ID_BYTES).toString("base64");

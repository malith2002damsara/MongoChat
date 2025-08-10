import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export function encryptMessageData(data) {
  return jwt.sign({ data }, JWT_SECRET);
}

export function decryptMessageData(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.data;
  } catch (err) {
    return null;
  }
}

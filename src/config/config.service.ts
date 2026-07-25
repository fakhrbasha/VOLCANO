import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT);

export const MONGO_URL = process.env.MONGO_URI;
export const MONGO_URI_ONLINE = process.env.MONGO_URI_ONLINE;
export const REDIS_URL = process.env.REDIS_URL;
export const GMAIL_USER = process.env.GMAIL_USER;
export const GMAIL_PASS = process.env.GMAIL_PASS;
export const SALT_ROUND = Number(process.env.SALT_ROUND);
export const ACCESS_SECRET_KEY_USER = process.env.ACCESS_SECRET_KEY_USER;
export const ACCESS_SECRET_KEY_ADMIN = process.env.ACCESS_SECRET_KEY_ADMIN;
export const REFRESH_SECRET_KEY_ADMIN = process.env.REFRESH_SECRET_KEY_ADMIN;
export const REFRESH_SECRET_KEY_USER = process.env.REFRESH_SECRET_KEY_USER;
export const PREFIX_USER = process.env.PREFIX_USER;
export const PREFIX_ADMIN = process.env.PREFIX_ADMIN;
// export const WAREHOUSE_EMAIL = process.env.WAREHOUSE_EMAIL;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
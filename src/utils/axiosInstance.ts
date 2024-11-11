import axios from "axios";
import { existsSync, readFileSync } from "fs";
import path from "path";

const fileCookie = existsSync(path.join('data', 'data.json')) ? JSON.parse(readFileSync(path.join('data', 'data.json'), { encoding: 'utf-8' })).cookie : "";

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    Cookie: fileCookie == "" ? process.env.COOKIE : fileCookie
  }
})

export default axiosInstance;
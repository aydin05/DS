import axios from "axios";

export const AUTO_FETCH = 30000;
export const url = import.meta.env.VITE_API_URL || "https://10.0.4.132/api/v1/";

export const prod_url = import.meta.env.VITE_PROD_URL || "https://10.0.4.132/";

const axiosClient = axios.create({
  baseURL: url,
});
export default axiosClient;

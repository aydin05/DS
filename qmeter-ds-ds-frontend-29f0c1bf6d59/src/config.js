import axios from "axios";

export const AUTO_FETCH = 30000;
export const url = import.meta.env.VITE_API_URL || "https://qmeterds.kapitalbank.az/newds/api/v1/";

export const prod_url = import.meta.env.VITE_PROD_URL || "https://qmeterds.kapitalbank.az/newds/";

const axiosClient = axios.create({
  baseURL: url,
});
export default axiosClient;

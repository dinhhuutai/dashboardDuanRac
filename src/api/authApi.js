import axios from "axios";
import { BASE_URL } from "~/config";

export const refreshSession = async () => {
  const res = await axios.post(`${BASE_URL}/refresh`, null, {
    withCredentials: true,
  });

  return res.data?.data;
};
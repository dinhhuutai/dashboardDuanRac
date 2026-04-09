import axios from "axios";
import { BASE_URL } from "~/config";

function pickAccessToken(res) {
  return (
    res?.data?.accessToken ||
    res?.data?.data?.accessToken ||
    res?.data?.token ||
    res?.data?.data?.token ||
    null
  );
}

/** Một promise dùng chung: tránh hai POST /refresh song song (rotate token → 401 → logout). */
let refreshInFlight = null;

export const refreshSession = async () => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await axios.post(`${BASE_URL}/refresh`, null, {
        withCredentials: true,
      });
      const session = res.data?.data;
      const accessToken = pickAccessToken(res) || session?.accessToken;
      if (!accessToken) {
        const err = new Error("Refresh failed: missing accessToken");
        err.response = res;
        throw err;
      }
      if (session && typeof session === "object") {
        return { ...session, accessToken };
      }
      return { accessToken };
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};
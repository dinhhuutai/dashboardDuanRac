import { useEffect } from "react";
import { useDispatch } from "react-redux";
import authSlice from "~/redux/slices/authSlice";
import { refreshSession } from "~/api/authApi";

export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await refreshSession();

        if (data?.accessToken && data?.user) {
          dispatch(
            authSlice.actions.loginSuccess({
              accessToken: data.accessToken,
              user: data.user,
            })
          );
        }
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          dispatch(authSlice.actions.logoutSuccess());
        }
      }
    };

    initAuth();
  }, [dispatch]);

  return children;
}
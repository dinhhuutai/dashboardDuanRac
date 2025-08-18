// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { routes, routesAdmin, routesInkAdmin, routesSuggest } from "./routes";

import DefaultLayout from "./layouts/DefaultLayout";
import DefaultLayoutAdmin from "./layoutsAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminInk from "./layoutsInkWeighAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminSuggest from "./layoutSuggestionAdmin/DefaultLayoutAdmin";

import ProtecteRouterLogin from "./routing/ProtecteRouterLogin";
import { useSelector } from "react-redux";
import { userSelector } from "./redux/selectors";
import { useEffect, useState } from "react";
import Login from "~/pages/Login";
import config from "./config";

// NEW: guard theo module
import RequireModule from "./routing/RequireModule";

function App() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState(tmp);
  useEffect(() => { setUser(tmp); }, [tmp]);

  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route
          path={config.routes.login}
          element={
            user?.login?.currentUser
              ? <Navigate to={config.routes.homeMain} replace />
              : <Login />
          }
        />

        {/* Public / Logged-in routes (mặc định) */}
        {routes.map((route, index) => (
          <Route element={route.login && <ProtecteRouterLogin />} key={index}>
            <Route
              path={route.path}
              element={
                route.isLogin
                  ? <route.component />
                  : !route.isLogin && !route.login
                    ? <route.component />
                    : (
                      <DefaultLayout>
                        <route.component />
                      </DefaultLayout>
                    )
              }
            />
          </Route>
        ))}

        {/* ====== ADMIN CÂN RÁC (module waste-weigh, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="waste-weigh"
              fallbackName="Quản lý cân rác"   // nếu cần, đúng chính tả bạn lưu
              needRoles={["admin"]}
            />
          }
        >
          <Route path="/admin" element={<Navigate to={config.routes.adminAnalytics} />} />
          <Route path="/admin">
            {routesAdmin.map((route, index) => (
              <Route
                key={index}
                path={route.addId ? `${route.path}/:id` : route.path}
                element={
                  <DefaultLayoutAdmin>
                    <route.component />
                  </DefaultLayoutAdmin>
                }
              />
            ))}
          </Route>
        </Route>

        {/* ====== ADMIN CÂN MỰC (module ink-weigh, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="ink-weigh"
              fallbackName="Quản lý cân mực"
              needRoles={["admin"]}
            />
          }
        >
          {routesInkAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminInk>
                  <route.component />
                </DefaultLayoutAdminInk>
              }
            />
          ))}
        </Route>

        {/* ====== ADMIN HÒM THƯ GÓP Ý (module suggest-box, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="suggest-box"
              fallbackName="Hòm thư góp ý"
              needRoles={["admin"]}
            />
          }
        >
          {routesSuggest.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminSuggest>
                  <route.component />
                </DefaultLayoutAdminSuggest>
              }
            />
          ))}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

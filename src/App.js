// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { 
  routes, 
  routesAdmin, 
  routesInkAdmin, 
  routesLunchOrderAdmin, 
  routesSuggest, 
  routesProductionAdmin, 
  routesCalculateSalaryAdmin,
  routesFormAdmin,
  routesTaskManagementAdmin,
} from "./routes";

import DefaultLayoutTrashWeight from "./layouts/DefaultLayout";
import DefaultLayoutAdmin from "./layoutsAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminInk from "./layoutsInkWeighAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminSuggest from "./layoutSuggestionAdmin/DefaultLayoutAdmin";

import DefaultLayoutLunchOrder from "./layoutsLunchOrder/DefaultLayout";
import DefaultLayoutAdminLunchOrder from './layoutsLuchOrderAdmin/DefaultLayoutAdmin';

import DefaultLayoutAdminProduction from "./layoutsProductionAdmin/DefaultLayoutAdmin";

import DefaultLayoutAdminCalculateSalary from "./layoutCalculateSalaryAdmin/DefaultLayoutAdmin";

import DefaultLayoutAdminForm from "./layoustFormAdmin/DefaultLayoutAdmin";

import DefaultLayoutTaskManagement from "./layoutsTaskManagement/DefaultLayout";

import DefaultLayoutAdminTaskManagement from "./layoutsTaskManagementAdmin/DefaultLayoutAdmin";


import ProtecteRouterLogin from "./routing/ProtecteRouterLogin";
import { useDispatch, useSelector } from "react-redux";
import { userSelector } from "./redux/selectors";
import { useEffect, useState } from "react";
import Login from "~/pages/Login";
import config from "./config";

// NEW: guard theo module
import RequireModule from "./routing/RequireModule";
import { reloadPermissions } from "./redux/slices/authSlice";

import usePresencePing from "./hooks/usePresencePing";

import usePageView from "./hooks/usePageView";

function AppRoutes({ user }) {
  
  const isLoggedIn = !!user?.login?.currentUser;

  usePresencePing(isLoggedIn);
  usePageView(isLoggedIn); 

  const dispatch = useDispatch();

  useEffect(() => {
    const onFocus = () => dispatch(reloadPermissions());
    const onVis = () => {
      if (document.visibilityState === "visible") dispatch(reloadPermissions());
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [dispatch]);


  return (
      <Routes>
        {/* Login */}
        <Route
          path={config.routes.login}
          element={
            user?.login?.currentUser
              ? <Navigate to={config.routes.homeMain} replace state={{ from: 'login' }} />
              : <Login />
          }
        />

        {/* Public / Logged-in routes (mặc định) */}
        {routes.map((route, index) => (
          <Route element={route.login && <ProtecteRouterLogin />} key={index}>
            <Route
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                route.isLogin
                  ? <route.component />
                  : !route.isLogin && !route.login
                    ? <route.component />
                    : route.module === 'datcom' ? (
                      <DefaultLayoutLunchOrder>
                        <route.component />
                      </DefaultLayoutLunchOrder>
                    ) : route.module === 'quanlycongviec' ? (
                      <DefaultLayoutTaskManagement>
                        <route.component />
                      </DefaultLayoutTaskManagement>
                    ) : (
                      <DefaultLayoutTrashWeight>
                        <route.component />
                      </DefaultLayoutTrashWeight>
                    )
              }
            />
          </Route>
        ))}

        {/* ====== ADMIN CÂN RÁC (module waste-weigh, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="canrac"
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
              moduleKey="canmuc"
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
              moduleKey="homthu"
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
        

        {/* ====== ADMIN ĐẶT CƠM (module lunch-order, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="datcom"
              fallbackName="Đặt cơm"
              needRoles={["admin"]}
            />
          }
        >
          {routesLunchOrderAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminLunchOrder>
                  <route.component />
                </DefaultLayoutAdminLunchOrder>
              }
            />
          ))}
        </Route>

        
        {/* ====== ADMIN SẢN XUẤT (module sanxuat, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="sanxuat"
              fallbackName="Quản lý sản xuất"
              needRoles={["admin"]}
            />
          }
        >
          {routesProductionAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminProduction>
                  <route.component />
                </DefaultLayoutAdminProduction>
              }
            />
          ))}
        </Route>
        
        {/* ====== ADMIN TÍNH LƯƠNG (module tinhluong, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="tinhluong"
              fallbackName="Xem bảng lương"
              needRoles={["admin"]}
            />
          }
        >
          {routesCalculateSalaryAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminCalculateSalary>
                  <route.component />
                </DefaultLayoutAdminCalculateSalary>
              }
            />
          ))}
        </Route>
        
        {/* ====== ADMIN TẠO FORM (module bieumaunoibo, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="bieumaunoibo"
              fallbackName="Biểu mẫu nội bộ"
              needRoles={["admin"]}
            />
          }
        >
          {routesFormAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminForm>
                  <route.component />
                </DefaultLayoutAdminForm>
              }
            />
          ))}
        </Route>

        
        {/* ====== ADMIN QUAN LY CÔNG VIỆC (module congviec, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="qlcongviec"
              fallbackName="Quản lý công việc"
              needRoles={["admin"]}
            />
          }
        >
          {routesTaskManagementAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminTaskManagement>
                  <route.component />
                </DefaultLayoutAdminTaskManagement>
              }
            />
          ))}
        </Route>
      </Routes>
  );
}

function App() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState(tmp);
  useEffect(() => setUser(tmp), [tmp]);

  return (
    <Router>
      <AppRoutes user={user} />
    </Router>
  );
}

export default App;

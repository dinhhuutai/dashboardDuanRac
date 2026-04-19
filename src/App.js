// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
  routesMesAdmin,
  routesKCSAdmin,
  routesOQCAdmin,
  routesConsolidateAdmin,
} from "./routes";
import { APP_VERSION } from "./version";

import ScrollToTop from "./components/ScrollToTop";

import DefaultLayoutTrashWeight from "./layouts/DefaultLayout";
import DefaultLayoutAdmin from "./layoutsAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminInk from "./layoutsInkWeighAdmin/DefaultLayoutAdmin";
import DefaultLayoutAdminSuggest from "./layoutSuggestionAdmin/DefaultLayoutAdmin";

import DefaultLayoutSuggest from "./layoutsSuggestion/DefaultLayout";

import DefaultLayoutCalculateSalary from "./layoutCalculateSalary/DefaultLayout";

import DefaultLayoutLunchOrder from "./layoutsLunchOrder/DefaultLayout";
import DefaultLayoutAdminLunchOrder from './layoutsLuchOrderAdmin/DefaultLayoutAdmin';

import DefaultLayoutAdminProduction from "./layoutsProductionAdmin/DefaultLayoutAdmin";

import DefaultLayoutAdminCalculateSalary from "./layoutCalculateSalaryAdmin/DefaultLayoutAdmin";

import DefaultLayoutAdminForm from "./layoustFormAdmin/DefaultLayoutAdmin";

import DefaultLayoutTaskManagement from "./layoutsTaskManagement/DefaultLayout";

import DefaultLayoutAdminTaskManagement from "./layoutsTaskManagementAdmin/DefaultLayoutAdmin";

import DefaultLayoutBMI from "./layoutsBMI/DefaultLayout";

import DefaultLayoutInkCovPerOnFilm from "./layoutsInkCovPerOnFilm/DefaultLayout";

import DefaultLayoutQualityInspectionOQC from "./layoutQualityInspectionOQC/DefaultLayout";
import DefaultLayoutAdminQualityInspectionOQC from "./layoutQualityInspectionOQCAdmin/DefaultLayoutAdmin";

import DefaultLayoutQualityInspectionKCS from "./layoutQualityInspectionKCS/DefaultLayout";
import DefaultLayoutAdminQualityInspectionKCS from "./layoutQualityInspectionKCSAdmin/DefaultLayoutAdmin";

import DefaultLayoutConsolidate from "./layoutConsolidate/DefaultLayout"
import DefaultLayoutAdminConsolidate from "./layoutConsolidateAdmin/DefaultLayoutAdmin";

import DefaultLayoutForm from "./layoutsForm/DefaultLayout"

import DefaultLayoutAdminMES from "./layoutsMESAdmin/DefaultLayoutAdmin"

import DefaultLayoutCapMoney from "./layoutCapMoney/DefaultLayout"


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
import MODULEID from "./contants/modules";
import HomeMain from "./pages/HomeMain";

function AppRoutes({ user }) {
  
  const isLoggedIn = !!user?.login?.currentUser;
  const userModules = user?.login?.permissions?.modules || [];

  usePresencePing(isLoggedIn);
  usePageView(isLoggedIn); 

  const hasModule = (moduleId) => {
    return userModules.some(m => m.moduleId === moduleId);
  };

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
          <Route
            element={route.login ? <ProtecteRouterLogin /> : <Outlet />}
            key={index}
          >
            <Route
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                route.isLogin
                  ? <route.component />
                  : !route.isLogin && !route.login
                    ? ( 
                        route.module === 'suggestion' ? (
                          <DefaultLayoutSuggest>
                            <route.component />
                          </DefaultLayoutSuggest>
                        ) : route.module === 'bieumaunoibo' ? (
                          <DefaultLayoutForm>
                            <route.component />
                          </DefaultLayoutForm>
                        ) :
                        <route.component />
                      ) 
                    : route.module === 'bieumaunoibo' ? (
                      <DefaultLayoutForm>
                        <route.component />
                      </DefaultLayoutForm>
                    ) : route.module === 'datcom' ? (
                      <DefaultLayoutLunchOrder>
                        <route.component />
                      </DefaultLayoutLunchOrder>
                    ) : route.module === 'quanlycongviec' ? (
                      <DefaultLayoutTaskManagement>
                        <route.component />
                      </DefaultLayoutTaskManagement>
                    ) : route.module === 'bmi' ? (
                      <DefaultLayoutBMI>
                        <route.component />
                      </DefaultLayoutBMI>
                    ) : route.module === 'tinhluong' ? (
                      <DefaultLayoutCalculateSalary>
                        <route.component />
                      </DefaultLayoutCalculateSalary>
                    ) : route.module === 'inkCovPerOnFilm' ? (
                      <DefaultLayoutInkCovPerOnFilm>
                        <route.component />
                      </DefaultLayoutInkCovPerOnFilm>
                    ) : route.module === 'qualityInspectionOQC' ? (
                      <DefaultLayoutQualityInspectionOQC>
                        <route.component />
                      </DefaultLayoutQualityInspectionOQC>
                    ) : route.module === 'qualityInspectionKCS' ? (
                      <DefaultLayoutQualityInspectionKCS>
                        <route.component />
                      </DefaultLayoutQualityInspectionKCS>
                    ) : route.module === 'consolidate' ? (
                      <DefaultLayoutConsolidate>
                        <route.component />
                      </DefaultLayoutConsolidate>
                    ) : route.module === 'capmoney' ? (
                      <DefaultLayoutCapMoney>
                        <route.component />
                      </DefaultLayoutCapMoney>
                    ) : (
                      <DefaultLayoutTrashWeight>
                        <route.component />
                      </DefaultLayoutTrashWeight>
                    )
              }
            />
          </Route>
        ))}


        <Route path="/admin" element={<Navigate to={config.routes.homeMain} replace />} />

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
            {routesAdmin.map((route, index) => (
              <Route
                key={index}
                path={route.addId ? `${route.path}/:id` : route.path}
                element={
                  hasModule(MODULEID.CANRAC) ? (
                    <DefaultLayoutAdmin>
                      <route.component />
                    </DefaultLayoutAdmin>
                  ) : (
                    <Navigate to={config.routes.homeMain} replace />
                  )
                }
              />
            ))}
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
        
        {/* ====== ADMIN OQC (module oqc, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="quality-inspection-oqc"
              fallbackName="OQC - Kiểm tra chất lượng đầu ra"
              needRoles={["admin"]}
            />
          }
        >
          {routesOQCAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminQualityInspectionOQC>
                  <route.component />
                </DefaultLayoutAdminQualityInspectionOQC>
              }
            />
          ))}
        </Route>
        
        {/* ====== ADMIN KCS (module kcs, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="quality-inspection-kcs"
              fallbackName="KCS - Kiểm tra chất lượng tại chuyền"
              needRoles={["admin"]}
            />
          }
        >
          {routesKCSAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminQualityInspectionKCS>
                  <route.component />
                </DefaultLayoutAdminQualityInspectionKCS>
              }
            />
          ))}
        </Route>
        
        {/* ====== ADMIN GOM HANG (module gom hang, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="consolidate"
              fallbackName="Gom hàng"
              needRoles={["admin"]}
            />
          }
        >
          {routesConsolidateAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminConsolidate>
                  <route.component />
                </DefaultLayoutAdminConsolidate>
              }
            />
          ))}
        </Route>
        
        {/* ====== ADMIN MES (module mes, chỉ admin) ====== */}
        <Route
          element={
            <RequireModule
              moduleKey="mes"
              fallbackName="MES"
              needRoles={["admin"]}
            />
          }
        >
          {routesMesAdmin.map((route, index) => (
            <Route
              key={index}
              path={route.addId ? `${route.path}/:id` : route.path}
              element={
                <DefaultLayoutAdminMES>
                  <route.component />
                </DefaultLayoutAdminMES>
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

  useEffect(() => {
    const oldVersion = localStorage.getItem("app_version");

    if (oldVersion && oldVersion !== APP_VERSION) {
      console.log("🔄 Có version mới → reload");
      window.location.reload(true);
    }

    localStorage.setItem("app_version", APP_VERSION);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AppRoutes user={user} />
    </Router>
  );
}

export default App;

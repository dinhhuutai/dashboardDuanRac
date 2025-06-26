import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { routes, routesAdmin, routesInkAdmin } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import config from './config';
import DefaultLayoutAdmin from './layoutsAdmin/DefaultLayoutAdmin';
import DefaultLayoutAdminInk from './layoutsInkWeighAdmin/DefaultLayoutAdmin';
import ProtecteRouterLogin from './routing/ProtecteRouterLogin';
import ProtectedRouteAdmin from './routing/ProtectedRouteAdmin';
import { useSelector } from 'react-redux';
import { userSelector } from './redux/selectors';
import { useEffect, useState } from 'react';
import ProtectedRouteAdminInk from './routing/ProtectedRouteAdminInk';

function App() {
  
    const tmp = useSelector(userSelector);
    const [user, setUser] = useState(tmp);
    
    
    useEffect(() => {
        setUser(tmp)
    }, [tmp])


  return (
    <Router>
      <Routes>
        {routes.map((route, index) => {
          return (
            <Route element={route.login && <ProtecteRouterLogin />}>
              <Route
                key={index}
                path={route.path}
                element={
                  route.isLogin ? (
                    user.login.currentUser ? (
                      <Navigate to={config.routes.home} />
                    ) : (
                      <route.component />
                    )
                  ) : (
                    <DefaultLayout>
                      <route.component />
                    </DefaultLayout>
                  )
                }
              />
            </Route>
          );
        })}

        <Route path="/admin" element={<Navigate to={config.routes.adminAnalytics} />} />

        <Route path="/admin">
          {routesAdmin.map((route, index) => {
            return (
              <Route element={route.login && <ProtectedRouteAdmin />}>
                <Route
                  key={index}
                  path={route.addId ? `${route.path}/:id` : route.path}
                  element={
                    <DefaultLayoutAdmin>
                      <route.component />
                    </DefaultLayoutAdmin>
                  }
                />
              </Route>
            );
          })}
        </Route>
        
          {routesInkAdmin.map((route, index) => {
            return (
              <Route element={route.login && <ProtectedRouteAdminInk />}>
                <Route
                  key={index}
                  path={route.addId ? `${route.path}/:id` : route.path}
                  element={
                    <DefaultLayoutAdminInk>
                      <route.component />
                    </DefaultLayoutAdminInk>
                  }
                />
              </Route>
            );
          })}
      </Routes>
    </Router>
  );
}

export default App;

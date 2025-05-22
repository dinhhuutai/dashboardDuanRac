import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { routes, routesAdmin } from './routes';
import DefaultLayout from './layouts/DefaultLayout';
import config from './config';
import DefaultLayoutAdmin from './layoutsAdmin/DefaultLayoutAdmin';
import ProtecteRouterLogin from './routing/ProtecteRouterLogin';

function App() {
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
                    <route.component />
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
              <Route
                key={index}
                path={route.addId ? `${route.path}/:id` : route.path}
                element={
                  <DefaultLayoutAdmin>
                    <route.component />
                  </DefaultLayoutAdmin>
                }
              />
            );
          })}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';
import config from '~/config';

import { userSelector } from '~/redux/selectors';

function ProtecteRouterLogin() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState(tmp);

  useEffect(() => {
    setUser(tmp);
  }, [tmp]);

  console.log('user: ', user);

  return user.login.currentUser ? <Outlet /> : <Navigate to={config.routes.login} />;
}

export default ProtecteRouterLogin;

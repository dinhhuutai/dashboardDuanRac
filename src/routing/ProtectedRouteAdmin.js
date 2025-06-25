import { Navigate, Outlet } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';

import config from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { useEffect, useState } from 'react';


function ProtectedRouteAdmin() {
    
    const tmp = useSelector(userSelector);
    const [user, setUser] = useState(tmp);
    
    
    useEffect(() => {
        setUser(tmp)
    }, [tmp])

    if(user.login.isFetching){
        return (
            <div className='spinner-container'>
                <Spinner animation='border' variant='info' />
            </div>
        )
    }

    return (
        user.login.currentUser && user.login.currentUser?.role === 'admin' ? <Outlet /> : <Navigate to={config.routes.home} />
    );
}

export default ProtectedRouteAdmin;
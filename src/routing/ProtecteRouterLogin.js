import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import config from '~/config';
import MODULEID from '~/contants/modules';
import { userSelector } from '~/redux/selectors';

function ProtecteRouterLogin() {
  const { login } = useSelector(userSelector) || {};
  const location = useLocation();

  // 1) Chưa đăng nhập
  if (!login?.currentUser) {
    return <Navigate to={config.routes.login} replace />;
  }

  // 2) Chỉ auto-redirect ngay SAU khi đăng nhập
  const justLoggedIn = location.state?.from === 'login';
  if (justLoggedIn) {
    const modules = login?.permissions?.modules || [];
    let to = config.routes.homeMain;

    if (modules.length === 1) {
      const m = modules[0];
      if (m.moduleId === MODULEID.DATCOM) {
        if (m.role === 'user') to = config.routes.lunchOrder;
        else if (m.role === 'admin') to = config.routes.adminLunchOrderDashboard;
      } else if (m.moduleId === MODULEID.CANMUC) {
        if (m.role === 'admin') to = config.routes.adminInkWeighHistory;
      } else if (m.moduleId === MODULEID.CANRAC) {
        if (m.role === 'admin' && (login?.currentUser.userID === 2 || login?.currentUser.userID === 18)) to = config.routes.home;
        else if (m.role === 'admin') to = config.routes.adminReportByShift;
      } else if (m.moduleId === MODULEID.TINHLUONG) {
        if (m.role === 'user') to = config.routes.calculateSalaryViewPayslip;
        else if (m.role === 'admin') to = config.routes.adminCalculateSalaryUploadPayrollReport;
      } 
    }

    // dùng replace và xóa state để lần sau vào homeMain KHÔNG còn tự đẩy nữa
    return <Navigate to={to} replace state={{}} />;
  }

  // 3) Các lần truy cập khác (kể cả vào homeMain) — không ép redirect
  return <Outlet />;
}

export default ProtecteRouterLogin;

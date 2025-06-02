import config from '~/config';

import Home from '~/pages/Home';
import Login from '~/pages/Login';
import Scan from '~/pages/Scan';
import User from '~/pages/User';
import QrcodeCreate from '~/pagesAdmin/Manage/Qrcode/Create';
import QrcodeList from '~/pagesAdmin/Manage/Qrcode/List';
import QrcodeUpdate from '~/pagesAdmin/Manage/Qrcode/Update';
import UserCreate from '~/pagesAdmin/Manage/User/Create';
import UserList from '~/pagesAdmin/Manage/User/List';
import UserUpdate from '~/pagesAdmin/Manage/User/Update';
import Chat from '~/pagesAdmin/Menu/Applications/Chat';
import MailBox from '~/pagesAdmin/Menu/Applications/MailBox';
import Section from '~/pagesAdmin/Menu/Applications/Section';
import Analytics from '~/pagesAdmin/Menu/Dashboards/Analytics';
import HistoryWeigh from '~/pagesAdmin/Menu/Dashboards/HistoryWeigh';
import Report from '~/pagesAdmin/Menu/Dashboards/Report';
import AdminHome from '~/pagesAdmin/Menu/Pages/Home';
import AdminScan from '~/pagesAdmin/Menu/Pages/Scan';
import AdminUser from '~/pagesAdmin/Menu/Pages/User';
import TrashTypeList from '~/pagesAdmin/Manage/TrashType/List';
import TrashTypeCreate from '~/pagesAdmin/Manage/TrashType/Create';
import TrashTypeUpdate from '~/pagesAdmin/Manage/TrashType/Update';
import TeamMemberList from '~/pagesAdmin/Manage/TeamMember/List';
import TeamMemberCreate from '~/pagesAdmin/Manage/TeamMember/Create';

export const routes = [
  {
    path: config.routes.home,
    component: Home,
    login: true,
  },
  {
    path: config.routes.login,
    component: Login,
    login: false,
    isLogin: true,
  },
  {
    path: config.routes.scan,
    component: Scan,
    login: true,
  },
  {
    path: config.routes.user,
    component: User,
    login: true,
  },
];

export const routesAdmin = [
  {
    path: config.routes.adminQrcodeCreate,
    component: QrcodeCreate,
    login: true,
  },
  {
    path: config.routes.adminQrcode,
    component: QrcodeList,
    login: true,
  },
  {
    path: config.routes.adminQrcodeUpdate,
    component: QrcodeUpdate,
    login: true,
  },
  {
    path: config.routes.adminUser,
    component: UserList,
    login: true,
  },
  {
    path: config.routes.adminUserCreate,
    component: UserCreate,
    login: true,
  },
  {
    path: config.routes.adminUserUpdate,
    component: UserUpdate,
    login: true,
  },
  {
    path: config.routes.adminTrashType,
    component: TrashTypeList,
    login: true,
  },
  {
    path: config.routes.adminTrashTypeCreate,
    component: TrashTypeCreate,
    login: true,
  },
  {
    path: config.routes.adminTrashTypeUpdate,
    component: TrashTypeUpdate,
    login: true,
  },
  {
    path: config.routes.adminTeamMember,
    component: TeamMemberList,
    login: true,
  },
  {
    path: config.routes.adminTeamMemberCreate,
    component: TeamMemberCreate,
    login: true,
  },
  {
    path: config.routes.adminChat,
    component: Chat,
    login: true,
  },
  {
    path: config.routes.adminMailBox,
    component: MailBox,
    login: true,
  },
  {
    path: config.routes.adminSection,
    component: Section,
    login: true,
  },
  {
    path: config.routes.adminAnalytics,
    component: Analytics,
    login: true,
  },
  {
    path: config.routes.adminReport,
    component: Report,
    login: true,
  },
  {
    path: config.routes.adminPageHome,
    component: AdminHome,
    login: true,
  },
  {
    path: config.routes.adminPageScan,
    component: AdminScan,
    login: true,
  },
  {
    path: config.routes.adminPageUser,
    component: AdminUser,
    login: true,
  },
  {
    path: config.routes.adminHistoryWeigh,
    component: HistoryWeigh,
    login: true,
  },
];

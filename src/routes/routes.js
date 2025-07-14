import config from '~/config';

import Home from '~/pages/Home';
import Login from '~/pages/Login';
import Scan from '~/pages/Scan';
import User from '~/pages/User';
import History from '~/pages/History';
import Feedback from '~/pages/Feedback';
import Feedback1 from '~/pages/Feedback1';

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

import Report from '~/pagesAdmin/Menu/Reports/Report';
import ReportByShift from '~/pagesAdmin/Menu/Reports/ReportByShift';
import ReportByTrash from '~/pagesAdmin/Menu/Reports/ReportTrash';
import ReportByDepartment from '~/pagesAdmin/Menu/Reports/ReportDepartment';
import ReportMaterials from '~/pagesAdmin/Menu/Reports/ReportMaterials';

import UnscannedQR from '~/pagesAdmin/Menu/Dashboards/UnscannedQR';
import WeighTruck from '~/pagesAdmin/Menu/Dashboards/WeighTruck';
import AdminHome from '~/pagesAdmin/Menu/Pages/Home';
import AdminScan from '~/pagesAdmin/Menu/Pages/Scan';
import AdminUser from '~/pagesAdmin/Menu/Pages/User';
import TrashTypeList from '~/pagesAdmin/Manage/TrashType/List';
import TrashTypeCreate from '~/pagesAdmin/Manage/TrashType/Create';
import TrashTypeUpdate from '~/pagesAdmin/Manage/TrashType/Update';
import TeamMemberList from '~/pagesAdmin/Manage/TeamMember/List';
import TeamMemberCreate from '~/pagesAdmin/Manage/TeamMember/Create';

import ListBinClassCheck from '~/pagesAdmin/Menu/ClassChecks/ListBin';
import HistoryClassCheck from '~/pagesAdmin/Menu/ClassChecks/History';

import AnalyticsInk from '~/pagesInkWeighAdmin/Dashboards/Analytics';
import HistoryWeighInk from '~/pagesInkWeighAdmin/Dashboards/HistoryWeigh';
import ReportInk from '~/pagesInkWeighAdmin/Dashboards/Report';
import LogfileInk from '~/pagesInkWeighAdmin/Dashboards/Logfile';

import FeedbackList from '~/pagesAdmin/Manage/Feedback/FeedbackList';
import FeedbackAnalytics from '~/pagesAdmin/Manage/Feedback/FeedbackAnalytics';
import FeedbackRole from '~/pagesAdmin/Manage/Feedback/FeedbackRole';

import TrashTruckList from '~/pagesAdmin/Manage/TrashTruck/List';
import TrashTruckCreate from '~/pagesAdmin/Manage/TrashTruck/Create';

import SuggestionList from '~/pagesSuggestionAdmin/Menu/Suggestion/SuggestionList';
import SuggestionCategoriList from '~/pagesSuggestionAdmin/Menu/Suggestion/CategoriList';
import SuggestionCategoriCreate from '~/pagesSuggestionAdmin/Menu/Suggestion/CategoriCreate';

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
    path: config.routes.feedback,
    component: Feedback,
    login: false,
    isLogin: false,
  },
  {
    path: config.routes.feedback1,
    component: Feedback1,
    login: false,
    isLogin: false,
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
  {
    path: config.routes.history,
    component: History,
    login: true,
  },
];

export const routesAdmin = [
  {
    path: config.routes.adminTrashTruck,
    component: TrashTruckList,
    login: true,
  },
  {
    path: config.routes.adminTrashTruckCreate,
    component: TrashTruckCreate,
    login: true,
  },
  {
    path: config.routes.adminWeighTruck,
    component: WeighTruck,
    login: true,
  },
  {
    path: config.routes.adminFeedbackList,
    component: FeedbackList,
    login: true,
  },
  {
    path: config.routes.adminFeedbackAnalytics,
    component: FeedbackAnalytics,
    login: true,
  },
  {
    path: config.routes.adminFeedbackRole,
    component: FeedbackRole,
    login: true,
  },
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
    path: config.routes.adminReportByShift,
    component: ReportByShift,
    login: true,
  },
  {
    path: config.routes.adminReportByTrash,
    component: ReportByTrash,
    login: true,
  },
  {
    path: config.routes.adminReportByDepartment,
    component: ReportByDepartment,
    login: true,
  },
  {
    path: config.routes.adminReportMaterials,
    component: ReportMaterials,
    login: true,
  },
  {
    path: config.routes.adminUnscannedQR,
    component: UnscannedQR,
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
  
  {
    path: config.routes.adminClassCheckHistory,
    component: HistoryClassCheck,
    login: true,
  },
  {
    path: config.routes.adminClassCheckListBin,
    component: ListBinClassCheck,
    login: true,
  },
];

export const routesInkAdmin = [
  {
    path: config.routes.adminInkWeighAnalytics,
    component: AnalyticsInk,
    login: true,
  },
  {
    path: config.routes.adminInkWeighReport,
    component: ReportInk,
    login: true,
  },
  {
    path: config.routes.adminInkWeighHistory,
    component: HistoryWeighInk,
    login: true,
  },
  {
    path: config.routes.adminInkWeighLogfile,
    component: LogfileInk,
    login: true,
  },
]

export const routesSuggest = [
  {
    path: config.routes.adminSuggestionList,
    component: SuggestionList,
    login: true,
  },
  {
    path: config.routes.adminSuggestionCategoriList,
    component: SuggestionCategoriList,
    login: true,
  },
  {
    path: config.routes.adminSuggestionCategoriCreate,
    component: SuggestionCategoriCreate,
    login: true,
  },
]
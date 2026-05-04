import config from '~/config';

import Home from '~/pages/Home';
import HomeMain from '~/pages/HomeMain';
import Login from '~/pages/Login';
import Scan from '~/pages/Scan';
import User from '~/pages/User';
import History from '~/pages/History';
import Feedback from '~/pages/Feedback';
import Feedback1 from '~/pages/Feedback1';
import ExcelToPdf from '~/pages/Utils/ExcelToPdf';
import LunchFeedbackForm from '~/pages/LunchFeedbackForm';

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

import NgienCheChou from '~/pagesAdmin/NgienCheChou';
import ExportQr from '~/pagesAdmin/ExportQr';

import Report from '~/pagesAdmin/Menu/Reports/Report';
import ReportByShift from '~/pagesAdmin/Menu/Reports/ReportByShift';
import ReportByTrash from '~/pagesAdmin/Menu/Reports/ReportTrash';
import ReportTrashAndMaterial from '~/pagesAdmin/Menu/Reports/TrashAndMaterial';
import ReportByTrashBF17 from '~/pagesAdmin/Menu/Reports/ReportTrashBF17';
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

import SortUnitByDepartment from '~/pagesAdmin/Manage/Utils/SortUnitByDepartment';
import SettingTable from '~/pagesAdmin/Manage/Utils/SettingTable';

import ListBinClassCheck from '~/pagesAdmin/Menu/ClassChecks/ListBin';
import HistoryClassCheck from '~/pagesAdmin/Menu/ClassChecks/History';

import AnalyticsInk from '~/pagesInkWeighAdmin/Dashboards/Analytics';
import ReportInk from '~/pagesInkWeighAdmin/Dashboards/Report';

import ProductionOrder from '~/pagesInkWeighAdmin/Dashboards/ProductionOrder';
import InkTransferCart from '~/pagesInkWeighAdmin/Dashboards/InkTransferCart';
import HistoryWeighInk from '~/pagesInkWeighAdmin/Dashboards/HistoryWeigh';
import HistoryWeighInkV2 from '~/pagesInkWeighAdmin/Dashboards/HistoryWeigh/v2.0';
import CompareWeighInk from '~/pagesInkWeighAdmin/Dashboards/CompareWeigh';

import ReportCartInk from '~/pagesInkWeighAdmin/Dashboards/ReportCartInk';

import LogfileInk from '~/pagesInkWeighAdmin/Dashboards/Logfile';

import FeedbackList from '~/pagesAdmin/Manage/Feedback/FeedbackList';
import FeedbackAnalytics from '~/pagesAdmin/Manage/Feedback/FeedbackAnalytics';
import FeedbackRole from '~/pagesAdmin/Manage/Feedback/FeedbackRole';

import TrashTruckList from '~/pagesAdmin/Manage/TrashTruck/List';
import TrashTruckCreate from '~/pagesAdmin/Manage/TrashTruck/Create';

import SuggestionList from '~/pagesSuggestionAdmin/Menu/Suggestion/SuggestionList';
import SuggestionCategoriList from '~/pagesSuggestionAdmin/Menu/Suggestion/CategoriList';
import SuggestionCategoriCreate from '~/pagesSuggestionAdmin/Menu/Suggestion/CategoriCreate';


import LunchOrder from '~/pagesLunchOrder/LunchOrder';
import LunchOrderProxy from '~/pagesLunchOrder/LunchOrderProxy';
import LunchOrderSearch from '~/pagesLunchOrder/Search';
import LunchOrderHistoryUser from '~/pagesLunchOrder/History';

import LunchOrderDashboard from '~/pagesLunchOrderAdmin/Dashboard';
import LunchOrderWeeklyMenu from '~/pagesLunchOrderAdmin/WeeklyMenu';
import LunchOrderFood from '~/pagesLunchOrderAdmin/Food';
import LunchOrderDepartment from '~/pagesLunchOrderAdmin/Department';
import LunchOrderAssignUserDept from '~/pagesLunchOrderAdmin/AssignUserDept';
import LunchOrderNotOrder from '~/pagesLunchOrderAdmin/NotOrder';
import LunchOrderHistory from '~/pagesLunchOrderAdmin/History';
import LunchOrderReport from '~/pagesLunchOrderAdmin/Report';
import LunchOrderReportByDay from '~/pagesLunchOrderAdmin/ReportByDay';
import LunchOrderSettingTime from '~/pagesLunchOrderAdmin/SettingTime';


import ImageCaddi from '~/pages/ImageCaddi';

import DryingCart from '~/pageDryingCart/DryingCart';

import ProductionDashboardAdmin from '~/pagesProductionAdmin/Dashboard';


import CalculateSalaryViewPayslip from '~/pagesCalculateSalary/ViewPayslip';

import AdminCalculateSalaryUploadPayrollReport from '~/pagesCalculateSalaryAdmin/UploadPayrollReport';
import AdminCalculateSalaryTypePay from '~/pagesCalculateSalaryAdmin/TypePay';
import AdminCalculateSalaryHistory from '~/pagesCalculateSalaryAdmin/History';

import Form from '~/pagesForm/Form';
import FormHistory from '~/pagesForm/FormHistory/FormHistory';

import FormCreate from '~/pagesFormAdmin/FormCreate';
import FormList from '~/pagesFormAdmin/FormList';
import FormEdit from '~/pagesFormAdmin/FormEdit';
import FormResponses from '~/pagesFormAdmin/FormResponses';
import FormResponseDetail from '~/pagesFormAdmin/FormResponseDetail';
import FormAnalytics from '~/pagesFormAdmin/FormAnalytics';
import FormDashboard from '~/pagesFormAdmin/FormDashboard';


import N20th11 from '~/pages/N20th11';

import TaskManagementDashboard from '~/pagesTaskManagement/Tasks/Dashboard';
import TaskManagementHome from '~/pagesTaskManagement/Home';

import TaskManagementMyTasks from '~/pagesTaskManagement/Tasks/MyTasks';
import TaskManagementTeamTasks from '~/pagesTaskManagement/Tasks/TeamTasks';
import TaskManagementDepartmentTasks from '~/pagesTaskManagement/Tasks/DepartmentTasks';
import TaskManagementCompanyTasks from '~/pagesTaskManagement/Tasks/CompanyTasks';
import TaskManagementRequests from '~/pagesTaskManagement/Requests/Requests';

import TaskManagementProjectList from '~/pagesTaskManagement/Projects/ProjectList';
import TaskManagementProjectOverview from '~/pagesTaskManagement/Projects/ProjectOverview';

import AdminTaskManagementDashboard from '~/pagesTaskManagementAdmin/Menu/Dashboard';

import AdminTaskManagementReportByEmployee from '~/pagesTaskManagementAdmin/Menu/ReportByEmployee';
import AdminTaskManagementReportByProject from '~/pagesTaskManagementAdmin/Menu/ReportByProeject';
import AdminTaskManagementReportByStatus from '~/pagesTaskManagementAdmin/Menu/ReportByStatus';

import AdminTaskManagementDepartments from '~/pagesTaskManagementAdmin/Manage/Departments';
import AdminTaskManagementRoles from '~/pagesTaskManagementAdmin/Manage/Roles';
import AdminTaskManagementStatuses from '~/pagesTaskManagementAdmin/Manage/Statuses';
import AdminTaskManagementTeams from '~/pagesTaskManagementAdmin/Manage/Teams';
import AdminTaskManagementUserRoles from '~/pagesTaskManagementAdmin/Manage/UserRoles';

import BMI from '~/pagesBMI/BMI';
import BMICheck from '~/pagesBMI/Check';
import BMIDashboard from '~/pagesBMI/Dashboard';
import BMIPlan from '~/pagesBMI/Plan';
import BMIProfile from '~/pagesBMI/Profile';

import InkCovPerOnFilm from '~/pagesInkCovPerOnFilm/InkCovPerOnFilm';
import uploadFileFilm from '~/pagesInkCovPerOnFilm/uploadFileFilm';

import QualityInspectionOQC from '~/pagesQualityInspectionOQC/Home';
import QualityInspectionOQCResult from '~/pagesQualityInspectionOQC/Results';
import QualityInspectionOQCManual from '~/pagesQualityInspectionOQC/Manual';

import AdminHistoryOQC from '~/pagesQualityInspectionOQCAdmin/History';

import QualityInspectionKCS from '~/pagesQualityInspectionKCS/Home';
import QualityInspectionKCSResult from '~/pagesQualityInspectionKCS/Results';
import QualityInspectionKCSManual from '~/pagesQualityInspectionKCS/Manual';

import AdminHistoryKCS from '~/pagesQualityInspectionKCSAdmin/History';

import Consolidate from '~/pagesConsolidate/Home';
import ConsolidateTickTime from '~/pagesConsolidate/Tick';
import ConsolidateManualTime from '~/pagesConsolidate/Manual';

import AdminHistoryConsolidate from '~/pagesConsolidateAdmin/History';

import AdminMesFlow from '~/pagesMESAdmin/Flow';
import AdminMesDashboard from '~/pagesMESAdmin/Dashboard';

import CapMoneyHome from '~/pageCapMoney/Home';
import CapMoneyStatistic from '~/pageCapMoney/Statistic';
import CapMoneyAccount from '~/pageCapMoney/Account';
import CapMoneyBudget from '~/pageCapMoney/Budget';
import CapMoneyPersonal from '~/pageCapMoney/Personal';

import TheSanXuatMaPhan from '~/pages/utilsMrTuy/MrTuy/TheSanXuatMaPhan';
import FormTestRun from '~/pages/utilsMrTuy/MrTuy/FormTestRun';
import FormReady from '~/pages/utilsMrTuy/MrTuy/FormReady';
import A6Card from '~/pages/utilsMrTuy/MrTuy/A6Card';

const routesCapMoney = [
  {
    path: config.routes.capmoneyHome,
    component: CapMoneyHome,
    login: true,
    module: 'capmoney',
  },
  {
    path: config.routes.capmoneyStatistic,
    component: CapMoneyStatistic,
    login: true,
    module: 'capmoney',
  },
  {
    path: config.routes.capmoneyAccount,
    component: CapMoneyAccount,
    login: true,
    module: 'capmoney',
  },
  {
    path: config.routes.capmoneyBudget,
    component: CapMoneyBudget,
    login: true,
    module: 'capmoney',
  },
  {
    path: config.routes.capmoneyPersonal,
    component: CapMoneyPersonal,
    login: true,
    module: 'capmoney',
  },
]

const routesConsolidate = [
  {
    path: config.routes.consolidate,
    component: Consolidate,
    login: true,
    module: 'consolidate',
  },
  {
    path: config.routes.consolidateTickTime,
    component: ConsolidateTickTime,
    login: true,
    module: 'consolidate',
  },
  {
    path: config.routes.consolidateManualTime,
    component: ConsolidateManualTime,
    login: true,
    module: 'consolidate',
  },
]

const routesQualityInspectionKCS = [
  {
    path: config.routes.qualityInspectionKCS,
    component: QualityInspectionKCS,
    login: true,
    module: 'qualityInspectionKCS',
  },
  {
    path: config.routes.qualityInspectionKCSResult,
    component: QualityInspectionKCSResult,
    login: true,
    module: 'qualityInspectionKCS',
  },
  {
    path: config.routes.qualityInspectionKCSManual,
    component: QualityInspectionKCSManual,
    login: true,
    module: 'qualityInspectionKCS',
  },
]

const routesQualityInspectionOQC = [
  {
    path: config.routes.qualityInspectionOQC,
    component: QualityInspectionOQC,
    login: true,
    module: 'qualityInspectionOQC',
  },
  {
    path: config.routes.qualityInspectionOQCResult,
    component: QualityInspectionOQCResult,
    login: true,
    module: 'qualityInspectionOQC',
  },
  {
    path: config.routes.qualityInspectionOQCManual,
    component: QualityInspectionOQCManual,
    login: true,
    module: 'qualityInspectionOQC',
  },
]

const routesInkCovPerOnFilm = [
  {
    path: config.routes.inkCovPerOnFilm,
    component: InkCovPerOnFilm,
    login: true,
    module: 'inkCovPerOnFilm',
  },
  {
    path: config.routes.uploadFileFilm,
    component: uploadFileFilm,
    login: true,
    module: 'inkCovPerOnFilm',
  },
]

const routesBMI = [
  {
    path: config.routes.bmi,
    component: BMI,
    login: true,
    module: 'bmi',
  },
  {
    path: config.routes.bmiCheck,
    component: BMICheck,
    login: true,
    module: 'bmi',
  },
  {
    path: config.routes.bmiDashboard,
    component: BMIDashboard,
    login: true,
    module: 'bmi',
  },
  {
    path: config.routes.bmiPlan,
    component: BMIPlan,
    login: true,
    module: 'bmi',
  },
  {
    path: config.routes.bmiProfile,
    component: BMIProfile,
    login: true,
    module: 'bmi',
  },
]

const routesTaskManagement = [
  {
    path: config.routes.taskManagementHome,
    component: TaskManagementHome,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementDashboard,
    component: TaskManagementDashboard,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementMyTasks,
    component: TaskManagementMyTasks,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementTeamTasks,
    component: TaskManagementTeamTasks,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementDepartmentTasks,
    component: TaskManagementDepartmentTasks,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementCompanyTasks,
    component: TaskManagementCompanyTasks,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementRequests,
    component: TaskManagementRequests,
    login: true,
    module: 'quanlycongviec',
  },

  {
    path: config.routes.taskManagementProjectList,
    component: TaskManagementProjectList,
    login: true,
    module: 'quanlycongviec',
  },
  {
    path: config.routes.taskManagementProjectOverview,
    component: TaskManagementProjectOverview,
    login: true,
    module: 'quanlycongviec',
    addId: true,
  },
]

export const routesTaskManagementAdmin = [
  {
    path: config.routes.adminTaskManagementDashboard,
    component: AdminTaskManagementDashboard,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementDepartments,
    component: AdminTaskManagementDepartments,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementTeams,
    component: AdminTaskManagementTeams,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementRoles,
    component: AdminTaskManagementRoles,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementUserRoles,
    component: AdminTaskManagementUserRoles,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementStatuses,
    component: AdminTaskManagementStatuses,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementReportByEmployee,
    component: AdminTaskManagementReportByEmployee,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementReportByProject,
    component: AdminTaskManagementReportByProject,
    login: true,
  },
  {
    path: config.routes.adminTaskManagementReportByStatus,
    component: AdminTaskManagementReportByStatus,
    login: true,
  },
]

export const routes = [
  {
    path: config.routes.utilsMrTuyA6Card,
    component: A6Card,
    login: false,
    isLogin: false,
  },
  {
    path: config.routes.utilsMrTuyFormReady,
    component: FormReady,
    login: false,
    isLogin: false,
  },
  {
    path: config.routes.utilsMrTuyFormTestRun,
    component: FormTestRun,
    login: false,
    isLogin: false,
  },
  {
    path: config.routes.utilsMrTuyTheSanXuatMaPhan,
    component: TheSanXuatMaPhan,
    login: false,
    isLogin: false,
  },
  {
    path: config.routes.home,
    component: Home,
    login: true,
  },
  {
    path: config.routes.homeMain,
    component: HomeMain,
    login: true,
    isLogin: true,
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
    module: 'suggestion',
  },
  {
    path: config.routes.feedback1,
    component: Feedback1,
    login: false,
    isLogin: false,
    module: 'suggestion',
  },
  {
    path: config.routes.feedbackLunch,
    component: LunchFeedbackForm,
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
  {
    path: config.routes.excelToPdf,
    component: ExcelToPdf,
    login: false,
    isLogin: false,
  },

  {
    path: config.routes.lunchOrder,
    component: LunchOrder,
    login: true,
    module: 'datcom',
  },
  {
    path: config.routes.lunchOrderHistory,
    component: LunchOrderHistoryUser,
    login: true,
    module: 'datcom',
  },
  {
    path: config.routes.lunchOrderProxy,
    component: LunchOrderProxy,
    login: true,
    module: 'datcom',
  },
  {
    path: config.routes.lunchSearch,
    component: LunchOrderSearch,
    login: true,
    module: 'datcom',
  },

  
  {
    path: config.routes.imageCaddi,
    component: ImageCaddi,
    login: true,
    module: 'imageCaddi',
  },

  
  {
    path: config.routes.dryingCart,
    component: DryingCart,
    login: true,
    module: 'dryingCart',
  },

  
  {
    path: config.routes.calculateSalaryViewPayslip,
    component: CalculateSalaryViewPayslip,
    login: true,
    module: 'tinhluong',
  },

  
  {
    path: config.routes.formHistory,
    component: FormHistory,
    login: true,
    module: 'bieumaunoibo',
  },
  {
    path: config.routes.form,
    component: Form,
    login: false,
    isLogin: false,
    module: 'bieumaunoibo',
    addId: true,
  },
  {
    path: config.routes.form,
    component: Form,
    login: false,
    isLogin: false,
    module: 'bieumaunoibo',
  },

  
  {
    path: config.routes.n20th11,
    component: N20th11,
    login: false,
    isLogin: false,
  },

  ...routesTaskManagement,

  ...routesBMI,

  ...routesInkCovPerOnFilm,

  ...routesQualityInspectionOQC,

  ...routesQualityInspectionKCS,

  ...routesConsolidate,

  ...routesCapMoney,

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
    path: config.routes.adminReportTrashAndMaterial,
    component: ReportTrashAndMaterial,
    login: true,
  },
  {
    path: config.routes.adminReportByTrashBF17,
    component: ReportByTrashBF17,
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
  
  {
    path: config.routes.adminSortUnitByDepartment,
    component: SortUnitByDepartment,
    login: true,
  },
  {
    path: config.routes.adminSettingTable,
    component: SettingTable,
    login: true,
  },

  {
    path: config.routes.adminNgienCheChou,
    component: NgienCheChou,
    login: true,
  },

  {
    path: config.routes.adminExportQR,
    component: ExportQr,
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
    path: config.routes.adminInkWeighProductionOrder,
    component: ProductionOrder,
    login: true,
  },
  {
    path: config.routes.adminInkWeighInkTransferCart,
    component: InkTransferCart,
    login: true,
  },
  {
    path: config.routes.adminInkWeighHistory,
    component: HistoryWeighInkV2,
    login: true,
  },
  {
    path: config.routes.adminInkWeigCompare,
    component: CompareWeighInk,
    login: true,
  },
  {
    path: config.routes.adminReportCartInk,
    component: ReportCartInk,
    login: true,
  },
  {
    path: config.routes.adminInkWeighLogfile,
    component: LogfileInk,
    login: true,
  },
]


export const routesMesAdmin = [
  {
    path: config.routes.adminMesDashboard,
    component: AdminMesDashboard,
    login: true,
  },
  {
    path: config.routes.adminMesFlow,
    component: AdminMesFlow,
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


export const routesLunchOrderAdmin = [
  {
    path: config.routes.adminLunchOrderDashboard,
    component: LunchOrderDashboard,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderWeeklyMenu,
    component: LunchOrderWeeklyMenu,
    login: true,
  },

  {
    path: config.routes.adminLunchOrderFood,
    component: LunchOrderFood,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderDepartment,
    component: LunchOrderDepartment,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderAssignUserDept,
    component: LunchOrderAssignUserDept,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderNotOrder,
    component: LunchOrderNotOrder,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderHistory,
    component: LunchOrderHistory,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderReport,
    component: LunchOrderReport,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderReportByDay,
    component: LunchOrderReportByDay,
    login: true,
  },
  {
    path: config.routes.adminLunchOrderSettingTime,
    component: LunchOrderSettingTime,
    login: true,
  },
]


export const routesProductionAdmin = [
  {
    path: config.routes.adminProductionDashboard,
    component: ProductionDashboardAdmin,
    login: true,
  },
]


export const routesCalculateSalaryAdmin = [
  {
    path: config.routes.adminCalculateSalaryUploadPayrollReport,
    component: AdminCalculateSalaryUploadPayrollReport,
    login: true,
  },
  {
    path: config.routes.adminCalculateSalaryTypePay,
    component: AdminCalculateSalaryTypePay,
    login: true,
  },
  {
    path: config.routes.adminCalculateSalaryHistory,
    component: AdminCalculateSalaryHistory,
    login: true,
  },
]

export const routesFormAdmin = [
  {
    path: config.routes.adminFormDashboard,
    component: FormDashboard,
    login: true,
  },
  {
    path: config.routes.adminFormCreate,
    component: FormCreate,
    login: true,
  },
  {
    path: config.routes.adminFormList,
    component: FormList,
    login: true,
  },
  {
    path: config.routes.adminFormEdit,
    component: FormEdit,
    login: true,
    addId: true,
  },
  {
    path: config.routes.adminFormResponses,
    component: FormResponses,
    login: true,
    addId: true,
  },
  {
    path: config.routes.adminFormResponseDetail,
    component: FormResponseDetail,
    login: true,
    addId: true,
  },
  {
    path: config.routes.adminFormAnalytics,
    component: FormAnalytics,
    login: true,
  },
]

export const routesKCSAdmin = [
  {
    path: config.routes.adminHistoryKCS,
    component: AdminHistoryKCS,
    login: true,
  },
]

export const routesOQCAdmin = [
  {
    path: config.routes.adminHistoryOQC,
    component: AdminHistoryOQC,
    login: true,
  },
]

export const routesConsolidateAdmin = [
  {
    path: config.routes.adminHistoryConsolidate,
    component: AdminHistoryConsolidate,
    login: true,
  },
]

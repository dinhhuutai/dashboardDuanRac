import config from '~/config';
import lazyPage from '~/utils/lazyPage';

// Trang đầu tiên người dùng thấy — nạp sẵn để không phải chờ thêm 1 lượt tải.
// Mọi trang khác tải theo nhu cầu (code splitting) để giảm dung lượng JS ban đầu.
import HomeMain from '~/pages/HomeMain';
import Login from '~/pages/Login';

const Home = lazyPage(() => import('~/pages/Home'));
const Scan = lazyPage(() => import('~/pages/Scan'));
const User = lazyPage(() => import('~/pages/User'));
const History = lazyPage(() => import('~/pages/History'));
const Feedback = lazyPage(() => import('~/pages/Feedback'));
const Feedback1 = lazyPage(() => import('~/pages/Feedback1'));
const ExcelToPdf = lazyPage(() => import('~/pages/Utils/ExcelToPdf'));
const LunchFeedbackForm = lazyPage(() => import('~/pages/LunchFeedbackForm'));

const QrcodeCreate = lazyPage(() => import('~/pagesAdmin/Manage/Qrcode/Create'));
const QrcodeList = lazyPage(() => import('~/pagesAdmin/Manage/Qrcode/List'));
const QrcodeUpdate = lazyPage(() => import('~/pagesAdmin/Manage/Qrcode/Update'));
const UserCreate = lazyPage(() => import('~/pagesAdmin/Manage/User/Create'));
const UserList = lazyPage(() => import('~/pagesAdmin/Manage/User/List'));
const UserUpdate = lazyPage(() => import('~/pagesAdmin/Manage/User/Update'));
const Chat = lazyPage(() => import('~/pagesAdmin/Menu/Applications/Chat'));
const MailBox = lazyPage(() => import('~/pagesAdmin/Menu/Applications/MailBox'));
const Section = lazyPage(() => import('~/pagesAdmin/Menu/Applications/Section'));
const Analytics = lazyPage(() => import('~/pagesAdmin/Menu/Dashboards/Analytics'));
const HistoryWeigh = lazyPage(() => import('~/pagesAdmin/Menu/Dashboards/HistoryWeigh'));

const NgienCheChou = lazyPage(() => import('~/pagesAdmin/NgienCheChou'));
const ExportQr = lazyPage(() => import('~/pagesAdmin/ExportQr'));

const Report = lazyPage(() => import('~/pagesAdmin/Menu/Reports/Report'));
const ReportByShift = lazyPage(() => import('~/pagesAdmin/Menu/Reports/ReportByShift'));
const ReportByTrash = lazyPage(() => import('~/pagesAdmin/Menu/Reports/ReportTrash'));
const ReportTrashAndMaterial = lazyPage(() => import('~/pagesAdmin/Menu/Reports/TrashAndMaterial'));
const ReportByTrashBF17 = lazyPage(() => import('~/pagesAdmin/Menu/Reports/ReportTrashBF17'));
const ReportByDepartment = lazyPage(() => import('~/pagesAdmin/Menu/Reports/ReportDepartment'));
const ReportMaterials = lazyPage(() => import('~/pagesAdmin/Menu/Reports/ReportMaterials'));

const UnscannedQR = lazyPage(() => import('~/pagesAdmin/Menu/Dashboards/UnscannedQR'));
const WeighTruck = lazyPage(() => import('~/pagesAdmin/Menu/Dashboards/WeighTruck'));
const AdminHome = lazyPage(() => import('~/pagesAdmin/Menu/Pages/Home'));
const AdminScan = lazyPage(() => import('~/pagesAdmin/Menu/Pages/Scan'));
const AdminUser = lazyPage(() => import('~/pagesAdmin/Menu/Pages/User'));
const TrashTypeList = lazyPage(() => import('~/pagesAdmin/Manage/TrashType/List'));
const TrashTypeCreate = lazyPage(() => import('~/pagesAdmin/Manage/TrashType/Create'));
const TrashTypeUpdate = lazyPage(() => import('~/pagesAdmin/Manage/TrashType/Update'));
const TeamMemberList = lazyPage(() => import('~/pagesAdmin/Manage/TeamMember/List'));
const TeamMemberCreate = lazyPage(() => import('~/pagesAdmin/Manage/TeamMember/Create'));

const SortUnitByDepartment = lazyPage(() => import('~/pagesAdmin/Manage/Utils/SortUnitByDepartment'));
const SettingTable = lazyPage(() => import('~/pagesAdmin/Manage/Utils/SettingTable'));

const ListBinClassCheck = lazyPage(() => import('~/pagesAdmin/Menu/ClassChecks/ListBin'));
const HistoryClassCheck = lazyPage(() => import('~/pagesAdmin/Menu/ClassChecks/History'));

const AnalyticsInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/Analytics'));
const ReportInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/Report'));

const ProductionOrder = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/ProductionOrder'));
const InkTransferCart = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/InkTransferCart'));
const HistoryWeighInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/HistoryWeigh'));
const HistoryWeighInkV2 = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/HistoryWeigh/v2.0'));
const CompareWeighInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/CompareWeigh'));

const ReportCartInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/ReportCartInk'));

const LogfileInk = lazyPage(() => import('~/pagesInkWeighAdmin/Dashboards/Logfile'));

const FeedbackList = lazyPage(() => import('~/pagesAdmin/Manage/Feedback/FeedbackList'));
const FeedbackAnalytics = lazyPage(() => import('~/pagesAdmin/Manage/Feedback/FeedbackAnalytics'));
const FeedbackRole = lazyPage(() => import('~/pagesAdmin/Manage/Feedback/FeedbackRole'));

const TrashTruckList = lazyPage(() => import('~/pagesAdmin/Manage/TrashTruck/List'));
const TrashTruckCreate = lazyPage(() => import('~/pagesAdmin/Manage/TrashTruck/Create'));

const SuggestionList = lazyPage(() => import('~/pagesSuggestionAdmin/Menu/Suggestion/SuggestionList'));
const SuggestionCategoriList = lazyPage(() => import('~/pagesSuggestionAdmin/Menu/Suggestion/CategoriList'));
const SuggestionCategoriCreate = lazyPage(() => import('~/pagesSuggestionAdmin/Menu/Suggestion/CategoriCreate'));


const LunchOrder = lazyPage(() => import('~/pagesLunchOrder/LunchOrder'));
const LunchOrderProxy = lazyPage(() => import('~/pagesLunchOrder/LunchOrderProxy'));
const LunchOrderSearch = lazyPage(() => import('~/pagesLunchOrder/Search'));
const LunchOrderHistoryUser = lazyPage(() => import('~/pagesLunchOrder/History'));

const LunchOrderDashboard = lazyPage(() => import('~/pagesLunchOrderAdmin/Dashboard'));
const LunchOrderWeeklyMenu = lazyPage(() => import('~/pagesLunchOrderAdmin/WeeklyMenu'));
const LunchOrderFood = lazyPage(() => import('~/pagesLunchOrderAdmin/Food'));
const LunchOrderDepartment = lazyPage(() => import('~/pagesLunchOrderAdmin/Department'));
const LunchOrderAssignUserDept = lazyPage(() => import('~/pagesLunchOrderAdmin/AssignUserDept'));
const LunchOrderNotOrder = lazyPage(() => import('~/pagesLunchOrderAdmin/NotOrder'));
const LunchOrderHistory = lazyPage(() => import('~/pagesLunchOrderAdmin/History'));
const LunchOrderReport = lazyPage(() => import('~/pagesLunchOrderAdmin/Report'));
const LunchOrderReportByDay = lazyPage(() => import('~/pagesLunchOrderAdmin/ReportByDay'));
const LunchOrderSettingTime = lazyPage(() => import('~/pagesLunchOrderAdmin/SettingTime'));


const ImageCaddi = lazyPage(() => import('~/pages/ImageCaddi'));

const DryingCart = lazyPage(() => import('~/pageDryingCart/DryingCart'));

const ProductionDashboardAdmin = lazyPage(() => import('~/pagesProductionAdmin/Dashboard'));


const CalculateSalaryViewPayslip = lazyPage(() => import('~/pagesCalculateSalary/ViewPayslip'));

const AdminCalculateSalaryUploadPayrollReport = lazyPage(() => import('~/pagesCalculateSalaryAdmin/UploadPayrollReport'));
const AdminCalculateSalaryTypePay = lazyPage(() => import('~/pagesCalculateSalaryAdmin/TypePay'));
const AdminCalculateSalaryHistory = lazyPage(() => import('~/pagesCalculateSalaryAdmin/History'));

// Module 9 — Biểu mẫu nội bộ
const MyForms = lazyPage(() => import('~/pagesForm/MyForms'));
const FormFill = lazyPage(() => import('~/pagesForm/FormFill'));
const AdminFormList = lazyPage(() => import('~/pagesFormAdmin/FormList'));
const AdminFormBuilder = lazyPage(() => import('~/pagesFormAdmin/FormBuilder'));
const AdminFormResults = lazyPage(() => import('~/pagesFormAdmin/FormResults'));
const AdminFormOrg = lazyPage(() => import('~/pagesFormAdmin/OrgManagement'));


const N20th11 = lazyPage(() => import('~/pages/N20th11'));

const TaskManagementDashboard = lazyPage(() => import('~/pagesTaskManagement/Tasks/Dashboard'));
const TaskManagementHome = lazyPage(() => import('~/pagesTaskManagement/Home'));

const TaskManagementMyTasks = lazyPage(() => import('~/pagesTaskManagement/Tasks/MyTasks'));
const TaskManagementTeamTasks = lazyPage(() => import('~/pagesTaskManagement/Tasks/TeamTasks'));
const TaskManagementDepartmentTasks = lazyPage(() => import('~/pagesTaskManagement/Tasks/DepartmentTasks'));
const TaskManagementCompanyTasks = lazyPage(() => import('~/pagesTaskManagement/Tasks/CompanyTasks'));
const TaskManagementRequests = lazyPage(() => import('~/pagesTaskManagement/Requests/Requests'));

const TaskManagementProjectList = lazyPage(() => import('~/pagesTaskManagement/Projects/ProjectList'));
const TaskManagementProjectOverview = lazyPage(() => import('~/pagesTaskManagement/Projects/ProjectOverview'));

const AdminTaskManagementDashboard = lazyPage(() => import('~/pagesTaskManagementAdmin/Menu/Dashboard'));

const AdminTaskManagementReportByEmployee = lazyPage(() => import('~/pagesTaskManagementAdmin/Menu/ReportByEmployee'));
const AdminTaskManagementReportByProject = lazyPage(() => import('~/pagesTaskManagementAdmin/Menu/ReportByProeject'));
const AdminTaskManagementReportByStatus = lazyPage(() => import('~/pagesTaskManagementAdmin/Menu/ReportByStatus'));

const AdminTaskManagementDepartments = lazyPage(() => import('~/pagesTaskManagementAdmin/Manage/Departments'));
const AdminTaskManagementRoles = lazyPage(() => import('~/pagesTaskManagementAdmin/Manage/Roles'));
const AdminTaskManagementStatuses = lazyPage(() => import('~/pagesTaskManagementAdmin/Manage/Statuses'));
const AdminTaskManagementTeams = lazyPage(() => import('~/pagesTaskManagementAdmin/Manage/Teams'));
const AdminTaskManagementUserRoles = lazyPage(() => import('~/pagesTaskManagementAdmin/Manage/UserRoles'));

const BMI = lazyPage(() => import('~/pagesBMI/BMI'));
const BMICheck = lazyPage(() => import('~/pagesBMI/Check'));
const BMIDashboard = lazyPage(() => import('~/pagesBMI/Dashboard'));
const BMIPlan = lazyPage(() => import('~/pagesBMI/Plan'));
const BMIProfile = lazyPage(() => import('~/pagesBMI/Profile'));

const InkCovPerOnFilm = lazyPage(() => import('~/pagesInkCovPerOnFilm/InkCovPerOnFilm'));
const uploadFileFilm = lazyPage(() => import('~/pagesInkCovPerOnFilm/uploadFileFilm'));

const QualityInspectionOQC = lazyPage(() => import('~/pagesQualityInspectionOQC/Home'));
const QualityInspectionOQCResult = lazyPage(() => import('~/pagesQualityInspectionOQC/Results'));
const QualityInspectionOQCManual = lazyPage(() => import('~/pagesQualityInspectionOQC/Manual'));

const AdminHistoryOQC = lazyPage(() => import('~/pagesQualityInspectionOQCAdmin/History'));

const QualityInspectionKCS = lazyPage(() => import('~/pagesQualityInspectionKCS/Home'));
const QualityInspectionKCSResult = lazyPage(() => import('~/pagesQualityInspectionKCS/Results'));
const QualityInspectionKCSManual = lazyPage(() => import('~/pagesQualityInspectionKCS/Manual'));

const AdminHistoryKCS = lazyPage(() => import('~/pagesQualityInspectionKCSAdmin/History'));

const Consolidate = lazyPage(() => import('~/pagesConsolidate/Home'));
const ConsolidateTickTime = lazyPage(() => import('~/pagesConsolidate/Tick'));
const ConsolidateManualTime = lazyPage(() => import('~/pagesConsolidate/Manual'));

const AdminHistoryConsolidate = lazyPage(() => import('~/pagesConsolidateAdmin/History'));

const AdminMesFlow = lazyPage(() => import('~/pagesMESAdmin/Flow'));
const AdminMesDashboard = lazyPage(() => import('~/pagesMESAdmin/Dashboard'));

const CapMoneyHome = lazyPage(() => import('~/pageCapMoney/Home'));
const CapMoneyStatistic = lazyPage(() => import('~/pageCapMoney/Statistic'));
const CapMoneyAccount = lazyPage(() => import('~/pageCapMoney/Account'));
const CapMoneyBudget = lazyPage(() => import('~/pageCapMoney/Budget'));
const CapMoneyPersonal = lazyPage(() => import('~/pageCapMoney/Personal'));

const TheSanXuatMaPhan = lazyPage(() => import('~/pages/utilsMrTuy/MrTuy/TheSanXuatMaPhan'));
const FormTestRun = lazyPage(() => import('~/pages/utilsMrTuy/MrTuy/FormTestRun'));
const FormReady = lazyPage(() => import('~/pages/utilsMrTuy/MrTuy/FormReady'));
const A6Card = lazyPage(() => import('~/pages/utilsMrTuy/MrTuy/A6Card'));

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
    path: config.routes.form,
    component: MyForms,
    login: true,
    module: 'bieumaunoibo',
  },
  {
    path: config.routes.formFill,
    component: FormFill,
    login: true,
    module: 'bieumaunoibo',
    addId: true,
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
    path: config.routes.adminFormList,
    component: AdminFormList,
    login: true,
  },
  {
    path: config.routes.adminFormBuilder,
    component: AdminFormBuilder,
    login: true,
  },
  {
    path: config.routes.adminFormBuilder,
    component: AdminFormBuilder,
    login: true,
    addId: true,
  },
  {
    path: config.routes.adminFormResults,
    component: AdminFormResults,
    login: true,
    addId: true,
  },
  {
    path: config.routes.adminFormOrg,
    component: AdminFormOrg,
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

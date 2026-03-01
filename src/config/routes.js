const routes = {
  login: '/login',
  scan: '/scan',
  home: '/trash',
  user: '/user',
  history: '/history',
  feedback: '/feedback-1',
  feedback1: '/feedback',
  excelToPdf: '/excelToPdf',
  homeMain: '/',
  feedbackLunch: '/feedback-lunch',

  adminAnalytics: '/admin/menu/dashboard/analytics',
  adminReport: '/admin/menu/dashboard/report',
  adminReportByShift: '/admin/menu/dashboard/report-by-shift',
  adminReportByTrash: '/admin/menu/dashboard/report-by-trash',
  adminReportByTrashBF17: '/admin/menu/dashboard/report-by-trash-bf17',
  adminReportByDepartment: '/admin/menu/dashboard/report-by-department',
  adminReportMaterials: '/admin/menu/dashboard/report-materials',
  adminHistoryWeigh: '/admin/menu/dashboard/historyWeigh',
  adminUnscannedQR: '/admin/menu/dashboard/unscannedQR',
  adminWeighTruck: '/admin/menu/dashboard/weighTruck',

  adminClassCheckHistory: '/admin/menu/classification-check/history',
  adminClassCheckListBin: '/admin/menu/classification-check/list-bin',
  
  adminPageHome: '/admin/menu/pages/home',
  adminPageScan: '/admin/menu/pages/scan',
  adminPageUser: '/admin/menu/pages/user',

  adminMailBox: '/admin/menu/application/mailbox',
  adminChat: '/admin/menu/application/chat',
  adminSection: '/admin/menu/application/section',

  adminQrcode: '/admin/manage/qrcode/list',
  adminQrcodeCreate: '/admin/manage/qrcode/create',
  adminQrcodeUpdate: '/admin/manage/qrcode/update',

  adminUser: '/admin/manage/user/list',
  adminUserCreate: '/admin/manage/user/create',
  adminUserUpdate: '/admin/manage/user/update',

  adminTrashTruck: '/admin/manage/trashtruck/list',
  adminTrashTruckCreate: '/admin/manage/trashtruck/create',
  adminTrashTruckUpdate: '/admin/manage/trashtruck/update',

  adminTrashType: '/admin/manage/trashtype/list',
  adminTrashTypeCreate: '/admin/manage/trashtype/create',
  adminTrashTypeUpdate: '/admin/manage/trashtype/update',

  adminTeamMember: '/admin/manage/teammember/list',
  adminTeamMemberCreate: '/admin/manage/teammember/create',

  adminSortUnitByDepartment : '/admin/manage/utils/sort-unit-by-department',
  adminSettingTable : '/admin/manage/utils/setting-table',


  adminInkWeighAnalytics: '/admin/menu/dashboard/ink-weigh/analytics',
  adminInkWeighReport: '/admin/menu/dashboard/ink-weigh/report',
  
  adminInkWeighProductionOrder: '/admin/menu/dashboard/ink-weigh/production-order',
  adminInkWeighInkTransferCart: '/admin/menu/dashboard/ink-weigh/ink-transfer-cart',
  adminInkWeighHistory: '/admin/menu/dashboard/ink-weigh/history',
  adminInkWeigCompare: '/admin/menu/dashboard/ink-weigh/compare',

  adminReportCartInk: '/admin/menu/dashboard/ink-weigh/reportCartInk',

  adminInkWeighLogfile: '/admin/menu/dashboard/ink-weigh/logfile',
  
  adminFeedbackList: '/admin/manage/list-feedback',
  adminFeedbackAnalytics: '/admin/manage/analytics-feedback',
  adminFeedbackRole: '/admin/manage/role-feedback',

  
  adminSuggestionCategoriCreate: '/admin/menu/suggestion/categori/create',
  adminSuggestionCategoriList: '/admin/menu/suggestion/categori/list',
  adminSuggestionList: '/admin/menu/suggestion/create',
  
  adminNgienCheChou: '/admin/trash/Ngien-Che-chou',
  adminExportQR: '/admin/trash/export-qr',

  lunchOrder: '/lunch-order/me',
  lunchOrderHistory: '/lunch-order/history',
  lunchOrderProxy: '/lunch-order/proxy',
  lunchSearch: '/lunch-order/search',

  adminLunchOrderDashboard: '/admin/lunch-order/dashboard',
  adminLunchOrderWeeklyMenu: '/admin/lunch-order/weekly-menu',
  adminLunchOrderFood: '/admin/lunch-order/foods',
  adminLunchOrderDepartment: '/admin/lunch-order/department',
  adminLunchOrderAssignUserDept: '/admin/lunch-order/assign-user-dept',
  adminLunchOrderNotOrder: '/admin/lunch-order/not-order',
  adminLunchOrderHistory: '/admin/lunch-order/history',
  adminLunchOrderReport: '/admin/lunch-order/report',
  adminLunchOrderReportByDay: '/admin/lunch-order/report-by-day',


  imageCaddi: '/image-caddi',


  adminProductionDashboard: '/admin/production/dashboard',


  adminCalculateSalaryUploadPayrollReport: '/admin/calculate-salary/upload-payroll-report',
  calculateSalaryViewPayslip: '/me/view-payslip',
  
  
  form: '/form',

  adminFormCreate: '/admin/form/create',
  adminFormList: '/admin/form/list',
  adminFormEdit: '/admin/form/edit',
  adminFormResponses: '/admin/form/responses',
  adminFormResponseDetail: '/admin/form/response-detail',
  adminFormAnalytics: '/admin/form/analyics',
  

  n20th11: '/luu-thi-thao-nguyen/20-10',


  taskManagement: '/task-management',

  taskManagementDashboard: '/task-management/dashboard',
  
  taskManagementMyTasks: '/task-management/my-tasks',
  taskManagementTeamTasks: '/task-management/team-tasks',
  taskManagementDepartmentTasks: '/task-management/department-tasks',
  taskManagementCompanyTasks: '/task-management/company-tasks',

  taskManagementProjectList: '/task-management/project-list',
  taskManagementProjectOverview: '/task-management/project-overview',

  adminTaskManagementDashboard: '/admin/task-management/dashboard',
  
  adminTaskManagementReportByEmployee: '/admin/task-management/report-by-employee',
  adminTaskManagementReportByProject: '/admin/task-management/report-by-project',
  adminTaskManagementReportByStatus: '/admin/task-management/report-by-status',
  
  adminTaskManagementDepartments: '/admin/task-management/departments',
  adminTaskManagementTeams: '/admin/task-management/teams',

  adminTaskManagementRoles: '/admin/task-management/roles',
  adminTaskManagementUserRoles: '/admin/task-management/user-roles',

  adminTaskManagementStatuses: '/admin/task-management/statuses',


  dryingCart: '/drying-cart',

  bmi: '/bmi',
  bmiCheck: '/bmi/check',
  bmiPlan: '/bmi/plan',
  bmiDashboard: '/bmi/dashboard',
  bmiProfile: '/bmi/profile',

  inkCovPerOnFilm: '/ink-coverage-percent-on-film',
  uploadFileFilm: '/upload-file-film',

  qualityInspectionOQC: '/quality-inspection/oqc/home',
  qualityInspectionOQCResult: '/quality-inspection/oqc/result',
  qualityInspectionKCS: '/quality-inspection/kcs', 
};

export default routes;

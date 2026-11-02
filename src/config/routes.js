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
  adminReportTrashAndMaterial: '/admin/menu/dashboard/report-trash-and-material',
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
  adminLunchOrderSettingTime: '/admin/lunch-order/setting-time',


  imageCaddi: '/image-caddi',


  adminProductionDashboard: '/admin/production/dashboard',


  adminCalculateSalaryUploadPayrollReport: '/admin/calculate-salary/upload-payroll-report',
  adminCalculateSalaryTypePay: '/admin/calculate-salary/type-pay',
  adminCalculateSalaryHistory: '/admin/calculate-salary/history',
  calculateSalaryViewPayslip: '/me/view-payslip',
  
  
  // Module 9 — Biểu mẫu nội bộ
  form: '/form',                          // danh sách biểu mẫu của tôi
  formFill: '/form/fill',                 // /form/fill/:id

  adminFormList: '/admin/form/list',
  adminFormBuilder: '/admin/form/builder', // tạo mới; /admin/form/builder/:id = sửa
  adminFormResults: '/admin/form/results', // /admin/form/results/:id
  adminFormOrg: '/admin/form/org',         // phòng ban, chức danh, gán cho nhân viên

  // Module 18 — Quản lý đề xuất (đề xuất / duyệt / chat)
  request: '/request',                     // ?box=inbox|mine|processed|following|all &id=…
  requestNew: '/request/new',              // ?type=ID
  requestEdit: '/request/edit',            // /request/edit/:id — sửa & gửi lại
  requestChat: '/request/chat',            // ?c=conversationId
  requestReports: '/request/reports',      // + /:id — xem báo cáo
  adminRequestReportBuilder: '/admin/request/report-builder', // + /:id — thiết kế báo cáo
  adminRequestTypes: '/admin/request/types',
  adminRequestTypeBuilder: '/admin/request/type-builder', // + /:id
  adminRequestHeads: '/admin/request/heads',
  adminRequestOrg: '/admin/request/org',
  adminRequestStats: '/admin/request/stats',
  adminRequestImport: '/admin/request/import', // nhập đề xuất cũ từ Base Request (tệp Excel)


  n20th11: '/luu-thi-thao-nguyen/20-10',


  // Module 3 — Quản lý dự án (làm lại 2026-11-01)
  project: '/project',                       // danh sách dự án
  projectDashboard: '/project/dashboard',    // dashboard công việc (admin: cả công ty · người giao: dự án mình giao · người nhận: việc của mình)
  projectPeople: '/project/people',          // nhân sự: ai đang làm gì (admin / người giao việc); /project/people/:userId — công việc + sơ đồ của 1 người
  projectTasks: '/project/tasks',            // ?scope=mine|waiting|assigned — việc của tôi / chờ tôi phản hồi / tôi đã giao
  projectNew: '/project/new',                // admin tạo dự án
  projectEdit: '/project/edit',              // /project/edit/:id
  projectView: '/project/p',                 // /project/p/:id?tab=overview|tasks|timeline|chat|files — chi tiết dự án; /project/p/:id/member/:userId — việc của 1 thành viên
  projectTask: '/project/task',              // /project/task/:taskId


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
  qualityInspectionOQCManual: '/quality-inspection/oqc/manual',

  adminHistoryOQC: '/admin/oqc/history',
  
  qualityInspectionKCS: '/quality-inspection/kcs',
  qualityInspectionKCSResult: '/quality-inspection/kcs/result',
  qualityInspectionKCSManual: '/quality-inspection/kcs/manual',

  adminHistoryKCS: '/admin/kcs/history',
  
  consolidate: '/consolidate',
  consolidateTickTime: '/consolidate/tick/time',
  consolidateManualTime: '/consolidate/manual/time',

  adminHistoryConsolidate: '/admin/consolidate/history',

  adminMesDashboard: '/admin/mes/dashboard',
  adminMesFlow: '/admin/mes/flow',


  capmoneyHome: '/cap-money/home',
  capmoneyStatistic: '/cap-money/statistic',
  capmoneyAccount: '/cap-money/account',
  capmoneyBudget: '/cap-money/budget',
  capmoneyPersonal: '/cap-money/personal',

  utilsMrTuyTheSanXuatMaPhan: '/utils/mrTuy/the-san-xuat-ma-phan',
  utilsMrTuyFormTestRun: '/utils/mrTuy/form-test-run',
  utilsMrTuyFormReady: '/utils/mrTuy/form-ready-open-ready-test-run-release',
  utilsMrTuyA6Card: '/utils/mrTuy/A6-card',
  
};

export default routes;

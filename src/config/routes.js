const routes = {
  login: '/login',
  scan: '/scan',
  home: '/',
  user: '/user',
  history: '/history',
  feedback: '/feedback',

  adminAnalytics: '/admin/menu/dashboard/analytics',
  adminReport: '/admin/menu/dashboard/report',
  adminReportByShift: '/admin/menu/dashboard/report-by-shift',
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


  adminInkWeighAnalytics: '/admin/menu/dashboard/analytics/ink-weigh',
  adminInkWeighReport: '/admin/menu/dashboard/report/ink-weigh',
  adminInkWeighHistory: '/admin/menu/dashboard/history/ink-weigh',
  adminInkWeighLogfile: '/admin/menu/dashboard/logfile/ink-weigh',
  
  adminFeedbackList: '/admin/manage/list-feedback',
  adminFeedbackAnalytics: '/admin/manage/analytics-feedback',
  adminFeedbackRole: '/admin/manage/role-feedback',

};

export default routes;

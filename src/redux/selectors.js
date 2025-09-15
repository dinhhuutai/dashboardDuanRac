export const userSelector = (state) => state.auth;

export const weightSelector = (state) => state.weight;

export const noticeAdminSelector = (state) => state.noticeAdmin;

// 1–2 selector tiện lợi
export const selectModulesRole = (state) =>
  state.auth?.login?.permissions?.modules || [];

export const selectFeatureAllowed = (moduleId, code) => (state) => {
  const list = state.auth?.login?.permissions?.featuresByModule?.[moduleId] || [];
  const found = list.find(f => f.code === code);
  return !!found?.effectiveAllowed;
};
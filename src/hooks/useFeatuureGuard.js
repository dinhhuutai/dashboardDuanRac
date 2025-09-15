// ví dụ: useFeatureGuard.js
import { useSelector } from "react-redux";

export function useFeatureAllowed(moduleId, code) {
  return useSelector((state) => {
    const list = state.auth?.login?.permissions?.featuresByModule?.[moduleId] || [];
    const f = list.find(x => x.code === code);
    return !!f?.effectiveAllowed;
  });
}

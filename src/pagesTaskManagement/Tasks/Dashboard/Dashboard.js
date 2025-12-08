import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaskManagerRole } from "~/redux/slices/authSlice"; 
import { userRoleTaskManager } from "~/redux/selectors";

function Dashboard() {
  const dispatch = useDispatch();
  const roleTaskManager = useSelector(userRoleTaskManager);

  useEffect(() => {
    // lần đầu vào Dashboard, load role
    dispatch(fetchTaskManagerRole());
  }, [dispatch]);

  return (
    <div>
      Dashboard
      {roleTaskManager && (
        <div className="mt-2 text-xs text-slate-600">
          Vai trò công việc: <b>{roleTaskManager.name}</b> (
          {roleTaskManager.code})
        </div>
      )}
    </div>
  );
}

export default Dashboard;

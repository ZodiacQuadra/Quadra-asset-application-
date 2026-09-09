import { Spinner } from "@fluentui/react-components";
import { useAuth } from "../../Auth/AuthProvider";
import AttendanceAdminDashboard from "./AdminDashboard";
import AttendanceDashboard from "./AttendanceDashboard";
import ManagerDashboard from "./ManagerDashboard";
import Unauthorized from "./Unauthorized";




const PrimaryDashboard = () =>{


    const {currentUser, isUserDataLoading} = useAuth()


     // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

    // Auth is still initialising — permissions not yet available
    if (!currentUser.userID || isUserDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner label="Loading dashboard..." />
            </div>
        );
    }

    const isEmployee = checkPermission("attendance.dashboard.employee_dashboard")
    const isManager = checkPermission("attendance.dashboard.manager_dashboard")
    const isAdmin = checkPermission("attendance.dashboard.admin_dashboard")

    return(
        isEmployee ?
            <AttendanceDashboard isGreetingVisible={true}/>
        : isManager ?
            <ManagerDashboard/>
            :
            isAdmin ?
            <AttendanceAdminDashboard/>
            :
            <Unauthorized/>
    )
}


export default PrimaryDashboard
import {
  Card,
  CardPreview,
  CardHeader,
  Button,
  Avatar,
} from "@fluentui/react-components";

import { useAuth } from "../Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import CustomStatsCard from "../Recruit/Components/CustomStatsCard";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Get the username/display name from currentUser
  const userName = currentUser?.displayName || "User";

  // Helper function to safely check permissions
  const checkPermission = (permissionPath: any) => {
    const paths = permissionPath.split(".");
    let current = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  // Check Recruiting Access
  const hasRecruitingAccess =
    checkPermission("recruit.job_posting.view_job.view_all") ||
    checkPermission("recruit.job_posting.view_job.view_my") ||
    checkPermission("recruit.job_posting.create_job") ||
    checkPermission("recruit.job_posting.edit_job") ||
    checkPermission("recruit.job_posting.delete_job") ||
    checkPermission("recruit.candidate_app.manage_app") ||
    checkPermission("recruit.candidate_app.approve_reject_app") ||
    checkPermission("recruit.interview_schedule.create_interview") ||
    checkPermission("recruit.interview_schedule.modify_interview") ||
    checkPermission("recruit.interview_feedback.view_all_feedback") ||
    checkPermission("recruit.interview_feedback.view_my_feedback");

  // Check Background Verification Access
  const hasBGVAccess =
    checkPermission("background_verification.bgv_view.view_all_bgv") ||
    checkPermission("background_verification.bgv_view.view_my_bgv") ||
    checkPermission("background_verification.bgv_manage.create_bgv") ||
    checkPermission("background_verification.bgv_manage.edit_bgv") ||
    checkPermission("background_verification.bgv_manage.delete_bgv") ||
    checkPermission("background_verification.bgv_approve") ||
    checkPermission("background_verification.bgv_close");

  // Check Onboarding Access
  const hasOnboardingAccess =
    checkPermission("onboarding.onboarding_tasks.view_all_tasks") ||
    checkPermission("onboarding.onboarding_tasks.view_my_tasks") ||
    checkPermission("onboarding.manage_onboarding.create_onboarding") ||
    checkPermission("onboarding.manage_onboarding.edit_onboarding") ||
    checkPermission("onboarding.manage_onboarding.delete_onboarding");

  // Check Offboarding Access
  const hasOffboardingAccess =
    checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
    checkPermission("offboarding.offboarding_view.view_my_offboarding") ||
    checkPermission("offboarding.offboarding_manage.create_offboarding") ||
    checkPermission("offboarding.offboarding_manage.edit_offboarding") ||
    checkPermission("offboarding.offboarding_manage.delete_offboarding") ||
    checkPermission("offboarding.lead_clearance") ||
    checkPermission("offboarding.it_clearance") ||
    checkPermission("offboarding.asset_clearance") ||
    checkPermission("offboarding.finance_clearance");

  // Check Admin/Management Hub Access (permissions module)
  const hasAdminAccess =
    checkPermission("permissions.permission_matrix") ||
    checkPermission("permissions.user_role_management") ||
    checkPermission("recruit.job_role") ||
    checkPermission("recruit.hiring_template") ||
    checkPermission("recruit.location") ||
    checkPermission("recruit.department") ||
    checkPermission("background_verification.document_management") ||
    checkPermission("onboarding.induction_tasks") ||
    checkPermission("offboarding.it_activity_management") ||
    checkPermission("offboarding.admin_activity_management") ||
    checkPermission("offboarding.finance_activity_management");

  // Check if user has access to any module
  const hasAnyAccess =
    hasRecruitingAccess ||
    hasBGVAccess ||
    hasOnboardingAccess ||
    hasOffboardingAccess ||
    hasAdminAccess;
  const hasFeaturedAccess =
    hasRecruitingAccess ||
    hasBGVAccess ||
    hasOnboardingAccess ||
    hasOffboardingAccess;
  return (
    <div>
      {/* Welcome Card */}
      <Card className="mb-4 p-6 bg-[url(/HomeBg.png)] bg-no-repeat bg-cover relative overflow-hidden !rounded-2xl h-[345px] ">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2 p-4">
              {/* <Avatar
                className="hover:cursor-pointer hover:shadow-md transition-shadow duration-200"
                name={currentUser?.displayName}
                image={{
                  src: currentUser?.image,
                }}
                size={48}
              /> */}

              <img src="Quadra People.png" />
              <div className="text-[#FFF]">
                <h2 className="text-xl font-medium ">Quadra People Universe</h2>
                <p className="text-sm  text-opacity-90">
                  Your All-in-One Workplace Hub
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        {/* <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div> */}
        {/* <img
          className="absolute top-0 right-0 w-10 h-10 mr-75 mt-5"
          src="/Helix.png"
          alt="Helix decoration"
        />
        <img
          className="absolute top-0 right-0 w-10 h-10 mr-50 mt-18"
          src="/Icosahedron.png"
          alt="Icosahedron decoration"
        />
        <img
          className="absolute top-0 right-0 w-10 h-10 mr-20 mt-12"
          src="/ThorusKnot.png"
          alt="Thorus knot decoration"
        />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div> */}
      </Card>

      {/* No Access Message */}
      {!hasAnyAccess && (
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Module Access</h3>
              <p className="text-sm text-gray-600 mb-4">
                You currently don't have access to any modules. Please reach out
                to your administrator to request access.
              </p>
              <Button
                appearance="primary"
                onClick={() =>
                  (window.location.href = "mailto:people@quadrasystems.net")
                }
              >
                Contact Administrator
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Modules - Only show if user has access */}
      {hasAnyAccess && (
        <div className="mt-[-30vh] md:mt-[-35] xl:mt-[-25vh] p-10 relative z-10">
          <div className="py-2">
            {/* {hasFeaturedAccess && (
              <div className="font-medium text-base text-white">
                Featured Application
              </div>
            )} */}

            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 !items-stretch gap-10 py-2">
              {/* Recruiting Card - Only show if user has access */}
              {hasRecruitingAccess && (
                
                <div
                  className=" p-0 relative overflow-hidden hover:cursor-pointer !rounded-2xl hover:!shadow-lg !bg-[#FAFAFA]/63  flex flex-col gap-4 p-5 border-1 border-[#FFFFFF] !min-h-[229px]"
                  style={{
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => navigate("/recruit")}
                >
                  <div className="flex w-full">
                    <img
                      src="Recruit.png"
                      alt="icon1"
                      className="border-1 border-white rounded-xl"
                      style={{
                        height: "85px",
                        width: "85px",
                      }}
                    />
                  </div>

                  <CardHeader
                    header={
                      <div className="text-base !font-semibold">
                        Quadra Recruit
                      </div>
                    }
                  />

                  <p className="text-xs">
                    Streamline your talent acquisition process with tools
                    designed to enhance recruitment efficiency and
                    collaboration.
                  </p>
                </div>
              )}

              {/* Background Verification Card - Only show if user has access */}
              {hasBGVAccess && (
                <div
                  className="w-full  p-0 relative overflow-hidden hover:cursor-pointer !rounded-2xl hover:!shadow-lg !bg-[#F4F4F4]/63  flex flex-col gap-4 p-5 border-1 border-[#FFFFFF] !min-h-[229px]"
                  style={{
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => navigate("/BGV")}
                >
                  <div className="flex w-full">
                    <img
                      src="BGV.png"
                      alt="icon2"
                      style={{
                        height: "85px",
                        width: "85px",
                      }}
                    />
                  </div>

                  <CardHeader
                    header={
                      <div className="text-base !font-semibold">Quadra BGV</div>
                    }
                  />

                  <p className="text-xs">
                    Conduct thorough background verifications quickly with our
                    integrated, reliable screening tools.
                  </p>
                </div>
              )}

              {/* Onboarding Card - Only show if user has access */}
              {hasOnboardingAccess && (
                <div
                  className="w-full  p-0 relative overflow-hidden hover:cursor-pointer !rounded-2xl hover:!shadow-lg !bg-[#F4F4F4]/63  flex flex-col gap-4 p-5 border-1 border-[#FFFFFF] !min-h-[229px]"
                  style={{
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => navigate("/Induction")}
                >
                  <div className="flex w-full">
                    <img
                      src="Induction.png"
                      alt="icon3"
                      style={{
                        height: "85px",
                        width: "85px",
                      }}
                    />
                  </div>

                  <CardHeader
                    header={
                      <div className="text-base !font-semibold">
                        Quadra Onboarding
                      </div>
                    }
                  />

                  <p className="text-xs">
                    Welcome new hires with a seamless onboarding experience that
                    integrates training and orientation effortlessly.
                  </p>
                </div>
              )}

              {/* Offboarding Card - Only show if user has access */}
              {hasOffboardingAccess && (
                <div
                  className="w-full  p-0 relative overflow-hidden hover:cursor-pointer !rounded-2xl hover:!shadow-lg !bg-[#F4F4F4]/63 flex flex-col gap-4 p-5 border-1 border-[#FFFFFF] !min-h-[229px]"
                  style={{
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => navigate("/offboard")}
                >
                  <div className="flex w-full">
                    <img
                      src="Offboarding.png"
                      alt="icon4"
                      style={{
                        height: "85px",
                        width: "85px",
                      }}
                    />
                  </div>

                  <CardHeader
                    header={
                      <div className="text-base !font-semibold">
                        Quadra Offboarding
                      </div>
                    }
                  />

                  <p className="text-xs">
                    Handle employee departures professionally and securely with
                    our streamlined offboarding module.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="py-2">
            {hasAdminAccess && (
              <div className="font-medium text-base">Administration</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 items-stretch w-full gap-10 py-2 ">
              {hasAdminAccess && (
                <div
                  className="w-full  p-0 relative overflow-hidden hover:cursor-pointer !rounded-2xl hover:!shadow-lg !bg-[#F4F4F4]/63  flex flex-col gap-4 p-5 border-1 border-[#FFFFFF] !min-h-[229px]"
                  style={{
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => navigate("/ManagementHub")}
                >
                  <div className="flex w-full">
                    <img
                      src="Management Hub.png"
                      alt="icon5"
                      style={{
                        height: "85px",
                        width: "85px",
                      }}
                    />
                  </div>

                  <CardHeader
                    header={
                      <div className="text-base !font-semibold">
                        Management Hub
                      </div>
                    }
                  />

                  <p className="text-xs">
                    Configure and manage your organization's settings,
                    permissions, and administrative controls.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

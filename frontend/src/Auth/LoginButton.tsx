import React from "react";
import { useAuth } from "./AuthProvider";

import ResponsiveSidebar from "../dashboards/ResponsiveSidebar";
import BlurText from "../dashboards/BlurText";

import image from "../../public/Microsoft.png";

const handleAnimationComplete = () => {
  console.log("Animation completed!");
};

function LoginButton() {
  const {
    currentUser,
    login,
    logout,
    isInitialized,
    isLoading,
    accessToken,
  } = useAuth();

  // console.log(isLoading);
  // console.log(isInitialized);
  // console.log(currentUser);
  // console.log(accessToken);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden flex items-center ">
        {/* <img
          loading="lazy"
          src="/background.png"
          className="absolute z-0 inset-0 w-full h-full object-cover"
          alt="Background"
        /> */}
        <img
          loading="lazy"
          src="/QPeopleLoginBG.png"
          alt="Background"
          className="absolute z-0 inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 space-y-4  w-full flex flex-col items-center bg-white/4 backdrop-blur-xl justify-center h-screen">
          <img
            loading="lazy"
            src="/PeopleLoader.gif"
            alt="Microsoft"
            className="h-38"
            style={{ width: 'auto' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentUser.userID && accessToken ? (
        <div>
          <ResponsiveSidebar />
        </div>
      ) : (
        <div className="min-h-screen w-full relative overflow-hidden flex items-center">
          {/* <img
            loading="lazy"
            src="/background.png"
            className="absolute inset-0 w-full h-full object-cover"
            alt="Background"
          /> */}

          <img
            loading="lazy"
            src="/QPeopleLoginBG.png"
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="relative w-full flex h-11/12 items-center justify-center p-8 md:p-8 md:py-16 md:w-xl lg:ms-50 md:mx-25" style={{ margin: '0', padding: '0', width: '100%' }}>
            <div className="w-full max-w-xl  animate-fade-in ">
              {" "}
              <div className="bg-white flex flex-row items-center h-[68vh] [@media(min-width:1440px)]:h-[50vh] rounded-3xl p-8 md:p-8 md:py-0 shadow-xl border border-white/30">
                {" "}
                <div className="space-y-4 flex flex-col items-center justify-center">
                  {/* <img
                    loading="lazy"
                    src="data:image/svg+xml,<svg fill='currentColor' aria-hidden='true' width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'><path d='M16 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z' fill='url(%23a)'></path><path d='M6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' fill='url(%23b)'></path><path d='M26 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z' fill='url(%23c)'></path><path d='M21.38 15.3a2.5 2.5 0 0 0-3.06 1.76l-.9 3.38A6 6 0 0 0 29 23.55l.9-3.38a2.5 2.5 0 0 0-1.77-3.06l-6.76-1.81Z' fill='url(%23d)'></path><path d='M10.61 15.3a2.5 2.5 0 0 1 3.07 1.76l.9 3.38A6 6 0 1 1 3 23.55l-.9-3.38a2.5 2.5 0 0 1 1.76-3.06l6.76-1.81Z' fill='url(%23e)'></path><path d='M12.5 14a2.5 2.5 0 0 0-2.5 2.5V22a6 6 0 0 0 12 0v-5.5a2.5 2.5 0 0 0-2.5-2.5h-7Z' fill='url(%23f)'></path><defs><radialGradient id='a' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(59.93 2.22 16.2) scale(5.6215)'><stop offset='.34' stop-color='%233DCBFF'></stop><stop offset='1' stop-color='%2314B1FF'></stop></radialGradient><radialGradient id='b' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(47.57 -7.4 9.1) scale(6.55959)'><stop stop-color='%23008CE2'></stop><stop offset='1' stop-color='%230068C6'></stop></radialGradient><radialGradient id='c' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(78.84 7.34 19.16) scale(5.86806)'><stop stop-color='%230078D4'></stop><stop offset='1' stop-color='%23004695'></stop></radialGradient><radialGradient id='d' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(78.84 -.66 22.5) scale(9.38062)'><stop stop-color='%230078D4'></stop><stop offset='1' stop-color='%23004695'></stop></radialGradient><radialGradient id='e' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(61.06 -10.84 12.26) scale(13.9298 10.0267)'><stop stop-color='%23008CE2'></stop><stop offset='1' stop-color='%230068C6'></stop></radialGradient><radialGradient id='f' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='rotate(63.61 -7.83 21.43) scale(8.44834 7.75814)'><stop offset='.34' stop-color='%233DCBFF'></stop><stop offset='1' stop-color='%2314B1FF'></stop></radialGradient></defs></svg>"
                    alt="Microsoft"
                    className="w-20 h-24"
                  /> */}

                  <img
                    loading="lazy"
                    src="/QPeopleIcon.png"
                    alt="Microsoft"
                    className="h-24"
                  />

                  <div className="space-y-4 flex items-center flex-col gap-1 justify-center">
                    <h1 className="text-xl md:text-2xl font-bold ">
                      <BlurText
                        text="Welcome to Quadra People"
                        delay={150}
                        animateBy="words"
                        direction="top"
                        onAnimationComplete={handleAnimationComplete}
                        className="text-2xl"
                      />
                    </h1>
                    <h5 className="text-base md:text-md font-medium text-slate-700 animate-fade-in " style={{ textAlign: 'center' }}>
                      Unlock your team's potential with our advanced talent
                      management platform. Streamline recruitment, onboarding,
                      and performance tracking all in one place.
                    </h5>
                  </div>

                  <button
                    onClick={login}
                    className="h-14 px-6 md:px-8 md:text-sm rounded-xl hover:cursor-pointer bg-black backdrop-blur-xl text-white font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <img
                      loading="lazy"
                      src={image}
                      alt="Microsoft"
                      className="w-5 h-5"
                    />
                    <span>Sign in with Microsoft</span>
                  </button>

                  <p className="text-sm text-slate-500 pt-6 border-t border-slate-300">
                    © {new Date().getFullYear()} Quadrasystems.net India Pvt
                    Ltd. All rights reserved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginButton;

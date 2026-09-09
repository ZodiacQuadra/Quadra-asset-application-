export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority:
      `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin, // Will handle redirect after login
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: true,
    secureCookies: true,
  },
  system: {
    allowRedirectInIframe: false, // Set to false for security (Teams uses popup)
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    asyncPopups: false,
    loggerOptions: {
      logLevel: 1, // Warning
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error("[MSAL]", message);
            return;
          case 1: // Warning
            console.warn("[MSAL]", message);
            return;
          case 2: // Info
            console.info("[MSAL]", message);
            return;
          case 3: // Verbose
            console.debug("[MSAL]", message);
            return;
        }
      },
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: [
    "User.Read",
    "Calendars.ReadWrite.Shared",
    "Mail.Send",
    "openid",
    "profile",
    "email",
    "offline_access",           // enables refresh tokens — required for silent re-auth across sessions
    "OnlineMeetings.ReadWrite",
    "OnlineMeetingRecording.Read.All",
    "CallRecordings.Read.All",
    "Calendars.Read",
    "OnlineMeetingTranscript.Read.All",
  ],
  redirectUri: window.location.origin,
};

// These are the scopes that will be requested via OBO flow for Teams
export const teamsOBOScopes = [
  "https://graph.microsoft.com/User.Read",
  "https://graph.microsoft.com/Calendars.ReadWrite.Shared",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/OnlineMeetings.ReadWrite",
  "https://graph.microsoft.com/OnlineMeetingRecording.Read.All",
  "https://graph.microsoft.com/OnlineMeetingTranscript.Read.All",
  "https://graph.microsoft.com/CallRecordings.Read.All",
  "https://graph.microsoft.com/Calendars.Read",
];

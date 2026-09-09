import { PublicClientApplication } from "@azure/msal-browser";

const adminMsalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ADMIN_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage" as const,
    storeAuthStateInCookie: true,
  },
};

const adminScopes = ["https://graph.microsoft.com/User.ReadWrite.All"];

let adminMsalInstance: PublicClientApplication | null = null;

const getAdminMsal = async (): Promise<PublicClientApplication> => {
  if (!adminMsalInstance) {
    adminMsalInstance = new PublicClientApplication(adminMsalConfig);
    await adminMsalInstance.initialize();
    // Process any pending redirect response (e.g. after acquireTokenRedirect returns)
    await adminMsalInstance.handleRedirectPromise();
  }
  return adminMsalInstance;
};

/**
 * Acquires a delegated token from the admin app registration with User.ReadWrite.All scope.
 * Uses the currently signed-in user's SSO session — no second login required.
 * The signed-in user must be assigned to the admin app in Azure Portal.
 * Used exclusively for AD user creation during onboarding.
 *
 * @param loginHint - The signed-in user's UPN (currentUser.email) to skip account selection
 */
export const acquireAdminToken = async (loginHint?: string): Promise<string> => {
  if (!import.meta.env.VITE_ADMIN_CLIENT_ID) {
    throw new Error("VITE_ADMIN_CLIENT_ID is not configured");
  }

  const msal = await getAdminMsal();
  const accounts = msal.getAllAccounts();

  // 1. Try silent with cached account (works after first successful login)
  if (accounts.length > 0) {
    try {
      const response = await msal.acquireTokenSilent({
        scopes: adminScopes,
        account: accounts[0],
      });
      return response.accessToken;
    } catch {
      // fall through
    }
  }

  // 2. Try SSO silent — reuses the existing browser session, no popup or redirect shown
  //    Works as long as the user is assigned to the admin app in Azure Portal
  if (loginHint) {
    try {
      const response = await msal.ssoSilent({
        scopes: adminScopes,
        loginHint,
      });
      return response.accessToken;
    } catch {
      // SSO silent failed (first-time consent or user not assigned to admin app)
      // fall through to interactive
    }
  }

  // 3. Interactive fallback — popup if allowed, redirect if popup is blocked
  try {
    const response = await msal.acquireTokenPopup({
      scopes: adminScopes,
      loginHint,
    });
    return response.accessToken;
  } catch (popupError: any) {
    if (
      popupError?.errorCode === "popup_window_error" ||
      popupError?.errorCode === "empty_window_error"
    ) {
      await msal.acquireTokenRedirect({ scopes: adminScopes, loginHint });
      throw new Error("Redirecting for admin authentication...");
    }
    throw popupError;
  }
};

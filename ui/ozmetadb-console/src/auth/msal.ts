import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

const config: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AAD_CLIENT_ID ?? "",
    authority: process.env.NEXT_PUBLIC_AAD_AUTHORITY,
    redirectUri: process.env.NEXT_PUBLIC_AAD_REDIRECT_URI ?? "http://localhost:3000",
  },
  cache: { cacheLocation: "localStorage" },
};

export const msalInstance = new PublicClientApplication(config);

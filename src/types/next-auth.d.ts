import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** OAuth access token from provider */
    accessToken?: string;
  }
}

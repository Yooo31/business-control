import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  type Session = DefaultSession & {
    user: NonNullable<DefaultSession["user"]> & {
      id: string;
    };
  };
}

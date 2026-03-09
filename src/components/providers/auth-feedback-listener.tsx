"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

const AUTH_SUCCESS_TOAST_KEY = "auth-success-toast";

export function queueAuthSuccessToast(message: string) {
  window.sessionStorage.setItem(AUTH_SUCCESS_TOAST_KEY, message);
}

export function AuthFeedbackListener() {
  const pathname = usePathname();

  useEffect(() => {
    const message = window.sessionStorage.getItem(AUTH_SUCCESS_TOAST_KEY);

    if (!message) {
      return;
    }

    toast.success(message);
    window.sessionStorage.removeItem(AUTH_SUCCESS_TOAST_KEY);
  }, [pathname]);

  return null;
}

interface NavigatorLike {
  platform?: string;
  userAgent?: string;
}

export function isMacDesktop(navigatorLike?: NavigatorLike): boolean {
  const source =
    navigatorLike ??
    (typeof navigator === "undefined"
      ? undefined
      : {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        });

  const platform = source?.platform?.toLowerCase() ?? "";
  if (platform.includes("mac")) {
    return true;
  }

  const userAgent = source?.userAgent?.toLowerCase() ?? "";
  return /macintosh|mac os x/.test(userAgent) && !/iphone|ipad|ipod/.test(userAgent);
}

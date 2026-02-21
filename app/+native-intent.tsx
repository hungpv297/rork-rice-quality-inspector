export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (initial && path === "/") {
    return "/(tabs)/(home)";
  }
  return path;
}

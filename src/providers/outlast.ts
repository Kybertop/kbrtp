import { profile } from "../config/profile";

export type OutlastStatus = {
  trackerUrl: string;
  profileUrl: string | null;
  apiAvailable: false;
  embedAllowed: false;
};

export function outlastStatus(): OutlastStatus {
  return {
    trackerUrl: profile.outlastTrackerUrl,
    profileUrl: profile.outlastProfileUrl || null,
    apiAvailable: false,
    embedAllowed: false
  };
}

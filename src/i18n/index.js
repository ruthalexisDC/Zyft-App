import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enProfile from "./locales/en/profile.json";
import enSettings from "./locales/en/settings.json";
import enHome from "./locales/en/home.json";
import enDiscover from "./locales/en/discover.json";
import enLogworkout from "./locales/en/logworkout.json";
import enActivity from "./locales/en/activity.json";
import enFeedpost from "./locales/en/feedpost.json";
import enLegal from "./locales/en/legal.json";

import jaCommon from "./locales/ja/common.json";
import jaProfile from "./locales/ja/profile.json";
import jaSettings from "./locales/ja/settings.json";
import jaHome from "./locales/ja/home.json";
import jaDiscover from "./locales/ja/discover.json";
import jaLogworkout from "./locales/ja/logworkout.json";
import jaActivity from "./locales/ja/activity.json";
import jaFeedpost from "./locales/ja/feedpost.json";
import jaLegal from "./locales/ja/legal.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      profile: enProfile,
      settings: enSettings,
      home: enHome,
      discover: enDiscover,
      logworkout: enLogworkout,
      activity: enActivity,
      feedpost: enFeedpost,
      legal: enLegal,
    },
    ja: {
      common: jaCommon,
      profile: jaProfile,
      settings: jaSettings,
      home: jaHome,
      discover: jaDiscover,
      logworkout: jaLogworkout,
      activity: jaActivity,
      feedpost: jaFeedpost,
      legal: jaLegal,
    },
  },
  lng: localStorage.getItem("lang") || "en", // manual switcher, no auto-detect
  fallbackLng: "en",
  ns: [
    "common",
    "profile",
    "settings",
    "home",
    "discover",
    "logworkout",
    "activity",
    "feedpost",
    "legal",
  ],
  defaultNS: "common",
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
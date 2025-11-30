export type RootTabParamList = {
  Sync: undefined;
  Aloha: undefined;
  Summary: undefined;
  Studio: undefined;
  Insights: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Profile: undefined;
  Settings: undefined;
  SyncDetail: { id: string };
  CallDetail: { id: string };
  StudioDetail: { id: string };
  Calendar: undefined;
  // Sync Agent pages
  SyncNotifications: undefined;
  SyncCalendar: undefined;
  SyncEmailQueue: undefined;
  SyncDraftPreview: undefined;
  // Aloha Agent pages
  AlohaOverview: undefined;
  AlohaContacts: undefined;
  AlohaCallTranscripts: undefined;
  AlohaSettings: undefined;
  // Studio Agent pages
  StudioInteractions: undefined;
  StudioUploadMedia: undefined;
  StudioSocialAccounts: undefined;
  StudioCreatives: undefined;
  // Insights Agent pages
  InsightsCommandBrief: undefined;
  InsightsMyAutomation: undefined;
  InsightsSuggestions: undefined;
  InsightsAskInsights: undefined;
  // Legal screens
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  // Auth screen
  Login: undefined;
};

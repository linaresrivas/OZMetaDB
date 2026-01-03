export type UUID = string;

export type Snapshot = {
  meta: { version: string; exportedAtUTC?: string; projectId?: UUID };
  objects: Record<string, any>;
};

export type UiThemeRow = {
  UT_ID: UUID;
  PJ_ID: UUID;
  UT_Code: string;
  UT_TokensJSON: string;
  UT_IsEnabled?: boolean;
};

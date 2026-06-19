export type Language = 'zh-CN' | 'en';
export type FontSize = 'small' | 'normal' | 'large';
export type GroupType = 'system' | 'user';

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  deletedAt: number | null;
}

export interface LinkBookmark {
  id: string;
  title: string;
  url: string;
  groupId: string;
  order: number;
  colorState: number;
  type?: never;
}

export interface DividerBookmark {
  id: string;
  title: string;
  type: 'divider';
  groupId: string;
  order: number;
}

export type Bookmark = LinkBookmark | DividerBookmark;

export interface Preferences {
  language: Language;
  fontSize: FontSize;
}

export interface WebpageState {
  bookmarks: Bookmark[];
  groups: Group[];
  currentViewId: string;
  preferences: Preferences;
}

export interface NormalizedBackupData {
  bookmarks: Bookmark[];
  groups: Group[];
  importedAt: number;
}

export interface GithubConfig {
  token: string;
  login: string;
  updatedAt: number | null;
}

export type Translator = (
  key: string,
  substitutions?: Record<string, string | number>
) => string;

export type StateListener = (state: WebpageState) => void;
export type StateUpdater =
  | Partial<WebpageState>
  | ((state: WebpageState) => Partial<WebpageState>);

export interface WebpageStore {
  getState(): WebpageState;
  setState(updater: StateUpdater): void;
  subscribe(listener: StateListener): () => boolean;
  actions: {
    setCurrentView(viewId: string): void;
    setData(data: NormalizedBackupData): void;
    setLanguage(language: Language): void;
    setFontSize(fontSize: FontSize): void;
    openCustomView(): void;
  };
}

export interface RendererElements {
  skipLink: HTMLAnchorElement;
  groupsSidebar: HTMLElement;
  groupList: HTMLElement;
  bookmarksView: HTMLElement;
  settingsView: HTMLElement;
  currentGroupBadge: HTMLElement;
  viewTitle: HTMLElement;
  viewStatus: HTMLElement;
  settingsButton: HTMLButtonElement;
  importFileInput: HTMLInputElement;
  toastRegion: HTMLElement;
}

export interface CreateElementOptions {
  className?: string;
  text?: string | number;
  attributes?: Record<string, string | number | boolean | null | undefined>;
  dataset?: Record<string, string | number | null | undefined>;
}

export interface SelectOption {
  value: string;
  label: string;
}

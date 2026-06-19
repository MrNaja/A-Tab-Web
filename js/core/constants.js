export const SYSTEM_GROUP_IDS = {
  START_PAGE: 'sys:start_page',
  RECYCLE_BIN: 'sys:recycle_bin'
};

export const CUSTOM_VIEW_ID = 'view:custom';

export const RESERVED_GROUP_ID_PREFIXES = Object.freeze(['sys:', 'view:']);

/** @param {unknown} value */
export function isAllowedImportedGroupId(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const id = value.trim();
  return id === SYSTEM_GROUP_IDS.START_PAGE
    || (id.length > 0 && !RESERVED_GROUP_ID_PREFIXES.some((prefix) => id.startsWith(prefix)));
}

export const STORAGE_KEYS = {
  DATA: 'a-tab-web:data',
  PREFERENCES: 'a-tab-web:preferences',
  GITHUB_CONFIG: 'a-tab-web:github-config',
  GITHUB_SESSION_CONFIG: 'a-tab-web:github-session-config'
};

/** @type {import('../types').Group[]} */
export const DEFAULT_GROUPS = [
  {
    id: SYSTEM_GROUP_IDS.START_PAGE,
    name: '起始页',
    type: 'system',
    deletedAt: null
  }
];

/** @type {import('../types').Preferences} */
export const DEFAULT_PREFERENCES = {
  language: 'zh-CN',
  fontSize: 'normal'
};

/** @type {Record<import('../types').Language, Record<string, string>>} */
export const I18N = {
  'zh-CN': {
    custom: '自定义',
    skipToContent: '跳到主要内容',
    groupsNavigation: '书签分组',
    settingsTitle: '常规设置',
    language: '语言',
    importData: '导入本地数据',
    importGithubData: '导入 Github 数据',
    importGithubButton: '导入',
    configureButton: '配置',
    githubConfigTitle: '配置 Github 数据源',
    githubToken: 'Token',
    githubTokenPlaceholder: '输入 GitHub Personal Access Token',
    githubStatus: '配置状态',
    githubConfigured: '已配置',
    githubNotConfigured: '未配置',
    githubConfigHelp: '读取插件云同步仓库 a-tab-backup 中的 backup.json。',
    githubSave: '保存配置',
    githubClear: '清除凭据',
    githubCancel: '取消',
    githubTokenRequired: '请输入 Github token',
    githubConfigSaved: 'Github 配置已保存',
    githubConfigInvalid: 'Github 配置验证失败',
    githubConfigCleared: 'Github 凭据已清除',
    githubNeedConfig: '请先配置 Github token',
    githubSecureContextRequired: 'Github 导入仅支持 HTTPS 或本机 localhost，局域网 HTTP 请使用本地 JSON 导入。',
    githubImportConfirm: '确认从 Github 导入数据并覆盖当前书签？',
    githubImportSuccess: 'Github 数据导入成功',
    githubImportFailed: 'Github 数据导入失败',
    fontSize: '字体大小',
    importButton: '选择文件',
    startPage: '起始页',
    emptyTitle: '还没有导入数据',
    emptyCopy: '请在自定义视图中导入 A Tab 导出的 JSON 文件。',
    emptyGroup: '该分类暂无书签',
    importSuccess: '导入成功',
    importFailed: '导入失败，请检查文件格式',
    small: '小',
    normal: '标准',
    large: '大',
    bookmarkCount: '{count}',
    bookmarkCountLabel: '{group}，{count} 个书签',
    openInNewTab: '在新标签页打开'
  },
  en: {
    custom: 'Custom',
    skipToContent: 'Skip to main content',
    groupsNavigation: 'Bookmark groups',
    settingsTitle: 'General Settings',
    language: 'Language',
    importData: 'Import local data',
    importGithubData: 'Import Github data',
    importGithubButton: 'Import',
    configureButton: 'Configure',
    githubConfigTitle: 'Configure Github data source',
    githubToken: 'Token',
    githubTokenPlaceholder: 'Enter GitHub Personal Access Token',
    githubStatus: 'Status',
    githubConfigured: 'Configured',
    githubNotConfigured: 'Not configured',
    githubConfigHelp: 'Reads backup.json from the A Tab cloud sync repository a-tab-backup.',
    githubSave: 'Save',
    githubClear: 'Clear credentials',
    githubCancel: 'Cancel',
    githubTokenRequired: 'Enter a Github token',
    githubConfigSaved: 'Github configuration saved',
    githubConfigInvalid: 'Github configuration validation failed',
    githubConfigCleared: 'Github credentials cleared',
    githubNeedConfig: 'Configure the Github token first',
    githubSecureContextRequired: 'Github import requires HTTPS or localhost. Use local JSON import over LAN HTTP.',
    githubImportConfirm: 'Import Github data and overwrite current bookmarks?',
    githubImportSuccess: 'Github data imported',
    githubImportFailed: 'Github import failed',
    fontSize: 'Font size',
    importButton: 'Choose file',
    startPage: 'Start',
    emptyTitle: 'No data imported',
    emptyCopy: 'Import the JSON file exported from A Tab in the Custom view.',
    emptyGroup: 'No bookmarks in this group',
    importSuccess: 'Import completed',
    importFailed: 'Import failed. Please check the file format.',
    small: 'Small',
    normal: 'Normal',
    large: 'Large',
    bookmarkCount: '{count}',
    bookmarkCountLabel: '{group}, {count} bookmarks',
    openInNewTab: 'Open in new tab'
  }
};

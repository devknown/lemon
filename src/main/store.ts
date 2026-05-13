import Store from 'electron-store';

interface AppStore {
  routerUrl?: string;
  username?: string;
  password?: string;
  rememberMe: boolean;
}

export const store = new Store<AppStore>({
  defaults: {
    rememberMe: false
  },
  encryptionKey: 'lte-controll-huiu6u7ii563y' // In a real app, this should be more secure/dynamic
});

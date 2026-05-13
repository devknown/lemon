import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { huaweiService } from './huawei-service'
import { store } from './store'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Window controls IPC
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // LTE Handlers
  ipcMain.handle('lte:connect', async (_, url, username, password, remember) => {
    const success = await huaweiService.connect(url, username, password);
    if (success && remember) {
      store.set({ routerUrl: url, username, password, rememberMe: true });
    } else if (success) {
      store.set('rememberMe', false);
    }
    return success;
  });

  ipcMain.handle('lte:get-saved-auth', () => {
    return store.store;
  });

  ipcMain.handle('lte:get-status', () => huaweiService.status());
  ipcMain.handle('lte:get-traffic-stats', () => huaweiService.trafficStats());
  ipcMain.handle('lte:get-month-stats', () => huaweiService.monthStats());
  ipcMain.handle('lte:get-device-info', () => huaweiService.deviceInformation());
  ipcMain.handle('lte:get-signal', () => huaweiService.deviceSignal());
  ipcMain.handle('lte:get-sms-list', (_, page, boxType, count) => huaweiService.getSmsList(page, boxType, count));
  ipcMain.handle('lte:send-sms', (_, phones, content) => huaweiService.sendSms(phones, content));
  ipcMain.handle('lte:delete-sms', (_, id) => huaweiService.deleteSms(id));
  ipcMain.handle('lte:get-hosts', () => huaweiService.getWlanHosts());
  ipcMain.handle('lte:get-net-mode', () => huaweiService.getNetMode());
  ipcMain.handle('lte:get-net-mode-list', () => huaweiService.getNetModeList());
  ipcMain.handle('lte:set-net-mode', (_, lb, nb, nm) => huaweiService.setNetMode(lb, nb, nm));
  ipcMain.handle('lte:reboot', () => huaweiService.reboot());
  ipcMain.handle('lte:get-mac-filter', () => huaweiService.getMacFilter());
  ipcMain.handle('lte:set-mac-filter', (_, macList: string[]) => huaweiService.setMacFilter(macList));
  ipcMain.handle('lte:disconnect', async () => {
    store.set('rememberMe', false);
    store.delete('routerUrl');
    // We keep username/password in store if the user didn't check rememberMe,
    // but the hook only auto-connects if rememberMe is true.
    return huaweiService.logout();
  });

  // ipcMain.handle('lte:ping', async (_, host: string) => {
  //   try {
  //     const count = 5;
  //     const isUnix = process.platform === 'linux' || process.platform === 'darwin';

  //     const cmd = isUnix
  //       ? `ping -c ${count} ${host}`
  //       : `ping -n ${count} ${host}`;

  //     const { stdout } = await execAsync(cmd);

  //     // Match all ping times (time=23ms, time=23.4 ms, time<1ms)
  //     const matches = [...stdout.matchAll(/time[=<]([\d.]+)\s*ms/g)];

  //     if (matches.length === 0) {
  //       return { success: false, error: 'Could not parse ping output' };
  //     }

  //     const latencies = matches.map(m => parseFloat(m[1]));

  //     const average =
  //       latencies.reduce((sum, v) => sum + v, 0) / latencies.length;

  //     return {
  //       success: true,
  //       latency: Math.round(average)
  //     };
  //   } catch {
  //     return { success: false, error: 'Could not parse ping output' };
  //   }
  // });

  ipcMain.handle('lte:ping', async (_, host: string) => {
    try {
      const count = 5;
      const isUnix = process.platform === 'linux' || process.platform === 'darwin';
      
      // Run individual pings in parallel instead of sequential
      const pingPromises = Array.from({ length: count }, () => {
        const cmd = isUnix ? `ping -c 1 ${host}` : `ping -n 1 ${host}`;
        return execAsync(cmd);
      });
      
      const results = await Promise.all(pingPromises);
      
      // Extract latencies from all results
      const latencies: number[] = [];
      for (const { stdout } of results) {
        const match = stdout.match(/time[=<]([\d.]+)\s*ms/);
        if (match) {
          latencies.push(parseFloat(match[1]));
        }
      }
      
      if (latencies.length === 0) {
        return { success: false, error: 'Could not parse ping output' };
      }
      
      const average = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
      
      return {
        success: true,
        latency: Math.round(average)
      };
    } catch {
      return { success: false, error: 'Could not parse ping output' };
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

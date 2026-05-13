import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  lte: {
    connect: (url: string, username?: string, password?: string, remember?: boolean) => 
      ipcRenderer.invoke('lte:connect', url, username, password, remember),
    getSavedAuth: () => ipcRenderer.invoke('lte:get-saved-auth'),
    getStatus: () => ipcRenderer.invoke('lte:get-status'),
    getTrafficStats: () => ipcRenderer.invoke('lte:get-traffic-stats'),
    getMonthStats: () => ipcRenderer.invoke('lte:get-month-stats'),
    getDeviceInfo: () => ipcRenderer.invoke('lte:get-device-info'),
    getSignal: () => ipcRenderer.invoke('lte:get-signal'),
    getSmsList: (page?: number, count?: number) => ipcRenderer.invoke('lte:get-sms-list', page, count),
    sendSms: (phones: string[], content: string) => ipcRenderer.invoke('lte:send-sms', phones, content),
    deleteSms: (id: number) => ipcRenderer.invoke('lte:delete-sms', id),
    getHosts: () => ipcRenderer.invoke('lte:get-hosts'),
    getMacFilter: () => ipcRenderer.invoke('lte:get-mac-filter'),
    setMacFilter: (macList: string[]) => ipcRenderer.invoke('lte:set-mac-filter', macList),
    getNetMode: () => ipcRenderer.invoke('lte:get-net-mode'),
    getNetModeList: () => ipcRenderer.invoke('lte:get-net-mode-list'),
    setNetMode: (lteBand: string, networkBand: string, networkMode: string) => 
      ipcRenderer.invoke('lte:set-net-mode', lteBand, networkBand, networkMode),
    reboot: () => ipcRenderer.invoke('lte:reboot'),
    disconnect: () => ipcRenderer.invoke('lte:disconnect'),
    pingTest: () => ipcRenderer.invoke('lte:ping-test'),
    ping: (host: string) => ipcRenderer.invoke('lte:ping', host)
  },
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

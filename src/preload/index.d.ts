import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      lte: {
        connect: (url: string, username?: string, password?: string, remember?: boolean) => Promise<boolean>
        getSavedAuth: () => Promise<{ routerUrl?: string; username?: string; password?: string; rememberMe: boolean }>
        getStatus: () => Promise<any>
        getTrafficStats: () => Promise<any>
        getMonthStats: () => Promise<any>
        getDeviceInfo: () => Promise<any>
        getSignal: () => Promise<any>
        getSmsList: (page?: number, boxType?: number, count?: number) => Promise<any>
        sendSms: (phones: string[], content: string) => Promise<any>
        deleteSms: (id: number) => Promise<any>
        getHosts: () => Promise<any>
        getMacFilter: () => Promise<any>
        setMacFilter: (macList: string[]) => Promise<any>
        getNetMode: () => Promise<any>
        getNetModeList: () => Promise<any>
        setNetMode: (lteBand: string, networkBand: string, networkMode: string) => Promise<any>
        reboot: () => Promise<any>
        disconnect: () => Promise<void>
        pingTest: () => Promise<{ success: boolean; latency: number | null }>
        ping: (host: string) => Promise<{ success: boolean; latency: number | null; error?: string }>
      }
    }
  }
}

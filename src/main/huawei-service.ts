import { Connection, Device, Sms, Monitoring, WLan as WLAN, Net, User, Lan, Security } from 'huawei-lte-api';

export class HuaweiService {
  private connection: Connection | null = null;
  private device: Device | null = null;
  private sms: Sms | null = null;
  private monitoring: Monitoring | null = null;
  private wlan: WLAN | null = null;
  private net: Net | null = null;
  private user: User | null = null;
  private lan: Lan | null = null;
  private security: Security | null = null;

  async connect(url: string, username?: string, password?: string): Promise<boolean> {
    try {
      this.connection = new Connection(url, 10000);
      await this.connection.ready;
      
      this.user = new User(this.connection, username, password);
      const loggedIn = await this.user.login();
      
      if (!loggedIn) {
        throw new Error('Authentication failed');
      }

      this.device = new Device(this.connection);
      this.sms = new Sms(this.connection);
      this.monitoring = new Monitoring(this.connection);
      this.wlan = new WLAN(this.connection);
      this.net = new Net(this.connection);
      this.lan = new Lan(this.connection);
      this.security = new Security(this.connection);
      
      return true;
    } catch (error: any) {
      console.error('Failed to connect to Huawei Router:', error);
      this.connection = null;
      throw error;
    }
  }

  async status() {
    if (!this.monitoring) throw new Error('Not connected');
    return this.monitoring.status();
  }

  async trafficStats() {
    if (!this.monitoring) throw new Error('Not connected');
    return this.monitoring.trafficStatistics();
  }

  async monthStats() {
    if (!this.monitoring) throw new Error('Not connected');
    return this.monitoring.monthStatistics();
  }

  async deviceInformation() {
    if (!this.device) throw new Error('Not connected');
    return this.device.information();
  }

  async deviceSignal() {
    if (!this.device) throw new Error('Not connected');
    return this.device.signal();
  }

  async getSmsList(page: number = 1, boxType: number = 1, count: number = 20) {
    if (!this.sms) throw new Error('Not connected');
    try {
      return await this.sms.getSmsList(page, boxType, count);
    } catch (error: any) {
      // 125003 is "Unknown" but often means the router is busy or the box is empty/invalid
      if (error.code === 125003) {
        return { Messages: { Message: [] } };
      }
      throw error;
    }
  }

  async sendSms(phones: string[], content: string) {
    if (!this.sms) throw new Error('Not connected');
    return this.sms.sendSms(phones, content);
  }

  async deleteSms(id: number) {
    if (!this.sms) throw new Error('Not connected');
    return this.sms.deleteSms(id);
  }

  async getWlanHosts() {
    if (!this.wlan) throw new Error('Not connected');
    const hosts = await this.wlan.hostList();
    // Sometimes the library returns [[...]] due to a known bug in its own normalization
    if (Array.isArray(hosts) && Array.isArray(hosts[0])) {
      return hosts[0];
    }
    return hosts;
  }

  async getNetMode() {
    if (!this.net) throw new Error('Not connected');
    return this.net.netMode();
  }

  async setNetMode(lteBand: string, networkBand: string, networkMode: string) {
    if (!this.net) throw new Error('Not connected');
    return this.net.setNetMode(lteBand, networkBand, networkMode);
  }

  async getNetModeList() {
    if (!this.net) throw new Error('Not connected');
    return this.net.netModeList();
  }

  async reboot() {
    if (!this.device) throw new Error('Not connected');
    return this.device.reboot();
  }

  async getLanHostInfo() {
    if (!this.lan) throw new Error('Not connected');
    return this.lan.hostInfo();
  }

  async getMacFilter() {
    if (!this.security) throw new Error('Not connected');
    return this.security.macFilter();
  }

  async setMacFilter(macList: string[]) {
    if (!this.security) throw new Error('Not connected');
    if (!this.connection) throw new Error('Not connected');
    
    // Filter out empty values and normalize MAC addresses
    const cleanList = macList
      .map(m => m.trim().toUpperCase())
      .filter(m => m && m.length > 0);
    
    // MAC Filter Policy: 0 = Disabled, 1 = Whitelist (allow only), 2 = Blacklist (deny listed)
    // When list is empty, disable filtering; otherwise use blacklist mode
    const policy = cleanList.length > 0 ? 2 : 0;
    const macListStr = cleanList.join(',');
    
    // Set the MAC filter list
    await (this.connection as any).postSet('security/mac-filter', {
      'MacFilterPolicy': policy,
      'MacFilterMacList': macListStr
    });
    
    // Enable/disable MAC filter in firewall switch based on whether we have blocked devices
    // Signature: setFirewallSwitch(firewall, ipFilter, wanPingFilter, urlFilter, macFilter)
    const enableMacFilter = cleanList.length > 0;
    return this.security.setFirewallSwitch(true, false, true, false, enableMacFilter);
  }

  async logout() {
    if (this.user) {
      await this.user.logout();
    }
  }
}

export const huaweiService = new HuaweiService();

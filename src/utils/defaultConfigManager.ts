import { ConfigManagerInterface, ConfigManagerResponse } from 'src/abstract';

class DefaultConfigManager implements ConfigManagerInterface {
  get(id: string): Promise<ConfigManagerResponse> {
    return Promise.reject(new Error('ConfigManager not implemented'));
  }

  getLocal(id: string): Promise<ConfigManagerResponse | undefined> {
    return Promise.reject(new Error('ConfigManager not implemented'));
  }

  register(id: string): void {}
}

export default new DefaultConfigManager();

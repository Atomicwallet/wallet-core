import { ConfigManagerInterface, ConfigManagerResponse } from 'src/abstract';

class ConfigManagerMock implements ConfigManagerInterface {
  get(id: string): Promise<ConfigManagerResponse> {
    return Promise.resolve({});
  }

  getLocal(id: string): Promise<ConfigManagerResponse | undefined> {
    return Promise.resolve({});
  }

  register(id: string): void {}
}

export default new ConfigManagerMock();

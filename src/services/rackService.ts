import type { RackDetail, ServerInfo } from '@/types/rack';

/**
 * 机柜数据服务
 * 目前使用 Mock 数据，后续可替换为真实 API
 */

const generateMockServers = (count: number): ServerInfo[] => {
  const servers: ServerInfo[] = [];
  const statuses: ServerInfo['status'][] = ['running', 'running', 'running', 'warning', 'error', 'offline'];
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    servers.push({
      id: `srv-${String(i + 1).padStart(3, '0')}`,
      name: `Server-${String(i + 1).padStart(2, '0')}`,
      status,
      uptime: status === 'offline' ? '-' : `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`,
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      temperature: 30 + Math.floor(Math.random() * 40),
    });
  }
  
  return servers;
};

const mockRackData: Record<string, RackDetail> = {};

/**
 * 生成机柜 Mock 数据
 */
const generateMockRackData = (rackName: string): RackDetail => {
  if (mockRackData[rackName]) {
    return mockRackData[rackName];
  }

  const temperature = 20 + Math.floor(Math.random() * 30);
  const power = Math.floor(Math.random() * 5000);
  const serverCount = Math.floor(Math.random() * 8) + 2;
  const usedU = serverCount * 2;
  
  let status: RackDetail['status'] = 'normal';
  if (temperature > 40 || power > 4500) {
    status = 'critical';
  } else if (temperature > 32 || power > 3500) {
    status = 'warning';
  }

  const data: RackDetail = {
    name: rackName,
    status,
    temperature,
    temperatureThreshold: 45,
    power,
    powerCapacity: 5000,
    utilization: Math.floor((usedU / 42) * 100),
    totalU: 42,
    usedU,
    servers: generateMockServers(serverCount),
    lastUpdated: new Date().toLocaleString('zh-CN'),
  };

  mockRackData[rackName] = data;
  return data;
};

/**
 * 获取机柜详情
 */
export async function getRackDetail(rackName: string): Promise<RackDetail> {
  // 模拟 API 延迟
  await new Promise((resolve) => setTimeout(resolve, 300));
  return generateMockRackData(rackName);
}

/**
 * 更新机柜数据（模拟实时更新）
 */
export async function updateRackMetrics(rackName: string): Promise<Partial<RackDetail>> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  const data = mockRackData[rackName];
  if (!data) return {};

  // 随机波动
  const temperatureDelta = (Math.random() - 0.5) * 2;
  const powerDelta = Math.floor((Math.random() - 0.5) * 100);
  
  data.temperature = Math.max(15, Math.min(50, data.temperature + temperatureDelta));
  data.power = Math.max(0, Math.min(data.powerCapacity, data.power + powerDelta));
  
  // 更新状态
  if (data.temperature > 40 || data.power > data.powerCapacity * 0.9) {
    data.status = 'critical';
  } else if (data.temperature > 32 || data.power > data.powerCapacity * 0.7) {
    data.status = 'warning';
  } else {
    data.status = 'normal';
  }
  
  data.lastUpdated = new Date().toLocaleString('zh-CN');
  
  return {
    temperature: data.temperature,
    power: data.power,
    status: data.status,
    lastUpdated: data.lastUpdated,
  };
}

/**
 * 获取机柜温度
 */
export async function getRackTemperature(rackName: string): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const data = mockRackData[rackName];
  if (data) return data.temperature;
  return 20 + Math.floor(Math.random() * 30);
}

/**
 * 获取机柜功率
 */
export async function getRackPower(rackName: string): Promise<{ power: number; maxPower: number }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const data = mockRackData[rackName];
  if (data) return { power: data.power, maxPower: data.powerCapacity };
  return { power: Math.floor(Math.random() * 5000), maxPower: 5000 };
}

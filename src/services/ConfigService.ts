export interface ConfigItem {
    key: string;
    value: string;
    description?: string;
    isSecret?: boolean;
}

export class ConfigService {
    // 内存中的配置存储（运行时配置）
    private static runtimeConfig: Map<string, string> = new Map();

    // 获取配置项
    static getConfig(key: string): string | null {
        try {
            // 首先尝试从运行时配置获取
            const runtimeValue = this.runtimeConfig.get(key);
            if (runtimeValue !== undefined) {
                return runtimeValue;
            }

            // 然后从环境变量获取
            const envValue = process.env[key];
            if (envValue) {
                return envValue;
            }

            return null;
        } catch (error) {
            console.error(`Failed to get config for key ${key}:`, error);
            return null;
        }
    }

    // 设置配置项（运行时配置）
    static setConfig(key: string, value: string): void {
        try {
            this.runtimeConfig.set(key, value);
        } catch (error) {
            console.error(`Failed to set config for key ${key}:`, error);
            throw error;
        }
    }

    // 获取所有配置项（管理员用）
    static getAllConfigs(): ConfigItem[] {
        try {
            const configs: ConfigItem[] = [];

            // 添加环境变量中的钉钉配置
            const envKeys = ['DINGTALK_WEBHOOK_URL', 'DINGTALK_WEBHOOK_SECRET', 'DINGTALK_WEBHOOK_ENABLED'];

            envKeys.forEach(key => {
                const value = process.env[key];
                if (value) {
                    configs.push({
                        key,
                        value: key.includes('SECRET') ? '***' : value,
                        description: this.getConfigDescription(key),
                        isSecret: key.includes('SECRET'),
                    });
                }
            });

            // 添加运行时配置
            this.runtimeConfig.forEach((value, key) => {
                configs.push({
                    key,
                    value: key.includes('SECRET') ? '***' : value,
                    description: this.getConfigDescription(key),
                    isSecret: key.includes('SECRET'),
                });
            });

            return configs;
        } catch (error) {
            console.error('Failed to get all configs:', error);
            throw error;
        }
    }

    // 删除配置项（仅运行时配置）
    static deleteConfig(key: string): void {
        try {
            this.runtimeConfig.delete(key);
        } catch (error) {
            console.error(`Failed to delete config for key ${key}:`, error);
            throw error;
        }
    }

    // 获取配置描述
    private static getConfigDescription(key: string): string {
        const descriptions: Record<string, string> = {
            'DINGTALK_WEBHOOK_URL': 'DingTalk webhook URL for notifications',
            'DINGTALK_WEBHOOK_SECRET': 'DingTalk webhook secret for signature verification',
            'DINGTALK_WEBHOOK_ENABLED': 'Enable/disable DingTalk webhook notifications',
        };
        return descriptions[key] || '';
    }

    // DingTalk Webhook 相关配置的便捷方法
    static getDingTalkWebhookUrl(): string | null {
        return this.getConfig('DINGTALK_WEBHOOK_URL');
    }

    static setDingTalkWebhookUrl(url: string): void {
        this.setConfig('DINGTALK_WEBHOOK_URL', url);
    }

    static getDingTalkWebhookSecret(): string | null {
        return this.getConfig('DINGTALK_WEBHOOK_SECRET');
    }

    static setDingTalkWebhookSecret(secret: string): void {
        this.setConfig('DINGTALK_WEBHOOK_SECRET', secret);
    }

    static getDingTalkWebhookEnabled(): boolean {
        const enabled = this.getConfig('DINGTALK_WEBHOOK_ENABLED');
        return enabled === 'true';
    }

    static setDingTalkWebhookEnabled(enabled: boolean): void {
        this.setConfig('DINGTALK_WEBHOOK_ENABLED', enabled.toString());
    }
}
/**
 * CredentialManager - 用户凭据管理服务
 * 管理用户的API访问令牌和用户ID，支持动态配置
 */
export class CredentialManager {
  private static instance: CredentialManager;
  private userId: string | null = null;
  private apiToken: string | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * 设置用户凭据
   * @param userId 用户ID
   * @param apiToken API访问令牌
   */
  setCredentials(userId: string, apiToken: string): void {
    if (!userId || !apiToken) {
      throw new Error('用户ID和API令牌都不能为空');
    }

    this.userId = userId.trim();
    this.apiToken = apiToken.trim();
    
    console.log(`用户凭据已设置: userId=${this.userId}`);
  }

  /**
   * 获取用户ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * 获取API令牌
   */
  getApiToken(): string | null {
    return this.apiToken;
  }

  /**
   * 检查凭据是否已设置
   */
  hasCredentials(): boolean {
    return !!(this.userId && this.apiToken);
  }

  /**
   * 清空凭据
   */
  clearCredentials(): void {
    this.userId = null;
    this.apiToken = null;
    console.log('用户凭据已清空');
  }

  /**
   * 获取凭据状态信息
   */
  getCredentialStatus(): {
    hasUserId: boolean;
    hasToken: boolean;
    isConfigured: boolean;
    userId?: string;
  } {
    return {
      hasUserId: !!this.userId,
      hasToken: !!this.apiToken,
      isConfigured: this.hasCredentials(),
      userId: this.userId || undefined
    };
  }

  /**
   * 验证凭据格式
   * @param userId 用户ID
   * @param apiToken API令牌
   */
  validateCredentialsFormat(userId: string, apiToken: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证用户ID
    if (!userId || typeof userId !== 'string') {
      errors.push('用户ID不能为空');
    } else if (userId.trim().length === 0) {
      errors.push('用户ID不能为空字符串');
    } else if (userId.length < 1 || userId.length > 100) {
      errors.push('用户ID长度应该在1-100字符之间');
    }

    // 验证API令牌
    if (!apiToken || typeof apiToken !== 'string') {
      errors.push('API令牌不能为空');
    } else if (apiToken.trim().length === 0) {
      errors.push('API令牌不能为空字符串');
    } else if (apiToken.length < 10) {
      errors.push('API令牌长度过短，可能无效');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
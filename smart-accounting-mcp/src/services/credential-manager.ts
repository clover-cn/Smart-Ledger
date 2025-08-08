/**
 * CredentialManager - 用户凭据管理服务
 * 管理用户的API访问令牌和用户ID，支持动态配置和多用户会话
 */
export class CredentialManager {
  private static instance: CredentialManager;
  private userId: string | null = null;
  private apiToken: string | null = null;
  // 存储多个用户会话的凭据
  private userSessions: Map<string, { userId: string; apiToken: string; lastAccess: number }> = new Map();

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
   * 设置用户凭据（当前会话）
   * @param userId 用户ID
   * @param apiToken API访问令牌
   */
  setCredentials(userId: string, apiToken: string): void {
    if (!userId || !apiToken) {
      throw new Error("用户ID和API令牌都不能为空");
    }

    this.userId = userId.trim();
    this.apiToken = apiToken.trim();

    // 同时保存到会话存储中
    this.userSessions.set(userId, {
      userId: this.userId,
      apiToken: this.apiToken,
      lastAccess: Date.now(),
    });

    console.log(`用户凭据已设置: userId=${this.userId}`);
  }

  /**
   * 设置会话凭据（支持多用户）
   * @param sessionId 会话ID
   * @param userId 用户ID
   * @param apiToken API访问令牌
   */
  setSessionCredentials(sessionId: string, userId: string, apiToken: string): void {
    if (!sessionId || !userId || !apiToken) {
      throw new Error("会话ID、用户ID和API令牌都不能为空");
    }

    this.userSessions.set(sessionId, {
      userId: userId.trim(),
      apiToken: apiToken.trim(),
      lastAccess: Date.now(),
    });

    console.log(`会话凭据已设置: sessionId=${sessionId}, userId=${userId}`);
  }

  /**
   * 获取会话凭据
   * @param sessionId 会话ID
   */
  getSessionCredentials(sessionId: string): { userId: string; apiToken: string } | null {
    const session = this.userSessions.get(sessionId);
    if (session) {
      // 更新最后访问时间
      session.lastAccess = Date.now();
      return {
        userId: session.userId,
        apiToken: session.apiToken,
      };
    }
    return null;
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
   * 清空当前会话凭据
   */
  clearCredentials(): void {
    this.userId = null;
    this.apiToken = null;
    console.log("当前会话凭据已清空");
  }

  /**
   * 清空指定会话凭据
   * @param sessionId 会话ID
   */
  clearSessionCredentials(sessionId: string): void {
    if (this.userSessions.has(sessionId)) {
      this.userSessions.delete(sessionId);
      console.log(`会话凭据已清空: sessionId=${sessionId}`);
    }
  }

  /**
   * 清空所有会话凭据
   */
  clearAllSessions(): void {
    this.userSessions.clear();
    console.log("所有会话凭据已清空");
  }

  /**
   * 清理过期会话（超过1小时未访问）
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expireTime = 60 * 60 * 1000; // 1小时

    for (const [sessionId, session] of this.userSessions.entries()) {
      if (now - session.lastAccess > expireTime) {
        this.userSessions.delete(sessionId);
        console.log(`已清理过期会话: sessionId=${sessionId}`);
      }
    }
  }

  /**
   * 验证凭据格式
   * @param userId 用户ID
   * @param apiToken API令牌
   */
  validateCredentialsFormat(
    userId: string,
    apiToken: string
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 验证用户ID
    if (!userId || typeof userId !== "string") {
      errors.push("用户ID不能为空");
    } else if (userId.trim().length === 0) {
      errors.push("用户ID不能为空字符串");
    } else if (userId.length < 1 || userId.length > 100) {
      errors.push("用户ID长度应该在1-100字符之间");
    }

    // 验证API令牌
    if (!apiToken || typeof apiToken !== "string") {
      errors.push("API令牌不能为空");
    } else if (apiToken.trim().length === 0) {
      errors.push("API令牌不能为空字符串");
    } else if (apiToken.length < 10) {
      errors.push("API令牌长度过短，可能无效");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

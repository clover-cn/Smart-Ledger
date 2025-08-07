<template>
  <view class="user-container">
    <!-- 已登录状态 -->
    <view v-if="isLoggedIn" class="user-info">
      <view class="user-header">
        <view class="avatar">
          <uv-icon name="account-circle" color="#667eea" size="80"></uv-icon>
        </view>
        <view class="user-details">
          <text class="username">{{ userInfo.display_name || userInfo.username }}</text>
          <text class="email">{{ userInfo.email }}</text>
          <text class="user-id">ID: {{ userInfo.id }}</text>
        </view>
      </view>
      
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">0</text>
          <text class="stat-label">总交易</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥0.00</text>
          <text class="stat-label">总收入</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥0.00</text>
          <text class="stat-label">总支出</text>
        </view>
      </view>
      
      <view class="menu-list">
        <view class="menu-item" @click="copyUserId">
          <uv-icon name="content-copy" color="#667eea" size="24"></uv-icon>
          <text class="menu-text">复制用户ID</text>
          <uv-icon name="arrow-right" color="#ccc" size="16"></uv-icon>
        </view>
        
        <view class="menu-item" @click="copyToken">
          <uv-icon name="key" color="#667eea" size="24"></uv-icon>
          <text class="menu-text">复制访问令牌</text>
          <uv-icon name="arrow-right" color="#ccc" size="16"></uv-icon>
        </view>
        
        <view class="menu-item" @click="handleLogout">
          <uv-icon name="logout" color="#ff4757" size="24"></uv-icon>
          <text class="menu-text logout-text">退出登录</text>
          <uv-icon name="arrow-right" color="#ccc" size="16"></uv-icon>
        </view>
      </view>
    </view>
    
    <!-- 未登录状态 -->
    <view v-else class="login-prompt">
      <view class="prompt-icon">
        <uv-icon name="account-circle-outline" color="#ccc" size="120"></uv-icon>
      </view>
      <text class="prompt-title">欢迎使用记账精灵</text>
      <text class="prompt-subtitle">登录后开始您的记账之旅</text>
      
      <view class="login-buttons">
        <button class="login-btn" @click="goToLogin">登录</button>
        <button class="register-btn" @click="goToRegister">注册</button>
      </view>
      
      <view class="setup-guide">
        <view class="guide-title">📋 使用说明</view>
        <view class="guide-content">
          <text>1. 注册/登录获取用户ID和访问令牌</text>
          <text>2. 将用户ID和令牌配置到smart-accounting-mcp</text>
          <text>3. 通过MCP服务记录交易数据</text>
          <text>4. 在小程序中查看和管理账单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

interface UserInfo {
  id: string
  username: string
  email: string
  display_name?: string
  created_at: string
  updated_at: string
}

const isLoggedIn = ref(false)
const userInfo = ref<UserInfo | null>(null)
const token = ref('')

// 检查登录状态
function checkLoginStatus() {
  try {
    const storedToken = uni.getStorageSync('token')
    const storedUser = uni.getStorageSync('user')
    
    if (storedToken && storedUser) {
      isLoggedIn.value = true
      userInfo.value = storedUser
      token.value = storedToken
    } else {
      isLoggedIn.value = false
      userInfo.value = null
      token.value = ''
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    isLoggedIn.value = false
  }
}

// 跳转到登录页面
function goToLogin() {
  uni.navigateTo({
    url: '/pages/login/index'
  })
}

// 跳转到注册页面
function goToRegister() {
  uni.navigateTo({
    url: '/pages/register/index'
  })
}

// 复制用户ID
function copyUserId() {
  if (userInfo.value) {
    uni.setClipboardData({
      data: userInfo.value.id,
      success: () => {
        uni.showToast({
          title: '用户ID已复制',
          icon: 'success'
        })
      }
    })
  }
}

// 复制访问令牌
function copyToken() {
  if (token.value) {
    uni.setClipboardData({
      data: token.value,
      success: () => {
        uni.showToast({
          title: '访问令牌已复制',
          icon: 'success'
        })
      }
    })
  }
}

// 退出登录
function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        try {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.removeStorageSync('userId')
          
          isLoggedIn.value = false
          userInfo.value = null
          token.value = ''
          
          uni.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        } catch (error) {
          console.error('退出登录失败:', error)
        }
      }
    }
  })
}

onMounted(() => {
  checkLoginStatus()
})

onShow(() => {
  checkLoginStatus()
})
</script>

<style scoped lang="scss">
.user-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 0;
}

.user-info {
  .user-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 40rpx 40rpx;
    display: flex;
    align-items: center;
    color: white;
    
    .avatar {
      margin-right: 30rpx;
    }
    
    .user-details {
      flex: 1;
      
      .username {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
      }
      
      .email {
        display: block;
        font-size: 28rpx;
        opacity: 0.8;
        margin-bottom: 8rpx;
      }
      
      .user-id {
        display: block;
        font-size: 24rpx;
        opacity: 0.7;
        font-family: monospace;
      }
    }
  }
  
  .user-stats {
    background: white;
    margin: 20rpx;
    border-radius: 20rpx;
    padding: 40rpx;
    display: flex;
    justify-content: space-around;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
      }
      
      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .menu-list {
    margin: 20rpx;
    background: white;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .menu-text {
        flex: 1;
        margin-left: 20rpx;
        font-size: 32rpx;
        color: #333;
        
        &.logout-text {
          color: #ff4757;
        }
      }
    }
  }
}

.login-prompt {
  padding: 80rpx 40rpx;
  text-align: center;
  
  .prompt-icon {
    margin-bottom: 40rpx;
  }
  
  .prompt-title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .prompt-subtitle {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 60rpx;
  }
  
  .login-buttons {
    display: flex;
    gap: 20rpx;
    margin-bottom: 60rpx;
    
    button {
      flex: 1;
      height: 88rpx;
      border-radius: 12rpx;
      font-size: 32rpx;
      font-weight: bold;
      border: none;
    }
    
    .login-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .register-btn {
      background: white;
      color: #667eea;
      border: 2rpx solid #667eea;
    }
  }
  
  .setup-guide {
    background: white;
    border-radius: 20rpx;
    padding: 40rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    
    .guide-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 30rpx;
      text-align: center;
    }
    
    .guide-content {
      text-align: left;
      
      text {
        display: block;
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        margin-bottom: 15rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>
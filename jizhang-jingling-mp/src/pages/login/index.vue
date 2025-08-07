<template>
  <view class="login-container">
    <view class="login-header">
      <text class="title">记账精灵</text>
      <text class="subtitle">让记账变得简单</text>
    </view>
    
    <view class="login-form">
      <view class="form-item">
        <uv-icon name="email" color="#666" size="24"></uv-icon>
        <input 
          class="form-input" 
          type="text" 
          placeholder="请输入邮箱" 
          v-model="formData.email"
          :disabled="isLoading"
        />
      </view>
      
      <view class="form-item">
        <uv-icon name="lock" color="#666" size="24"></uv-icon>
        <input 
          class="form-input" 
          type="password" 
          placeholder="请输入密码" 
          v-model="formData.password"
          :disabled="isLoading"
        />
      </view>
      
      <button 
        class="login-btn" 
        :disabled="isLoading || !canSubmit"
        @click="handleLogin"
      >
        <text v-if="isLoading">登录中...</text>
        <text v-else>登录</text>
      </button>
      
      <view class="form-footer">
        <text class="register-link" @click="goToRegister">
          还没有账号？立即注册
        </text>
      </view>
    </view>
    
    <view class="tips" v-if="userIdTip">
      <view class="tip-card">
        <view class="tip-title">🎉 登录成功</view>
        <view class="tip-content">
          <text>您的用户ID: </text>
          <text class="user-id">{{ userIdTip }}</text>
        </view>
        <view class="tip-note">
          请将此ID配置到smart-accounting-mcp的.env文件中的USER_ID字段
        </view>
        <button class="copy-btn" @click="copyUserId">复制用户ID</button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

interface FormData {
  email: string
  password: string
}

const formData = ref<FormData>({
  email: '',
  password: ''
})

const isLoading = ref(false)
const userIdTip = ref('')

// 是否可以提交
const canSubmit = computed(() => {
  return formData.value.email.trim() !== '' && 
         formData.value.password.trim() !== '' &&
         validateEmail(formData.value.email)
})

// 邮箱格式验证
function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// 登录处理
async function handleLogin() {
  if (!canSubmit.value || isLoading.value) return
  
  try {
    isLoading.value = true
    
    const response = await uni.request({
      url: 'http://localhost:3000/api/auth/login',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        email: formData.value.email.trim(),
        password: formData.value.password
      },
      timeout: 10000
    })
    
    if (response.statusCode === 200 && response.data.success) {
      const { user, token } = response.data.data
      
      // 保存用户信息到本地存储
      uni.setStorageSync('token', token)
      uni.setStorageSync('user', user)
      uni.setStorageSync('userId', user.id)
      
      // 显示用户ID提示
      userIdTip.value = user.id
      
      uni.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000
      })
      
      // 3秒后跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 3000)
      
    } else {
      uni.showToast({
        title: response.data.error || '登录失败',
        icon: 'error',
        duration: 2000
      })
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    uni.showToast({
      title: '网络错误，请检查服务器是否启动',
      icon: 'error',
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 跳转到注册页面
function goToRegister() {
  uni.navigateTo({
    url: '/pages/register/index'
  })
}

// 复制用户ID
function copyUserId() {
  uni.setClipboardData({
    data: userIdTip.value,
    success: () => {
      uni.showToast({
        title: '用户ID已复制',
        icon: 'success'
      })
    }
  })
}

onLoad(() => {
  // 检查是否已经登录
  const token = uni.getStorageSync('token')
  if (token) {
    uni.switchTab({
      url: '/pages/index/index'
    })
  }
})
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  margin: 120rpx 0 80rpx;
  
  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: white;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    display: block;
  }
}

.login-form {
  background: white;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  
  .form-item {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    border-radius: 12rpx;
    padding: 24rpx 20rpx;
    margin-bottom: 30rpx;
    
    .form-input {
      flex: 1;
      margin-left: 20rpx;
      font-size: 32rpx;
      color: #333;
      
      &::placeholder {
        color: #999;
      }
    }
  }
  
  .login-btn {
    width: 100%;
    height: 88rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 32rpx;
    font-weight: bold;
    border-radius: 12rpx;
    border: none;
    margin: 40rpx 0 30rpx;
    
    &:disabled {
      opacity: 0.6;
    }
    
    &:not(:disabled):active {
      opacity: 0.8;
    }
  }
  
  .form-footer {
    text-align: center;
    
    .register-link {
      color: #667eea;
      font-size: 28rpx;
      text-decoration: underline;
    }
  }
}

.tips {
  margin-top: 40rpx;
  
  .tip-card {
    background: white;
    border-radius: 20rpx;
    padding: 40rpx;
    text-align: center;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
    
    .tip-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #52c41a;
      margin-bottom: 20rpx;
    }
    
    .tip-content {
      margin-bottom: 20rpx;
      
      .user-id {
        font-family: monospace;
        font-weight: bold;
        color: #1890ff;
        font-size: 28rpx;
      }
    }
    
    .tip-note {
      font-size: 24rpx;
      color: #666;
      line-height: 1.5;
      margin-bottom: 30rpx;
    }
    
    .copy-btn {
      background: #1890ff;
      color: white;
      border: none;
      border-radius: 8rpx;
      padding: 16rpx 32rpx;
      font-size: 28rpx;
    }
  }
}
</style>
<template>
  <view class="register-container">
    <view class="register-header">
      <text class="title">注册账号</text>
      <text class="subtitle">开始您的记账之旅</text>
    </view>
    
    <view class="register-form">
      <view class="form-item">
        <uv-icon name="person" color="#666" size="24"></uv-icon>
        <input 
          class="form-input" 
          type="text" 
          placeholder="请输入用户名" 
          v-model="formData.username"
          :disabled="isLoading"
        />
      </view>
      
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
          placeholder="请输入密码(至少6位)" 
          v-model="formData.password"
          :disabled="isLoading"
        />
      </view>
      
      <view class="form-item">
        <uv-icon name="lock" color="#666" size="24"></uv-icon>
        <input 
          class="form-input" 
          type="password" 
          placeholder="请确认密码" 
          v-model="formData.confirmPassword"
          :disabled="isLoading"
        />
      </view>
      
      <view class="form-item">
        <uv-icon name="account" color="#666" size="24"></uv-icon>
        <input 
          class="form-input" 
          type="text" 
          placeholder="请输入显示名称(可选)" 
          v-model="formData.displayName"
          :disabled="isLoading"
        />
      </view>
      
      <button 
        class="register-btn" 
        :disabled="isLoading || !canSubmit"
        @click="handleRegister"
      >
        <text v-if="isLoading">注册中...</text>
        <text v-else>注册</text>
      </button>
      
      <view class="form-footer">
        <text class="login-link" @click="goToLogin">
          已有账号？立即登录
        </text>
      </view>
    </view>
    
    <view class="tips" v-if="userIdTip">
      <view class="tip-card">
        <view class="tip-title">🎉 注册成功</view>
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
  username: string
  email: string
  password: string
  confirmPassword: string
  displayName: string
}

const formData = ref<FormData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  displayName: ''
})

const isLoading = ref(false)
const userIdTip = ref('')

// 是否可以提交
const canSubmit = computed(() => {
  return formData.value.username.trim() !== '' &&
         formData.value.email.trim() !== '' &&
         formData.value.password.trim() !== '' &&
         formData.value.confirmPassword.trim() !== '' &&
         formData.value.password === formData.value.confirmPassword &&
         formData.value.password.length >= 6 &&
         validateEmail(formData.value.email) &&
         validateUsername(formData.value.username)
})

// 邮箱格式验证
function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// 用户名验证
function validateUsername(username: string): boolean {
  const re = /^[a-zA-Z0-9_-]{3,20}$/
  return re.test(username)
}

// 注册处理
async function handleRegister() {
  if (!canSubmit.value || isLoading.value) return
  
  try {
    isLoading.value = true
    
    const response = await uni.request({
      url: 'http://localhost:3000/api/auth/register',
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        username: formData.value.username.trim(),
        email: formData.value.email.trim(),
        password: formData.value.password,
        display_name: formData.value.displayName.trim() || formData.value.username.trim()
      },
      timeout: 10000
    })
    
    const responseData = response.data as any
    
    if (response.statusCode === 201 && responseData.success) {
      const { user, token } = responseData.data
      
      // 保存用户信息到本地存储
      uni.setStorageSync('token', token)
      uni.setStorageSync('user', user)
      uni.setStorageSync('userId', user.id)
      
      // 显示用户ID提示
      userIdTip.value = user.id
      
      uni.showToast({
        title: '注册成功',
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
        title: responseData.error || '注册失败',
        icon: 'error',
        duration: 2000
      })
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    uni.showToast({
      title: '网络错误，请检查服务器是否启动',
      icon: 'error',
      duration: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页面
function goToLogin() {
  uni.navigateBack()
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
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  display: flex;
  flex-direction: column;
}

.register-header {
  text-align: center;
  margin: 80rpx 0 60rpx;
  
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

.register-form {
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
  
  .register-btn {
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
    
    .login-link {
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
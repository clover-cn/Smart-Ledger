<template>
  <view class="detail-container">
    <view class="header">
      <view class="title">收支明细</view>
      <view class="stats">
        <view class="stat-item">
          <text class="stat-label">总收入</text>
          <text class="stat-value income">+¥{{ totalIncome.toFixed(2) }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">总支出</text>
          <text class="stat-value expense">-¥{{ totalExpense.toFixed(2) }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">结余</text>
          <text class="stat-value">¥{{ (totalIncome - totalExpense).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <view class="filter-tabs">
      <view class="tab" :class="{ active: currentTab === 'all' }" @click="switchTab('all')"> 全部 </view>
      <view class="tab" :class="{ active: currentTab === 'income' }" @click="switchTab('income')"> 收入 </view>
      <view class="tab" :class="{ active: currentTab === 'expense' }" @click="switchTab('expense')"> 支出 </view>
    </view>

    <view class="transaction-list">
      <view class="transaction-item" v-for="(item, index) in filteredTransactions" :key="index" @click="editTransaction(item)">
        <view class="left">
          <view class="icon-wrapper">
            <image :src="item.icon" mode="scaleToFill" />
          </view>
          <view class="info">
            <view class="category">{{ item.category }}</view>
            <view class="date-time">{{ item.date }}</view>
            <view class="channel">{{ item.channel }}</view>
          </view>
        </view>
        <view class="right">
          <view
            class="amount"
            :class="{
              income: item.type === '收入',
              expense: item.type === '支出',
            }"
          >
            {{ item.type === "收入" ? "+" : "-" }}¥{{ item.amount.toFixed(2) }}
          </view>
        </view>
      </view>
    </view>

    <view v-if="filteredTransactions.length === 0" class="empty-state">
      <text>暂无{{ currentTab === "all" ? "" : currentTab === "income" ? "收入" : "支出" }}记录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

// 当前选中的标签
const currentTab = ref("all");

// 交易记录数据（可以从props或API获取）
const transactionList = ref([
  {
    id: 1,
    type: "支出",
    category: "餐饮",
    amount: 32.44,
    date: "08/26 12:30",
    channel: "微信",
    icon: "../../static/images/cy.png",
  },
  {
    id: 2,
    type: "收入",
    category: "工资",
    amount: 5000.0,
    date: "08/25 09:00",
    channel: "支付宝",
    icon: "../../static/images/gz.png",
  },
  {
    id: 3,
    type: "支出",
    category: "购物",
    amount: 150.0,
    date: "08/24 15:45",
    channel: "信用卡",
    icon: "../../static/images/gw.png",
  },
  {
    id: 4,
    type: "支出",
    category: "交通",
    amount: 25.5,
    date: "08/24 08:20",
    channel: "支付宝",
    icon: "../../static/images/yx.png",
  },
  {
    id: 5,
    type: "收入",
    category: "红包",
    amount: 88.8,
    date: "08/23 20:15",
    channel: "微信",
    icon: "../../static/images/ry.png",
  },
  {
    id: 6,
    type: "支出",
    category: "娱乐",
    amount: 45.0,
    date: "08/23 19:30",
    channel: "支付宝",
    icon: "../../static/images/yl.png",
  },
]);

// 切换标签
const switchTab = (tab: string) => {
  currentTab.value = tab;
};

// 过滤后的交易记录
const filteredTransactions = computed(() => {
  if (currentTab.value === "all") {
    return transactionList.value;
  }
  return transactionList.value.filter((item) => item.type === currentTab.value);
});

// 计算总收入
const totalIncome = computed(() => {
  return transactionList.value.filter((item) => item.type === "收入").reduce((sum, item) => sum + item.amount, 0);
});

// 计算总支出
const totalExpense = computed(() => {
  return transactionList.value.filter((item) => item.type === "支出").reduce((sum, item) => sum + item.amount, 0);
});

// 编辑交易记录
const editTransaction = (item: any) => {
  uni.navigateTo({
    url: `/pages/edit-transaction/index?item=${JSON.stringify(item)}`,
  });
};
</script>

<style scoped lang="scss">
.detail-container {
  background-color: #fafafa;
  min-height: 100vh;
  padding: 0 40rpx;
  box-sizing: border-box;

  .header {
    padding: 40rpx 0;
    background-color: #fff;
    margin: 0 -40rpx 30rpx;
    padding: 40rpx;

    .title {
      font-size: 36rpx;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30rpx;
      color: #333;
    }

    .stats {
      display: flex;
      justify-content: space-around;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 24rpx;
          color: #999;
          margin-bottom: 10rpx;
        }

        .stat-value {
          display: block;
          font-size: 32rpx;
          font-weight: bold;
          color: #333;

          &.income {
            color: #52c41a;
          }

          &.expense {
            color: #f5222d;
          }
        }
      }
    }
  }

  .filter-tabs {
    display: flex;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 8rpx;
    margin-bottom: 30rpx;

    .tab {
      flex: 1;
      text-align: center;
      padding: 20rpx;
      font-size: 28rpx;
      color: #666;
      border-radius: 12rpx;
      transition: all 0.3s ease;

      &.active {
        background-color: #fddb45;
        color: #333;
        font-weight: bold;
      }
    }
  }

  .transaction-list {
    background-color: #fff;
    border-radius: 20rpx;
    overflow: hidden;

    .transaction-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .left {
        display: flex;
        align-items: center;
        flex: 1;

        .icon-wrapper {
          width: 100rpx;
          height: 100rpx;
          background-color: #fdf9db;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 25rpx;
          margin-right: 30rpx;

          image {
            width: 60rpx;
            height: 60rpx;
          }
        }

        .info {
          flex: 1;

          .category {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
            margin-bottom: 8rpx;
          }

          .date-time {
            font-size: 24rpx;
            color: #999;
            margin-bottom: 4rpx;
          }

          .channel {
            font-size: 22rpx;
            color: #ccc;
          }
        }
      }

      .right {
        .amount {
          font-size: 32rpx;
          font-weight: bold;
          text-align: right;

          &.income {
            color: #52c41a;
          }

          &.expense {
            color: #f5222d;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 100rpx;
    color: #999;
    font-size: 28rpx;
  }
}
</style>

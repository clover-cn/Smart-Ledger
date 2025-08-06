<template>
  <view class="home-container">
    <view class="card">
      <view class="card-title">
        <span>今日收支统计</span>
        <image src="../../static/images/visible.png" mode="scaleToFill" />
      </view>
      <view class="card-All">总支出</view>
      <view class="card-Amount">¥54.45</view>
      <view class="card-detail">收入：￥32.44</view>
      <view class="card-detail">结余：￥99.99</view>
    </view>
    <view class="bill">
      <view class="bill-item">
        <image src="../../static/images/solar--bill-list-linear.png" mode="scaleToFill" />
        <span>账单</span>
      </view>
      <view class="bill-item">
        <image src="../../static/images/solar--bill-list-linear.png" mode="scaleToFill" />
        <span>分析</span>
      </view>
      <view class="bill-item">
        <image src="../../static/images/solar--bill-list-linear.png" mode="scaleToFill" />
        <span>资产</span>
      </view>
      <view class="bill-item">
        <image src="../../static/images/solar--bill-list-linear.png" mode="scaleToFill" />
        <span>更多</span>
      </view>
    </view>
    <view class="budget">
      <view class="budget-right">
        <view class="budget-info">本月预算剩余：60% 每日可消费：￥320.30</view>
        <uv-line-progress :percentage="30" activeColor="#FFD947" inactiveColor="#FFF" height="20rpx"></uv-line-progress>
      </view>
      <view class="budget-left">
        <uv-icon name="arrow-right" color="#39342C" size="14"></uv-icon>
      </view>
    </view>
    <view class="consumeList">
      <view class="title" @click="goToDetail">
        <span>收支记录</span>
        <uv-icon name="arrow-right" color="#39342C" size="14"></uv-icon>
      </view>
      <view class="list">
        <view class="item" v-for="(item, index) in transactionList" :key="index" @click="editTransaction(item)">
          <view class="left">
            <view class="img">
              <image :src="item.icon" mode="scaleToFill" />
            </view>
            <view class="info">
              <view class="name">{{ item.category }}</view>
              <view class="time">{{ item.date }}</view>
            </view>
          </view>
          <view class="right">
            <view>￥{{ item.amount }}</view>
            <view class="channel">{{ item.channel }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
// 交易记录
let transactionList = ref([
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
]);

// 跳转到收支明细页面
const goToDetail = () => {
  uni.navigateTo({
    url: "/pages/transaction-detail/index",
  });
};

// 编辑交易记录
const editTransaction = (item: any) => {
  uni.navigateTo({
    url: `/pages/edit-transaction/index?item=${JSON.stringify(item)}`,
  });
};
</script>

<style scoped lang="scss">
.home-container {
  background-color: #fafafa;
  min-height: 100vh;
  padding: 40rpx;
  padding-top: 0;
  box-sizing: border-box;
  font-size: 28rpx;
  .card {
    display: inline-block;
    background-color: #fddb45;
    width: 100%;
    height: 100%;
    margin: 0 auto;
    border-radius: 20rpx;
    padding: 20rpx;
    box-sizing: border-box;
    margin-right: 20rpx;
    color: #947a1a;
    font-size: 30rpx;
    font-weight: 500;
    &:last-child {
      margin-right: 0;
    }
    .card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 32rpx;
      image {
        width: 40rpx;
        height: 40rpx;
      }
    }
    .card-All {
      margin-top: 30rpx;
    }
    .card-Amount {
      margin-top: 10rpx;
      margin-bottom: 30rpx;
      margin-left: 10rpx;
      font-size: 45rpx;
      font-weight: bold;
      color: #020000;
    }
    .card-detail {
      margin-top: 10rpx;
      font-size: 28rpx;
      color: #5c5c5c;
    }
  }
  .bill {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: 30rpx;
    .bill-item {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      image {
        width: 60rpx;
        height: 60rpx;
      }
    }
  }
  .budget {
    margin-top: 30rpx;
    width: 100%;
    height: 150rpx;
    background-color: #fbf5d7;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: space-around;
    font-weight: bold;
    .budget-info {
      margin-bottom: 10rpx;
    }
  }
  .consumeList {
    margin-top: 30rpx;
    background-color: #fff;
    width: 100%;
    height: 100%;
    border-radius: 20rpx;
    padding: 20rpx;
    box-sizing: border-box;
    .title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: bold;
    }
    .list {
      margin-top: 30rpx;
      .item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20rpx;
        .left {
          display: flex;
          align-items: center;
          .img {
            width: 100rpx;
            height: 100rpx;
            background-color: #fdf9db;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 25rpx;
            margin-right: 20rpx;
            image {
              width: 60rpx;
              height: 60rpx;
            }
          }
          .info {
            .name {
              font-size: 32rpx;
              font-weight: bold;
            }
            .time {
              margin-top: 10rpx;
              color: #999;
              font-size: 24rpx;
            }
          }
        }
        .right {
          text-align: right;
          font-size: 28rpx;
          color: #39342c;
          font-weight: bold;
          .channel {
            font-weight: normal;
            color: #999;
          }
        }
      }
    }
  }
}
</style>

<template>
  <view class="edit-container">
    <view class="header">
      <view class="header-tabs">
        <view class="tab" :class="{ active: form.type === '支出' }" @click="switchType('支出')"> 支出 </view>
        <view class="tab" :class="{ active: form.type === '收入' }" @click="switchType('收入')"> 收入 </view>
      </view>
    </view>

    <view class="amount-section">
      <view class="amount-input">
        <text class="currency">¥</text>
        <input class="input" type="digit" v-model="form.amount" placeholder="0.00" focus />
      </view>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">分类</text>
        <view class="category-selector" @click="showCategorySelector = true">
          <view class="selected-category">
            <image v-if="form.icon" :src="form.icon" class="category-icon" />
            <text>{{ form.category || "请选择分类" }}</text>
          </view>
          <uv-icon name="arrow-right" size="14" color="#999"></uv-icon>
        </view>
      </view>

      <view class="form-item">
        <text class="label">时间</text>
        <picker mode="date" :value="form.date" @change="onDateChange">
          <view class="picker-wrapper">
            <text>{{ formatDate(form.date) }}</text>
            <uv-icon name="arrow-right" size="14" color="#999"></uv-icon>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">支付方式</text>
        <picker :range="paymentMethods" @change="onPaymentChange">
          <view class="picker-wrapper">
            <text>{{ form.channel || "请选择支付方式" }}</text>
            <uv-icon name="arrow-right" size="14" color="#999"></uv-icon>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">备注</text>
        <input class="remark-input" v-model="form.remark" placeholder="添加备注（可选）" />
      </view>
    </view>

    <!-- 分类选择器 -->
    <view v-if="showCategorySelector" class="category-modal" @click="showCategorySelector = false">
      <view class="category-content" @click.stop>
        <view class="category-header">
          <text class="category-title">选择分类</text>
          <view class="close-btn" @click="showCategorySelector = false">
            <uv-icon name="close" size="20" color="#666"></uv-icon>
          </view>
        </view>
        <view class="category-list">
          <view class="category-item" v-for="(item, index) in currentCategories" :key="index" @click="selectCategory(item)">
            <view class="category-icon-wrapper">
              <image :src="item.icon" class="category-icon" />
            </view>
            <text class="category-name">{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="save-section">
      <button class="save-btn" @click="saveTransaction">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref, computed, onMounted } from "vue";

// 表单数据
const form = ref({
  id: null as number | null,
  type: "支出",
  category: "",
  amount: "",
  date: "",
  channel: "",
  remark: "",
  icon: "",
});

// 显示分类选择器
const showCategorySelector = ref(false);

// 支付方式
const paymentMethods = ["微信", "支付宝", "信用卡", "现金", "银行卡"];

// 支出分类
const expenseCategories = [
  { name: "餐饮", icon: "../../static/images/cy.png" },
  { name: "休闲娱乐", icon: "../../static/images/yl.png" },
  { name: "购物", icon: "../../static/images/gw.png" },
  { name: "穿搭美容", icon: "../../static/images/cd.png" },
  { name: "水果零食", icon: "../../static/images/ls.png" },
  { name: "交通", icon: "../../static/images/qc.png" },
  { name: "生活日用", icon: "../../static/images/ry.png" },
  { name: "人情社交", icon: "../../static/images/sj.png" },
  { name: "宠物", icon: "../../static/images/cw.png" },
  { name: "养娃", icon: "../../static/images/ye.png" },
  { name: "运动", icon: "../../static/images/yd.png" },
  { name: "生活服务", icon: "../../static/images/yl.png" },
  { name: "买菜", icon: "../../static/images/d5.png" },
  { name: "住房", icon: "../../static/images/yw.png" },
  { name: "爱车", icon: "../../static/images/d3.png" },
  { name: "发红包", icon: "../../static/images/jr.png" },
  { name: "转账", icon: "../../static/images/d11.png" },
  { name: "学习教育", icon: "../../static/images/yx.png" },
  { name: "网络虚拟", icon: "../../static/images/wl.png" },
  { name: "烟酒", icon: "../../static/images/yj.png" },
  { name: "医疗保健", icon: "../../static/images/d0.png" },
  { name: "金融保险", icon: "../../static/images/d10.png" },
  { name: "家居家电", icon: "../../static/images/ju.png" },
  { name: "酒店旅行", icon: "../../static/images/jd.png" },
  { name: "公益", icon: "../../static/images/gy.png" },
  { name: "互助保障", icon: "../../static/images/hg.png" },
  { name: "其他", icon: "../../static/images/bx.png" },
];

// 收入分类
const incomeCategories = [
  { name: "工资", icon: "../../static/images/gz.png" },
  { name: "兼职", icon: "../../static/images/jd.png" },
  { name: "投资理财", icon: "../../static/images/z8.png" },
  { name: "人情社交", icon: "../../static/images/sj.png" },
  { name: "奖金补贴", icon: "../../static/images/jr.png" },
  { name: "报销", icon: "../../static/images/z5.png" },
  { name: "生意", icon: "../../static/images/d5.png" },
  { name: "卖二手", icon: "../../static/images/zz.png" },
  { name: "生活费", icon: "../../static/images/ls.png" },
  { name: "中奖", icon: "../../static/images/z1.png" },
  { name: "收红包", icon: "../../static/images/d9.png" },
  { name: "收转账", icon: "../../static/images/d11.png" },
  { name: "保险理赔", icon: "../../static/images/d10.png" },
  { name: "退款", icon: "../../static/images/z6.png" },
  { name: "其他", icon: "../../static/images/bx.png" },
];

// 当前分类列表
const currentCategories = computed(() => {
  return form.value.type === "支出" ? expenseCategories : incomeCategories;
});

// 获取当前日期
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 格式化日期显示
const formatDate = (dateStr: string) => {
  if (!dateStr) return "今天";
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}月${day}日`;
};

// 切换收支类型
const switchType = (type: string) => {
  form.value.type = type;
  form.value.category = "";
  form.value.icon = "";
};

// 选择分类
const selectCategory = (item: any) => {
  form.value.category = item.name;
  form.value.icon = item.icon;
  showCategorySelector.value = false;
};

// 日期选择
const onDateChange = (e: any) => {
  form.value.date = e.detail.value;
};

// 支付方式选择
const onPaymentChange = (e: any) => {
  form.value.channel = paymentMethods[e.detail.value];
};

// 保存交易
const saveTransaction = () => {
  if (!form.value.amount || !form.value.category || !form.value.channel) {
    uni.showToast({
      title: "请填写完整信息",
      icon: "none",
    });
    return;
  }

  // 这里应该调用API保存数据
  uni.showToast({
    title: form.value.id ? "修改成功" : "保存成功",
    icon: "success",
  });

  setTimeout(() => {
    uni.navigateBack();
  }, 1500);
};

// 页面加载
onMounted(() => {
  //   // 获取页面参数（如果是编辑模式）
  //   const pages = getCurrentPages();
  //   console.log("当前页面", pages);
  //   const currentPage = pages[pages.length - 1] as any;
  //   const options = currentPage.options;
});

onLoad((e: any) => {
  console.log("onLoad", e);
  // 设置默认日期
  form.value.date = getCurrentDate();
  console.log("========>", JSON.parse(e.item));
  const options = JSON.parse(e.item);
  if (options && options.id) {
    // 编辑模式，回显现有数据
    form.value.id = parseInt(options.id);
    form.value.type = decodeURIComponent(options.type || "支出");
    form.value.category = decodeURIComponent(options.category || "");
    form.value.amount = options.amount || "";
    form.value.channel = decodeURIComponent(options.channel || "");
    form.value.icon = decodeURIComponent(options.icon || "");

    // 格式化日期为 YYYY-MM-DD 格式
    if (options.date && options.date.includes("/")) {
      const [month, day, time] = options.date.split(" ");
      const [m, d] = month.split("/");
      const currentYear = new Date().getFullYear();
      form.value.date = `${currentYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    } else {
      form.value.date = options.date || getCurrentDate();
    }
  }
});
</script>

<style scoped lang="scss">
.edit-container {
  background-color: #fafafa;
  min-height: 100vh;

  .header {
    background-color: #fff;
    padding: 20rpx 40rpx;

    .header-tabs {
      display: flex;
      background-color: #f5f5f5;
      border-radius: 12rpx;
      padding: 8rpx;

      .tab {
        flex: 1;
        text-align: center;
        padding: 20rpx;
        font-size: 32rpx;
        color: #666;
        border-radius: 8rpx;
        transition: all 0.3s ease;

        &.active {
          background-color: #fff;
          color: #333;
          font-weight: bold;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  .amount-section {
    background-color: #fff;
    padding: 60rpx 40rpx;
    text-align: center;
    border-bottom: 1rpx solid #f5f5f5;

    .amount-input {
      display: flex;
      align-items: center;
      justify-content: center;

      .currency {
        font-size: 60rpx;
        color: #333;
        font-weight: bold;
        margin-right: 20rpx;
      }

      .input {
        font-size: 80rpx;
        font-weight: bold;
        color: #333;
        text-align: center;
        border: none;
        outline: none;
        background: transparent;
      }
    }
  }

  .form-section {
    background-color: #fff;
    margin-top: 20rpx;

    .form-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 40rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
        width: 120rpx;
      }

      .category-selector,
      .picker-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .selected-category {
          display: flex;
          align-items: center;

          .category-icon {
            width: 40rpx;
            height: 40rpx;
            margin-right: 16rpx;
          }
        }
      }

      .remark-input {
        flex: 1;
        font-size: 32rpx;
        color: #333;
        text-align: right;
      }
    }
  }

  .category-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    z-index: 1000;

    .category-content {
      width: 100%;
      background-color: #fff;
      border-radius: 24rpx 24rpx 0 0;
      max-height: 70vh;
      overflow: hidden;

      .category-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 40rpx;
        border-bottom: 1rpx solid #f5f5f5;

        .category-title {
          font-size: 36rpx;
          font-weight: bold;
          color: #333;
        }

        .close-btn {
          padding: 10rpx;
        }
      }

      .category-list {
        display: flex;
        flex-wrap: wrap;
        padding: 40rpx;
        max-height: 500rpx;
        overflow-y: scroll;

        .category-item {
          width: 25%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30rpx 0;

          .category-icon-wrapper {
            width: 100rpx;
            height: 100rpx;
            background-color: #fdf9db;
            border-radius: 25rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16rpx;

            .category-icon {
              width: 60rpx;
              height: 60rpx;
            }
          }

          .category-name {
            font-size: 24rpx;
            color: #333;
            text-align: center;
          }
        }
      }
    }
  }

  .save-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40rpx;
    background-color: #fff;
    border-top: 1rpx solid #f5f5f5;

    .save-btn {
      width: 100%;
      background-color: #fddb45;
      color: #333;
      font-size: 36rpx;
      font-weight: bold;
      border: none;
      border-radius: 16rpx;
      padding: 30rpx;

      &:active {
        background-color: #e5c73e;
      }
    }
  }
}
</style>

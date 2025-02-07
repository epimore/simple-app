<template>
  <el-dialog
      :title="`${dialogTitle}：  ${props.videoInfo.name === null || props.videoInfo.name === '' ? props.videoInfo.aliasName : props.videoInfo.name}`"
      v-model="showDialog"
      width="60%"
      center
      @closePlay="closePlay()">

    <!-- 播放器 & 按钮 共同容器 -->
    <div class="video-container">
      <!-- 播放器 -->
      <div class="video-player-container" ref="videoPlayerRef"></div>

      <!-- 按钮组（放在播放器右侧） -->
      <div class="time-buttons">
        <span class="time-label">时间选择：</span>
        <el-date-picker
            v-model="datetime"
            type="datetime"
            placeholder="回放开始时间"
            format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
        />
        <el-row :gutter="10">
          <el-col v-for="(item, index) in 24" :key="index" :span="12" class="block">
            <el-button class="fixed-button" type="info" round @click="setTimeRange(item)">
              {{ item }} 小时
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-dialog>
</template>


<script setup>
import {nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, unref} from "vue"; // 配置文件单独拎出来
import streamApi from "@/api/stream.js";
import imgUrl from '@/assets/video_poster.gif';
import {ElMessage} from "element-plus";

onMounted(() => {
  nextTick(() => {
    createPlayer();
    // startPlay().then((url) => {
    //   if(url){
    //     unref(easyplayer).play(url);
    //   }
    // });
  })
})

onBeforeUnmount(() => {
  unref(easyplayer).destroy();
  easyplayer.value = null;
})

onUnmounted(() => {
  console.log(unref(easyplayer))
})

const videoPlayerRef = ref(null);
const easyplayer = ref(null);
const easyplayerConfig = ref({
  hasAudio: false,
  isLive: false,
  MSE: false,
  WCS: false,
  defaultStreamQuality: '高清'
});
const createPlayer = () => {
  console.log(unref(videoPlayerRef))
  easyplayer.value = new window.EasyPlayerPro(unref(videoPlayerRef), {
    isLive: unref(easyplayerConfig).isLive,//默认 true
    bufferTime: 1, // 缓存时长
    stretch: false,
    MSE: unref(easyplayerConfig).MSE,
    WCS: unref(easyplayerConfig).WCS,
    hasAudio: unref(easyplayerConfig).hasAudio,
    watermark: {text: {content: 'g m v'}, right: 10, top: 10},
    autoplay: false,
    poster: imgUrl,
    defaultStreamQuality: unref(easyplayerConfig).defaultStreamQuality
  });

  unref(easyplayer).on("currentPts", function (pts) {
    console.log("pts = ", pts);
  })
  unref(easyplayer).on('playbackPreRateChange', (rate) => {
    unref(easyplayer).setRate(rate);
  })

  unref(easyplayer).on('playbackSeek', (data) => {
    console.log('playbackSeek', data)
  })
}
const datetime = ref([null, null]);
const currentDate = new Date(); // 获取当前时间
// 禁用当前时间以后的日期
const disabledDate = (date) => {
  return date.getTime() > currentDate.getTime();
};

const startPlay = async () => {
  const [startTime, endTime] = datetime.value;
  if (!startTime) {
    return ElMessage.error("开始时间不能为空！");
  }
  // 如果结束时间为空或开始结束时间相等，设置结束时间为开始时间加一小时
  if (!endTime || endTime.getTime() === startTime.getTime()) {
    const newEndTime = new Date(startTime);
    newEndTime.setHours(newEndTime.getHours() + 1);
    datetime.value[1] = newEndTime; // 设置结束时间为开始时间加一小时
    return ElMessage.warning("结束时间与开始时间相等，已自动调整结束时间为开始时间 1 小时后！");
  }
  // 校验结束时间必须晚于开始时间且开始时间需晚于当前时间
  if (endTime < startTime) {
    return ElMessage.error("结束时间必须晚于开始时间！");
  }
  // 校验开始时间需晚于当前时间
  if (startTime >= currentDate) {
    return ElMessage.error("开始时间必须晚于当前时间！");
  }
  // 校验结束时间与开始时间的差值是否小于 5 分钟
  const diffInMinutes = (endTime - startTime) / 60000; // 毫秒转分钟
  if (diffInMinutes < 5) {
    const adjustedEndTime = new Date(startTime);
    adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 5); // 设置结束时间为开始时间后 5 分钟
    datetime.value[1] = adjustedEndTime;
    return ElMessage.warning("结束时间与开始时间的差值小于 5 分钟，已自动调整结束时间为开始时间 5 分钟后！");
  }
  if (diffInMinutes > 1440){
    const adjustedEndTime = new Date(startTime);
    adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 1440); // 设置结束时间为开始时间后 5 分钟
    datetime.value[1] = adjustedEndTime;
    return ElMessage.warning("结束时间与开始时间的差值大于 24 小时，已自动调整结束时间为开始时间 24 小时后！");
  }
  unref(easyplayer).play("http://220.161.87.62:8800/hls/1/index.m3u8");
  // unref(easyplayer).play("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");

/*  const res = await getBackPlayInfo(startTime, endTime);
  if (res) {
    let flvUrl = res.flv;
    let gmvToken = sessionStorage.getItem('Gmv-Token');
    const url = flvUrl + "?gmv-token=" + gmvToken;
    unref(easyplayer).play(url);
  } else {
    ElMessage.error('播放失败，请稍后重试...')
  }*/
}

const getBackPlayInfo = async (st, et) => {
  let backReq = {
    'deviceId': props.videoInfo.deviceId,
    'channelId': props.videoInfo.channelId,
    'st': st,
    'et': et
  }
  const res = await streamApi.backStream(backReq)
  if (res.data.code === 200) {
    console.log(res.data.data)
    return res.data.data
  } else {
    console.log(res.data.msg)
  }
}


const showDialog = defineModel("showDialog");
const props = defineProps({
  videoInfo: {
    type: Object,
    required: true
  },
  dialogTitle: {
    type: String,
    default: "历史回放",
  },
})
const closePlay = () => {
  showDialog.value = false;
}
</script>

<style scoped>
/* 让时间选择器居中 */
.time-picker-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  margin-top: 16px;
}

/* 调整文字的间距 */
.time-label {
  margin-right: 10px;
  font-weight: bold;
}
/* 播放器 & 按钮的容器 */
.video-container {
  margin-top: 10px;
  display: flex;
  align-items: center;
  position: relative;
  //width: 100%;
  height: 600px;
  flex: 1; /* 播放器区域占满剩余空间 */
  min-width: 500px; /* 确保播放器不会太窄 */
  //background-color: black; /* 让播放器区域清晰 */
}

/* 播放器区域 */
.video-player-container {
  flex: 1; /* 让播放器占满可用空间 */
  height: 100%;
  border: 1px solid #ccc; /* 添加边框 */
  border-radius: 8px; /* 可选：圆角 */
  background-color: black; /* 播放器背景 */
}

/* 按钮放在播放器外侧的右边 */
.time-buttons {
  width: 180px; /* 固定按钮区域宽度 */
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fixed-button {
  width: 80px; /* 按钮固定宽度 */
}
</style>

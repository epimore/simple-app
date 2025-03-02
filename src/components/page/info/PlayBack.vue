<template>
  <el-dialog
      :title="`${dialogTitle}：  ${props.videoInfo.name === null || props.videoInfo.name === '' ? props.videoInfo.aliasName : props.videoInfo.name}`"
      v-model="showDialog"
      width="50%"
      center
      @closePlay="closePlay()">
    <div>
      <span class="time-label">回放选择：</span>
      <el-date-picker
          v-model="datetime"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          @change="selectStartEndTime"
          :disabled-date="disabledDate"
          :clearable="false"
          style="&#45;&#45;el-date-editor-width: 50%;"
      />
      <el-button type="success" round
                 style="margin-left: 20px"
                 :disabled="startPlayDisabled"
                 @click="startPlay">播放
      </el-button>
    </div>
    <!-- 播放器 & 按钮 共同容器 -->
    <div class="video-container">
      <!-- 播放器 -->
      <div class="video-player-container" ref="videoPlayerRef">
      </div>
      <!-- 进度滑块 -->
      <div class="slider-container">
        <el-slider
            v-model="timeValue"
            :max="max"
            :min="min"
            size="small"
            :show-tooltip="showTooltip"
            :disabled="!showTooltip"
            :format-tooltip="formatTooltip"
            @input="sliderTimeInput"
        />
      </div>
    </div>
  </el-dialog>
</template>


<script setup>
import {nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, unref} from "vue"; // 配置文件单独拎出来
import streamApi from "@/api/stream.js";
import imgUrl from '@/assets/video_poster.gif';
import {dayjs, ElMessage} from "element-plus";

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
  isLive: true,
  MSE: false,
  WCS: false,
  defaultStreamQuality: '高清'
});
const createPlayer = () => {
  let playerInstance = new window.EasyPlayerPro(unref(videoPlayerRef), {
    isLive: unref(easyplayerConfig).isLive,
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
  playerInstance.on("timeUpdate", (dts) => {
    // console.log("timeupdate", dts);
      timeValue.value=progressTime+dts;
      tempDts = dts;
  })
  // playerInstance.on("kBps", (kBps) =>{
  //   console.log("kBps = ", kBps);
  // })
  // unref(easyplayer).on('playbackPreRateChange', (rate) => {
  //   unref(easyplayer).setRate(rate);
  // })
  //
  // unref(easyplayer).on('playbackSeek', (data) => {
  //   console.log('playbackSeek', data)
  // })
  easyplayer.value = playerInstance;
}

const timeValue = ref(null); // Current value of the slider
const min = ref(0);  // Minimum value for the slider
let progressTime = 0;
let tempDts = 0;
const max = ref(100);  // Maximum value for the slider
const showTooltip = ref(false);
const formatTooltip = (val) => {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
}

const sliderTimeInput = (val) => {
  progressTime = val-1000-tempDts;
}
const currentDate = new Date(); // 获取当前时间
// 禁用当前时间以后的日期
const disabledDate = (date) => {
  return date.getTime() > currentDate.valueOf();
};

const startPlayDisabled = ref(true);
const datetime = ref([]); // 确保初始值为数组

const selectStartEndTime = () => {
  buildTimeRange(datetime);
  if (datetime.value[0] && datetime.value[1]) {
    min.value = datetime.value[0].getTime();
    max.value = datetime.value[1].getTime();
    startPlayDisabled.value = false;
  }
};

const buildTimeRange = (datetime) => {
  const [startTime, endTime] = datetime.value;
  if (!startTime) {
    return ElMessage.error("开始时间不能为空！");
  }
  if (startTime >= currentDate) {
    return ElMessage.error("开始时间必须晚于当前时间！");
  }
  // 如果结束时间为空或开始结束时间相等，设置结束时间为开始时间加一小时
  if (!endTime || endTime.getTime() === startTime.getTime()) {
    const newEndTime = new Date(startTime);
    newEndTime.setHours(newEndTime.getHours() + 1);// 设置结束时间为开始时间加一小时

    if (newEndTime > currentDate) {
      datetime.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间相等，已自动调整结束时间为当前时间！");
    } else {
      datetime.value[1] = newEndTime;
      return ElMessage.warning("结束时间与开始时间相等，已自动调整结束时间为开始时间 1 小时后！");
    }
  }
  // 校验结束时间必须晚于开始时间且开始时间需晚于当前时间
  if (endTime < startTime) {
    return ElMessage.error("结束时间必须晚于开始时间！");
  }
  // 校验结束时间与开始时间的差值是否小于 5 分钟
  const diffInMinutes = (endTime - startTime) / 60000; // 毫秒转分钟
  if (diffInMinutes < 5) {
    const adjustedEndTime = new Date(startTime);
    adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 5); // 设置结束时间为开始时间后 5 分钟
    if (adjustedEndTime > currentDate) {
      datetime.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间的差值小于 5 分钟，已自动调整结束时间为当前时间！");
    } else {
      datetime.value[1] = adjustedEndTime;
      return ElMessage.warning("结束时间与开始时间的差值小于 5 分钟，已自动调整结束时间为开始时间 5 分钟后！");
    }
  }
  if (diffInMinutes > 1440) {
    const adjustedEndTime = new Date(startTime);
    adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 1440); // 设置结束时间为开始时间后 5 分钟
    if (adjustedEndTime > currentDate) {
      datetime.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间的差值大于 1 天，已自动调整结束时间为当前时间！");
    } else {
      datetime.value[1] = adjustedEndTime;
      return ElMessage.warning("结束时间与开始时间的差值大于 1 天，已自动调整结束时间为开始时间 1 天后！");
    }
  }
}
const startPlay = async () => {
  startPlayDisabled.value = true;
  showTooltip.value = true;
  // unref(easyplayer).play("http://220.161.87.62:8800/hls/1/index.m3u8");
  // unref(easyplayer).play("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");

  const res = await getBackPlayInfo(datetime.value[0], datetime.value[1]);
  if (res) {
    let flvUrl = res.flv;
    let gmvToken = sessionStorage.getItem('Gmv-Token');
    const url = flvUrl + "?gmv-token=" + gmvToken;
    unref(easyplayer).play(url);
    progressTime=min.value;
  } else {
    ElMessage.error('播放失败，请稍后重试...')
  }
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

/* 调整文字的间距 */
.time-label {
  margin-right: 10px;
  font-weight: bold;
}

/* 播放器 & 按钮的容器 */
.video-container {
  margin-top: 10px;
  display: flex;
  align-items: flex-start;
  position: relative;
  height: 520px;
  flex: 1; /* 播放器区域占满剩余空间 */
  //min-width: 500px; /* 确保播放器不会太窄 */
}

/* 播放器区域 */
.video-player-container {
  flex: 1; /* 让播放器占满可用空间 */
  height: 95%; /* 调整播放器高度 */
  border: 1px solid #ccc; /* 添加边框 */
  //border-radius: 8px; /* 可选：圆角 */
  background-color: black; /* 播放器背景 */
  //position: relative; /* 确保 slider 能定位到播放器下方 */
}

/* 进度滑块容器 */
.slider-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  margin-bottom: 10px; /* 与播放器的间距 */
  z-index: 20;
}
</style>

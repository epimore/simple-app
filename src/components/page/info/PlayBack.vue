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
        <span class="time-label">点播选择：</span>
        <el-date-picker
            v-model="datetime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
            @change="handleChange"
            style="--el-date-editor-width: 100%;"
        />

        <div class="time-points">
          <el-row :gutter="10" v-for="(p, index) in timeBlocks" :key="index">
            <el-col span=24 class="time-label">{{ p.date }}</el-col>
            <br>
            <el-col v-for="(c, index) in p.time" :key="index" :span="12" class="block">
              <el-button class="fixed-button" type="info" size="small" round @click="perSkipToTime(p.date,c)">
                {{ c }}点
              </el-button>
            </el-col>
          </el-row>
        </div>

      </div>
    </div>
  </el-dialog>
</template>


<script setup>
import {nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, unref} from "vue"; // 配置文件单独拎出来
import streamApi from "@/api/stream.js";
import imgUrl from '@/assets/video_poster.gif';
import {ElMessage} from "element-plus";
import moment from 'moment';

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

const timeBlocks = ref([])
const datetime = ref(null);
const currentDate = moment(); // 获取当前时间
// 禁用当前时间以后的日期
const disabledDate = (date) => {
  return date.getTime() > currentDate.valueOf();
};

const handleChange = () => {
  const startTime = datetime.value;
  if (startTime >= currentDate) {
    return ElMessage.error("开始时间必须晚于当前时间！");
  }
  let startMoment = moment(startTime);
  let startDate = startMoment.format('YYYY-MM-DD');
  let sh = startTime.getHours();
  if (sh === 0 && startTime.getMinutes() === 0) { //非跨天生成
    let currentHours = currentDate.hours()+1;
    let hour = currentDate.isSame(startMoment,'day')?currentHours:24;
    let periods = buildFloorPeriods(hour);
    timeBlocks.value = [{date: startDate, time: periods}];
  } else {
    if (currentDate.unix()-startMoment.unix()>=86400){
      let startPeriods = buildUpPeriods(sh);
      let endMoment = startMoment.add(1, 'days');
      let endPeriods = buildFloorPeriods(endMoment.hours());
      let endDate = endMoment.format('YYYY年-MM月-DD日');
      timeBlocks.value = [{date: startDate, time: startPeriods},
        {date: endDate, time: endPeriods}
      ];
    }else {
      if (currentDate.isSame(startMoment,'day')){
        let periods = buildMidPeriods(startMoment.hours(),currentDate.hours());
        timeBlocks.value = [{date: startDate, time: periods}];
      }else {
        let endPeriods = buildFloorPeriods(currentDate.hours()+1);
        let startPeriods = buildUpPeriods(sh);
        let endDate = currentDate.format('YYYY年-MM月-DD日');
        timeBlocks.value = [{date: startDate, time: startPeriods},
          {date: endDate, time: endPeriods}
        ];
      }
    }
  }
  // 这里可以添加其他逻辑，例如验证、触发 API 请求等
};

const buildMidPeriods = (sh,eh) =>{
  const periods = [];
  for (let i = sh; i <= eh; i++) {
    periods.push(i);
  }
  return periods;
}

const buildUpPeriods = (hour) => {
  const periods = [];
  for (let i = hour; i <= 23; i++) {
    periods.push(i);
  }
  return periods;
}

const buildFloorPeriods = (hour) => {
  const periods = [];
  for (let i = 0; i < hour; i++) {
    periods.push(i);
  }
  return periods;
}

const perSkipToTime = async (date,time) =>{
  console.log(date,time);
}
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
  if (diffInMinutes > 1440) {
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

/* 调整文字的间距 */
.time-label {
  margin-right: 10px;
  font-weight: bold;
}

.time-points {
  overflow: hidden auto;
  padding-bottom: 15px;
}

.time-points > .el-row:not(:first-child) {
  margin-top: 15px;
}

/* 播放器 & 按钮的容器 */
.video-container {
  margin-top: 10px;
  display: flex;
  align-items: flex-start;
  position: relative;
  //width: 100%;
  height: 500px;
  flex: 1; /* 播放器区域占满剩余空间 */
  //min-width: 500px; /* 确保播放器不会太窄 */
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
  margin-left: 10px;
  width: 180px; /* 固定按钮区域宽度 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  height: 100%;
}

.fixed-button {
  margin-top: 5px;
  width: 80px; /* 按钮固定宽度 */
}
</style>

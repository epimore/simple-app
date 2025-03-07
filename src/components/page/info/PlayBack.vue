<template>
  <el-dialog
      :title="`${dialogTitle}：  ${props.videoInfo.name === null || props.videoInfo.name === '' ? props.videoInfo.aliasName : props.videoInfo.name}`"
      v-model="showDialog"
      width="51%"
      center
      @closePlay="closePlay()">
    <div class="parent" :style="gridStyle">
      <div class="div1">
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
                   style="margin-left: 10px"
                   :disabled="startPlayDisabled"
                   @click="startPlay">播放
        </el-button>
        <el-button type="primary"
                   style="margin-left: 20px"
                   @click="showDownMsg">离线下载
        </el-button>
      </div>
      <!-- 播放器 & 按钮 共同容器 -->
      <div class="div2">
        <!-- 播放器 -->
        <div class="video-player-container" ref="videoPlayerRef"></div>
        <div class="slider-container">
        <span>
          <el-switch
              v-model="optStatus"
              active-text="播放操作"
              inactive-text="离线录像"
              size="small"
              :disabled="!showTooltip"
          />

        </span>
          <span class="rate-section" v-show="optStatus">
          倍速：
          <el-select-v2
              v-model="rateValue"
              :options="rateOptions"
              size="small"
              style="width:70px"
              @change="playRateChange"
              :disabled="!showTooltip"
          />
        </span>
          <span v-show="optStatus">
        <!-- 进度滑块 -->
        <el-slider
            v-model="timeValue"
            :max="max"
            :min="min"
            size="small"
            :show-tooltip="showTooltip"
            :disabled="!showTooltip"
            :format-tooltip="formatTooltip"
            @input="sliderTimeInput"
            @change="sliderTimeChange"
        />
        </span>
          <span v-show="!optStatus">
          <span class="down-opt">
            <el-text type="primary" size="small">拖动圆球选择开始时间与结束时间</el-text>
            <el-button style="margin-left: 20px" type="success" size="small"
                       :disabled="!showTooltip">开始录制</el-button>
          </span>

          <el-slider range
                     size="small"
                     :max="max"
                     :min="min"
                     range-start-label="开始时间"
                     range-end-label="结束时间"
                     :show-tooltip="showTooltip"
                     :disabled="!showTooltip"
                     :format-tooltip="formatTooltip"
                     @change="rangeValueChange"
          />
        </span>
        </div>
      </div>
      <!-- 按钮组（放在播放器右侧） -->
      <div class="div3" v-if="showDownMsgBlock">
        <el-table :data="downMsg" border style="width: 100%;margin-top:20px"
                  :cell-style="{ textAlign: 'center' }"
                  :header-cell-style="{ textAlign: 'center',background: '#f5f7fa', color: '#606266' }">
          <el-table-column label="序号" type="index" width="40"/>
          <el-table-column label="时间段" width="145">
            <template #default="scope">
              <span style="display: block;">{{ scope.row.startTime }}</span>
              <span style="display: block;">~</span>
              <span style="display: block;">{{ scope.row.endTime }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="state" label="状态" width="60"/>
          <el-table-column prop="size" label="大小(MB)" width="80"/>
          <el-table-column label="操作" width="60">
            <template #default="scope">
              <div style="display: flex; flex-direction: column; gap: 5px;">
                <el-button type="danger" size="small"
                           @click="rmDevice(scope.row.deviceId)">删除
                </el-button>
                <el-button type="primary" size="small" style="margin-left: 0"
                           @click="switchToChannel(scope.row)">下载
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-dialog>
</template>


<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, unref} from "vue"; // 配置文件单独拎出来
import streamApi from "@/api/stream.js";
import imgUrl from '@/assets/video_poster.gif';
import {dayjs, ElMessage} from "element-plus";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

onMounted(() => {
  nextTick(() => {
    createPlayer();
  })
})

onBeforeUnmount(() => {
  unref(easyplayer).destroy();
  easyplayer.value = null;
})

onUnmounted(() => {
  console.log(unref(easyplayer))
})
const downMsg = ref([
  {"startTime": "2025-01-01 00:00:00", "endTime": "2025-01-01 00:00:00", "state": "100%", "size": "1024.35", "id": "1"},
  {"startTime": "2025-01-01 00:00:00", "endTime": "2025-01-01 00:00:00", "state": "100%", "size": "0.12", "id": "2"},
  {"startTime": "2025-01-01 00:00:00", "endTime": "2025-01-01 00:00:00", "state": "100%", "size": "111.02", "id": "3"}]
);
const showDownMsgBlock = ref(false);
const showDownMsg = () => {
  //todo API 请求 downMsg
  showDownMsgBlock.value = !showDownMsgBlock.value;
};
const gridStyle = computed(() => ({
  'grid-template-columns': showDownMsgBlock.value ? '1fr 1fr' : '1fr',
}));
const rangeValueChange = (val) => {
  console.log(val.value[0], val.value[1]);
}

const rateInitials = [0.5, 1.0, 2.0, 4.0];
const rateValue = ref(1.0);
const rateOptions = rateInitials.map(rate => ({
  value: rate,  // `value` 对应 v-model 绑定
  label: `${rate}`,  // label 必须是字符串
}));
const playRateChange = async (val) => {
  console.log(val);
  // console.log("change time", dayjs(val).format('YYYY-MM-DD HH:mm:ss'));
  let speedMode = {
    'streamId': streamId.value,
    'speedRate': val
  }
  const res = await streamApi.speedStream(speedMode)
  if (res.data.code === 200) {
  } else {
    console.log("speedStream", res.data.msg)
  }
}
const optStatus = ref(true);
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
    bufferTime: 0.2, // 缓存时长
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
    timeValue.value = progressTime + dts;
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
const streamId = ref(null);
const max = ref(100);  // Maximum value for the slider
const showTooltip = ref(false);
const formatTooltip = (val) => {
  return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
}

const sliderTimeChange = async (val) => {
  // console.log("change time", dayjs(val).format('YYYY-MM-DD HH:mm:ss'));
  let seekMode = {
    'streamId': streamId.value,
    'seekSecond': (val - min.value) / 1000
  }
  const res = await streamApi.seekStream(seekMode)
  unref(easyplayer)
  if (res.data.code === 200) {
  } else {
    console.log("seekStream", res.data.msg)
  }
}

const sliderTimeInput = (val) => {
  progressTime = val - tempDts;
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

const buildTimeRange = (dt) => {
  const [startTime, endTime] = dt.value;
  if (!startTime) {
    return ElMessage.error("开始时间不能为空！");
  }
  if (startTime >= currentDate) {
    return ElMessage.error("开始时间必须晚于当前时间！");
  }
  // 如果开始结束时间相等，设置结束时间为开始时间加一小时
  if (endTime.getTime() === startTime.getTime()) {
    const newEndTime = new Date(startTime);
    newEndTime.setHours(newEndTime.getHours() + 1);// 设置结束时间为开始时间加一小时

    if (newEndTime > currentDate) {
      dt.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间相等，已自动调整结束时间为当前时间！");
    } else {
      dt.value[1] = newEndTime;
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
      dt.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间的差值小于 5 分钟，已自动调整结束时间为当前时间！");
    } else {
      dt.value[1] = adjustedEndTime;
      return ElMessage.warning("结束时间与开始时间的差值小于 5 分钟，已自动调整结束时间为开始时间 5 分钟后！");
    }
  }
  if (diffInMinutes > 1440) {
    const adjustedEndTime = new Date(startTime);
    adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 1440); // 设置结束时间为开始时间后 5 分钟
    if (adjustedEndTime > currentDate) {
      dt.value[1] = currentDate;
      return ElMessage.warning("结束时间与开始时间的差值大于 1 天，已自动调整结束时间为当前时间！");
    } else {
      dt.value[1] = adjustedEndTime;
      return ElMessage.warning("结束时间与开始时间的差值大于 1 天，已自动调整结束时间为开始时间 1 天后！");
    }
  }
}
const startPlay = async () => {
  startPlayDisabled.value = true;
  showTooltip.value = true;
  let st = dayjs.utc(datetime.value[0]).add(8, 'hour').subtract(3, 'second');
  let et = dayjs.utc(datetime.value[1]).add(8, 'hour');
  const res = await getBackPlayInfo(st, et);
  if (res) {
    let flvUrl = res.flv;
    streamId.value = res.streamId;
    let gmvToken = sessionStorage.getItem('Gmv-Token');
    const url = flvUrl + "?gmv-token=" + gmvToken;
    unref(easyplayer).play(url);
    progressTime = min.value;
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

/* 播放器区域 */
.video-player-container {
  flex: 1; /* 让播放器占满可用空间 */
  height: 90%; /* 调整播放器高度 */
  border: 1px solid #ccc; /* 添加边框 */
  //border-radius: 8px; /* 可选：圆角 */
  background-color: black; /* 播放器背景 */
  position: relative; /* 确保 slider 能定位到播放器下方 */
}

/* 进度滑块容器 */
.slider-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  margin-bottom: -10px; /* 与播放器的间距 */
  z-index: 20;
}

.rate-section {
  position: absolute;
  right: 0;
  top: 0;
  margin-left: 10px;
}

.down-opt {
  position: absolute;
  right: 0;
  top: 0;
  margin-left: 10px;
}

.parent {
  display: grid;
  grid-column-gap: 5px;
  grid-row-gap: 5px;
}

.div1 {
  grid-area: 1 / 1 / 1 / 3;
}

/* 播放器区域 */
.div2 {
  grid-area: 2 / 1 / 6 / 1;
  margin-top: 10px;
  display: flex;
  align-items: flex-start;
  position: relative;
  height: 500px;
  //min-width: 450px; /* 避免过窄 */
}

/* 侧边栏 */
.div3 {
  grid-area: 2 / 2 / 6 / 2;
  margin-top: -10px;
  display: flex;
  align-items: flex-start;
  position: relative;
}

</style>

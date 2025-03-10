<template>
  <el-dialog
      :title="`${dialogTitle}：  ${props.videoInfo.name === null || props.videoInfo.name === '' ? props.videoInfo.aliasName : props.videoInfo.name}`"
      v-model="showDialog"
      width="50%"
      center
      @closePlay="closePlay()">

    <div class="video-player-container" ref="videoPlayerRef"></div>
  </el-dialog>
</template>


<script setup>
import {nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, unref} from "vue"; // 配置文件单独拎出来
import dcOptApi from "@/api/dcOpt.js";
import imgUrl from '@/assets/video_poster.gif';
import {ElMessage} from "element-plus";


onMounted(() => {
  nextTick(() => {
    createPlayer();
    startPlay().then((url) => {
      if (url) {
        unref(easyplayer).play(url);
      }
    });
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
  WCS: false
});
const createPlayer = () => {
  easyplayer.value = new window.EasyPlayerPro(unref(videoPlayerRef), {
    isLive: unref(easyplayerConfig).isLive,//默认 true
    bufferTime: 0.2, // 缓存时长
    stretch: false,
    ptzConfig: {ptz: true, ptzMore: true},
    setMic: false,
    loadingText: "asdfasfdasdf",
    MSE: unref(easyplayerConfig).MSE,
    WCS: unref(easyplayerConfig).WCS,
    hasAudio: unref(easyplayerConfig).hasAudio,
    watermark: {text: {content: 'g m v'}, right: 10, top: 10},
    autoplay: true,
    poster: imgUrl,
  });
  const ptzCmdMap = {
    left: {leftRight: 1, upDown: 0, inOut: 0},
    right: {leftRight: 2, upDown: 0, inOut: 0},
    up: {leftRight: 0, upDown: 1, inOut: 0},
    down: {leftRight: 0, upDown: 2, inOut: 0},
    rightUp: {leftRight: 2, upDown: 1, inOut: 0},
    rightDown: {leftRight: 2, upDown: 2, inOut: 0},
    leftUp: {leftRight: 1, upDown: 1, inOut: 0},
    leftDown: {leftRight: 1, upDown: 2, inOut: 0},
    zoomExpand: {leftRight: 0, upDown: 0, inOut: 2},
    zoomNarrow: {leftRight: 0, upDown: 0, inOut: 1}
  };
  unref(easyplayer).on('ptz', async (data) => {
    const command = ptzCmdMap[data]
    if (command === undefined) {
      return;
    }
    let deviceId = props.videoInfo.deviceId;
    let channelId = props.videoInfo.channelId;
    let x = command.leftRight > 0 ? 50 : 0;
    let y = command.upDown > 0 ? 50 : 0;
    let z = command.inOut > 0 ? 5 : 0;
    let mode = {
      deviceId,
      channelId,
      leftRight: command.leftRight,
      upDown: command.upDown,
      inOut: command.inOut,
      horizonSpeed: x,
      verticalSpeed: y,
      zoomSpeed: z
    };
    const res = await dcOptApi.controlPtz(mode)
    if (res.data.code === 200) {
    } else {
      console.log("controlPtz", res.data.msg)
    }

  })
}

const startPlay = async () => {
  const res = await getLivePlayInfo();
  if (res) {
    let flvUrl = res.flv;
    let gmvToken = sessionStorage.getItem('Gmv-Token');
    streamUrl.value = flvUrl + "?gmv-token=" + gmvToken;
    return streamUrl.value;
  } else {
    ElMessage.error('点播失败，请稍后重试...')
  }
}

const streamUrl = ref(null);
const getLivePlayInfo = async () => {
  let idMap = {
    'deviceId': props.videoInfo.deviceId,
    'channelId': props.videoInfo.channelId
  }
  const res = await dcOptApi.liveStream(idMap)
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
    default: "实时直播",
  },
})
const closePlay = () => {
  showDialog.value = false;
}
</script>

<style scoped>
.video-player-container {
  width: 100%;
  min-height: 500px;
}
</style>

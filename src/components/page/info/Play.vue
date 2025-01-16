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
import streamApi from "@/api/stream.js";
import imgUrl from '@/assets/video_poster.gif';
import {ElMessage} from "element-plus";


onMounted(() => {
  nextTick(() => {
    createPlayer();
    startPlay().then((url) => {
      if(url){
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
  console.log(unref(videoPlayerRef))
  easyplayer.value = new window.EasyPlayerPro(unref(videoPlayerRef), {
    isLive: unref(easyplayerConfig).isLive,//默认 true
    bufferTime: 0.2, // 缓存时长
    stretch: false,
    MSE: unref(easyplayerConfig).MSE,
    WCS: unref(easyplayerConfig).WCS,
    hasAudio: unref(easyplayerConfig).hasAudio,
    watermark: {text: {content: 'g m v'}, right: 10, top: 10},
    autoplay: true,
    poster: imgUrl,
  });

  unref(easyplayer).on("fullscreen", function (flag) {
    // console.log('is fullscreen', id, flag)
  })
  unref(easyplayer).on('playbackRate', (rate) => {
    unref(easyplayer).setRate(rate);
  })

  unref(easyplayer).on('playbackSeek', (data) => {
    console.log('playbackSeek', data)
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
  const res = await streamApi.liveStream(idMap)
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
.video-player-container{
  width: 100%;
  min-height: 500px;
}
</style>

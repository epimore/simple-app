<template>
  <div v-if="showChannelPage">
    <el-card>
      <div
          style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px; position: relative;">
        <el-tag type="primary" size="large">
          <span style="font-weight: bold; font-size: 16px">{{ props.deviceInfo.alias }}</span>
        </el-tag>
        <el-button @click="returnToDeviceList" type="primary" style="position: absolute; right: 0;">返回</el-button>
      </div>

      <div style="display: flex; justify-content: center; align-items: center; margin-top: 10px">
        <el-text tag="mark">可接入:{{ props.deviceInfo.maxCamera }} 已接入:{{ props.deviceInfo.cameraInCount }}
          已掉线:{{ props.deviceInfo.cameraOffCount }}
        </el-text>
      </div>
    </el-card>
    <el-card>
      <div class="demo-fit">
        <el-row :gutter="8">
          <el-col v-for="item in channels" class="block">
            <el-card>
              <template #header>
            <span class="title">{{ item.name }}
            <el-tag
                :color="item.status === 'ON' ? '#00a870' : '#eee'"
                effect="dark"
            >
              {{ item.status === "ON" ? "在线" : "离线" }}
            </el-tag>
              </span>
                <span style="margin-left: 3vb;">
                <el-text type="primary" size="small">{{ item.ptzTypeStr }}</el-text>
              </span>
              </template>
              <el-image
                  v-loading="item.picUrl && !imageUrls[item.picUrl]"
                  :src="imageUrls[item.picUrl] || imgUrl"
                  style="width: 288px; height: 216px"
                  fit="cover"
                  @click="showList(item.channelId)"
              />

              <el-image-viewer
                  v-if="showPreview[item.channelId]"
                  :url-list="imageShow.get(item.channelId)"
                  @close="showPreview[item.channelId] = false"
              >
                <template
                    #toolbar="{ actions, reset, activeIndex }"
                >
                  <el-icon @click="actions('zoomOut')">
                    <ZoomOut/>
                  </el-icon>
                  <el-icon
                      @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })"
                  >
                    <ZoomIn/>
                  </el-icon>
                  <el-icon @click="actions('clockwise', { rotateDeg: 180, enableTransition: false })">
                    <RefreshRight/>
                  </el-icon>
                  <el-icon @click="actions('anticlockwise')">
                    <RefreshLeft/>
                  </el-icon>
                  <el-icon @click="reset">
                    <Refresh/>
                  </el-icon>
                  <el-icon @click="download(item.channelId)">
                    <Download/>
                  </el-icon>
                </template>
              </el-image-viewer>
              <template #footer>
                <div>
                  <el-button type="info" class="button" :disabled="item.status !== 'ON'"
                             @click="startPlay('live',item)">
                    实时直播
                  </el-button>
                  <el-button type="info" class="button" :disabled="item.status !== 'ON'"
                             @click="startPlay('back',item)">
                    历史回放
                  </el-button>
                  <el-button type="info" class="button" :disabled="!item.picUrl" @click="switchPics(item)">
                    抓拍图集
                  </el-button>
                </div>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>

  <PlayLive v-if="showLiveDialog"
            v-model="showLiveDialog"
            :dialogTitle="dialogTitle"
            :videoInfo="currentItemInfo"
            @closePlay="closePlay"/>
  <PlayBack v-if="showBackDialog"
            v-model="showBackDialog"
            :dialogTitle="dialogTitle"
            :videoInfo="currentItemInfo"
            @closePlay="closePlay"/>
  <Pics v-if="showPicPage"
        :channelInfo="currentItemInfo"
        @closeBack="closeBack"
  />
</template>

<script setup>
import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import infosApi from "@/api/info.js";
import {ElMessage} from "element-plus";
import imgUrl from '@/assets/ipc.png'
import PlayLive from "@/components/page/info/PlayLive.vue";
import PlayBack from "@/components/page/info/PlayBack.vue";
import {Download, Refresh, RefreshLeft, RefreshRight, ZoomIn, ZoomOut,} from '@element-plus/icons-vue'
import Pics from "@/components/page/info/PicPage.vue";

const channels = ref([]);
const deviceInfo = ref(null)
onMounted(() => {
  getChannels(props.deviceInfo.deviceId);
});
onUnmounted(() => {
  for (const url of imageCache.values()) {
    URL.revokeObjectURL(url); // 释放 Blob URL
  }
  imageCache.clear(); // 清空 Map
  imageUrls.value = {}; // 清空本地存储的 URL
  imageShow.value.clear(); // 清空显示列表
  showPreview.value = {}; // 重置预览状态
});


const getChannels = async (id) => {
  try {
    const res = await infosApi.channelInfo({deviceId: id});
    channels.value = res.data.data;
  } catch (error) {
    ElMessage.error("获取相机列表失败");
  }
}
//localUrl
const imageUrls = ref({}); // 存储每个 `item` 的图片 URL
//remoteUrl:localUrl
const imageCache = new Map();
let imageShow = ref(new Map());
const showPreview = ref({});

const download = (channelId) => {
  if (imageShow.value.has(channelId)) {
    const url = imageShow.value.get(channelId)[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `${channelId}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    ElMessage.error("该相机尚未生成封面快照.");
  }
};


const showList = (cid) => {
  if (imageShow.value.has(cid)) {
    showPreview.value[cid] = true;
  } else {
    ElMessage.error("该相机尚未生成封面快照.");
  }
};

// 监听 `channels` 数据变化，为每个 `item` 获取 `imageUrl`
watchEffect(async () => {
  for (const item of channels.value) {
    if (item.picUrl) {
      if (!imageCache.has(item.picUrl)) {
        let res = await getImage(item.picUrl);
        imageUrls.value[item.picUrl] = res;
        imageShow.value.set(item.channelId, [res]);
      } else {
        imageShow.value.set(item.channelId, [imageCache.get(item.picUrl)]);
      }
    }
  }
});

const getImage = async (url) => {
  if (!url) return imgUrl;
  if (imageCache.has(url)) return imageCache.get(url);

  try {
    const response = await infosApi.request_image(url);
    const blob = response.data;
    if (!(blob instanceof Blob)) return imgUrl;

    const objectUrl = URL.createObjectURL(blob);
    imageCache.set(url, objectUrl);
    return objectUrl;
  } catch (error) {
    console.error("图片加载失败:", error);
    return imgUrl;
  }
};

const props = defineProps({
  deviceInfo: {
    type: Object,
    required: true
  },
  emitter: {
    type: Object,
    required: true
  }
})

const returnToDeviceList = () => {
  props.emitter.emit('switch-to-device');
};

const showChannelPage = ref(true);
const showLiveDialog = ref(false);
const showBackDialog = ref(false);
const showPicPage = ref(false);
const dialogTitle = ref('播放');
const currentItemInfo = ref({});
const startPlay = (mode, item = {}) => {
  if (mode === 'live') {
    dialogTitle.value = '实时直播';
    showLiveDialog.value = true;
  } else {
    dialogTitle.value = '历史回放';
    showBackDialog.value = true;
  }
  currentItemInfo.value = item;
};

// 关闭操作
const closePlay = () => {
  getChannels(props.deviceInfo.deviceId);
  showLiveDialog.value = false
}

const switchPics = (item) => {
  currentItemInfo.value = item;
  showPicPage.value = true;
  showChannelPage.value = false;
}
const closeBack = () => {
  getChannels(props.deviceInfo.deviceId);
  showPicPage.value = false;
  showChannelPage.value = true;
}
</script>

<style scoped>
.demo-fit {
  display: flex;
  text-align: center;
  justify-content: space-between;
}

.demo-fit .block {
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
}

.demo-fit .title {
  margin-bottom: 12px;
  font-size: 18px;
  color: var(--el-text-color-secondary);
}
</style>

<template>
  <el-card>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
      <el-button @click="returnToDeviceList" type="primary" style="margin-left: 0">返回</el-button>
      <el-tag type="primary" size="large" style="margin-right: 47%">
        <span style="font-weight: bold;font-size: 16px">{{ props.deviceInfo.alias }}</span>
      </el-tag>
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
                :src="imageUrls[item.picUrl] || imgUrl"
                style="width: 288px; height: 216px"
                fit="cover"
                @click="showList(item.deviceId, item.channelId)"
            />

            <el-image-viewer
                v-if="showPreview[item.channelId]"
                :url-list="imageShow.get(item.channelId)"
                @close="showPreview[item.channelId] = false"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </el-card>
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
</template>

<script setup>
import {onMounted, ref, watchEffect} from "vue";
import infosApi from "@/api/info.js";
import {ElMessage} from "element-plus";
import imgUrl from '@/assets/ipc.png'
import PlayLive from "@/components/page/info/PlayLive.vue";
import PlayBack from "@/components/page/info/PlayBack.vue";

const channels = ref([]);
const deviceInfo = ref(null)
onMounted(() => {
  getChannels(props.deviceInfo.deviceId);
})
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
const channelImages = ref({});
let imageShow = ref(new Map());
const showPreview = ref({})

const showList = (did, cid) => {
  if (imageShow.value.has(cid)) {
    showPreview.value[cid] = true;
  }else {
    ElMessage.error("该相机无预览照片");
  }
};
// queryImageList(did, cid);

const queryImageList = async (did, cid, st, et) => {
  try {
    let info = await infosApi.channelImages({
      channelId: cid,
      deviceId: did,
      endTime: et,
      startTime: st,
      pageSize: 2,
    });
    if (info.data.code !== 200 || info.data.data.size === 0) {
      ElMessage.error("该相机无预览照片");
      return;
    }
    channelImages.value = {channelId: cid, data: info.data};
  } catch (error) {
    console.error("Error fetching images:", error);
  }
}
watchEffect(async () => {
  if (!channelImages.value?.data?.data?.list) {
    return;
  }
  let cid = channelImages.value.channelId;
  const newList = [];
  for (const item of channelImages.value.data.data.list) {
    if (item.picUrl) {
      newList.push(await getImage(item.picUrl));
    }
  }
  if (newList.length === 0) {
    return;
  }
  imageShow.value.set(cid, newList);
  // showPreview.value[cid] = true;
});

// 监听 `channels` 数据变化，为每个 `item` 获取 `imageUrl`
watchEffect(async () => {
  for (const item of channels.value) {
    if (item.picUrl) {
      if (!imageCache.has(item.picUrl)){
        let res = await getImage(item.picUrl);
        imageUrls.value[item.picUrl] = res;
        imageShow.value.set(item.channelId, [res]);
      }else {
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

const showLiveDialog = ref(false);
const showBackDialog = ref(false);
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

<script setup>
import {onMounted, ref} from "vue";
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
            </template>
            <el-image
                :src="imgUrl"
                style="width: 266px; height: 266px" fit="cover"
            />
            <template #footer>
              <div>
                <!--                <el-button type="info" class="button" @click="startPlay('live',item)">实时直播-->
                <el-button type="info" class="button" :disabled="item.status !== 'ON'" @click="startPlay('live',item)">
                  实时直播
                </el-button>
                <el-button type="info" class="button" :disabled="item.status !== 'ON'" @click="startPlay('back',item)">
                  历史回放
                </el-button>
              </div>
            </template>
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

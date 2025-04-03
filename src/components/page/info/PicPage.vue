<template>
  <el-card>
    <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px; position: relative;">
      <el-tag type="primary" size="large">
        <span style="font-weight: bold;font-size: 16px">抓拍图集</span>
      </el-tag>
      <el-button @click="closeBack" type="primary" style="position: absolute; right: 0;">返回</el-button>
    </div>
    <div style="display: flex; justify-content: center; align-items: center; margin-top: 10px">
      <el-text tag="mark">
        {{!props.channelInfo.alias ? props.channelInfo.channelId : props.channelInfo.alias}}
      </el-text>
    </div>
    <div>
      <el-text class="mx-1">日期选择：</el-text>
      <el-date-picker
          v-model="date"
          type="date"
          placeholder="选择抓拍日期"
          :disabled-date="disabledDate"
      />
      <!--      todo:告警搜索-->
      <el-button type="primary" :icon="Search" style="margin-left: 10px" @click="handleSearch">查询</el-button>
    </div>
  </el-card>
  <el-card>
    <div class="demo-fit">
      <el-row :gutter="6" style="display: flex; row-gap: 8px;">
        <el-col v-for="item in channelImages.list" class="block">
          <el-card>
            <el-image
                v-loading="item.picUrl && !imageUrls[item.picUrl]"
                :src="imageUrls[item.picUrl] || imgUrl"
                style="width: 288px; height: 216px"
                fit="cover"
                @click="showList(item.id)"
            />

            <el-image-viewer
                v-if="showPreview[item.id]"
                :url-list="imageShow.get(item.id)"
                @close="showPreview[item.id] = false"
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
                <el-icon @click="download(item.id)">
                  <Download/>
                </el-icon>
              </template>
            </el-image-viewer>
            <template #footer>
              <span style="margin-left: 3vb;">
                <el-text type="primary" size="small">{{ item.bizTime.replace('T', ' ') }}</el-text>
              </span>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <el-col :sm="12" :lg="6" v-if="noResult" style="margin: auto">
        <el-result icon="info" title="结果提示：">
          <template #sub-title>
            <p>未查询到图片</p>
          </template>
        </el-result>
      </el-col>
    </div>

    <div style="display: flex; justify-content: center; align-items: center; margin-top: 10px">
      <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="pageNum"
          @current-change="handlePageChange"
      />
    </div>
  </el-card>

</template>

<script setup>
import {onMounted, onUnmounted, ref, watchEffect} from "vue";
import infosApi from "@/api/info.js";
import {defineEmits} from "vue";
import {Download, Refresh, RefreshLeft, RefreshRight, Search, ZoomIn, ZoomOut} from "@element-plus/icons-vue";
import imgUrl from "@/assets/ipc.png";
import {dayjs, ElMessage} from "element-plus";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);


//localUrl
const imageUrls = ref({}); // 存储每个 `item` 的图片 URL
//remoteUrl:localUrl
const imageCache = new Map();
let imageShow = ref(new Map());
const showPreview = ref({});
const channelImages = ref({});
const pageNum = ref(1); // 当前页码
const pageSize = ref(8); // 每页数量
const total = ref(0); // 总数
const noResult = ref(false);
const lastDate = ref();
const disabledDate = (date) => {
  return date.getTime() > new Date().getTime();
};

const handleSearch = () => {
  // 检查日期是否发生变化
  if (date.value !== lastDate.value) {
    lastDate.value = date.value;
    imageCache.clear();
    imageUrls.value = {};
    imageShow.value.clear();
    showPreview.value = {};
  }
  pageNum.value = 1;
  getChannelImages(); // 重新请求数据
};
const handlePageChange = (newPage) => {
  pageNum.value = newPage;
  getChannelImages(); // 重新请求数据
};

const getChannelImages = () => {
  let did = props.channelInfo.deviceId;
  let cid = props.channelInfo.channelId;
  if (date.value) {
    let st = dayjs.utc(date.value).add(8, 'hour');
    let et = dayjs.utc(date.value).add(32, 'hour');
    queryImageList(did, cid, st, et);
  } else {
    queryImageList(did, cid);
  }
}
const queryImageList = async (did, cid, st = null, et = null) => {
  try {
    let params = {
      channelId: cid,
      deviceId: did,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    };

    if (st && et) {
      params.startTime = st;
      params.endTime = et;
    }

    let response = await infosApi.channelImages(params);
    channelImages.value = response.data.data;
    noResult.value = response.data.data.list.length === 0;
    total.value = response.data.data.total || 0; // 更新总数
  } catch (error) {
    console.error("Error fetching images:", error);
  }
}

const showList = (id) => {
  if (imageShow.value.has(id)) {
    showPreview.value[id] = true;
  } else {
    ElMessage.error("该相机尚未生成封面快照.");
  }
};

// 监听 `channels` 数据变化，为每个 `item` 获取 `imageUrl`
watchEffect(async () => {
  const list = await channelImages.value?.list; // 确保 list 存在
  if (!Array.isArray(list)) {
    return;
  }
  for (const item of list) {
    if (item.picUrl) {
      if (!imageCache.has(item.picUrl)) {
        let res = await getImage(item.picUrl);
        imageUrls.value[item.picUrl] = res;
        imageShow.value.set(item.id, [res]);
      } else {
        imageShow.value.set(item.id, [imageCache.get(item.picUrl)]);
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


const date = ref();

const emit = defineEmits(["closeBack"]);
const closeBack = () => {
  emit("closeBack");
};

onMounted(() => {
  let deviceId = props.channelInfo.deviceId;
  let channelId = props.channelInfo.channelId;
  queryImageList(deviceId, channelId);
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

const download = (id) => {
  if (imageShow.value.has(id)) {
    const url = imageShow.value.get(id)[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    ElMessage.error("该相机尚未生成封面快照.");
  }
};

const props = defineProps({
  channelInfo: {
    type: Object,
    required: true
  }
})
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
</style>
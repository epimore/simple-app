<script setup>
import {Search} from "@element-plus/icons-vue";
import {onMounted, reactive, ref} from "vue";
import infosApi from "@/api/info.js";
import deviceApi from "@/api/device.js";
import {ElMessage, ElMessageBox} from "element-plus";

onMounted(() => {
  getDeviceList();
})
let tableData = ref([]);
const searchForm = reactive({
  alias: ''
})
const getDeviceList = async () => {
  try {
    const res = await infosApi.devicesInfo(searchForm);
    tableData.value = res.data.data;
  } catch (error) {
    ElMessage.error("获取设备列表失败");
  }
}

const rmDevice = (id) => {
  ElMessageBox.confirm(
      '确定要删除该设备信息吗?',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    try {
      const res = await deviceApi.deviceRm({deviceId: id});
      if (res.data.code === 200) {
        ElMessage.success(res.data.data)
        await getDeviceList();
      } else {
        ElMessage.error("删除失败")
      }
    } catch (error) {
      ElMessage.error("删除操作失败");
    }
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '取消删除',
    })
  })
}

const props = defineProps({
  emitter: {
    type: Object,
    required: true
  }
});

const switchToChannel = (device) => {
  props.emitter.emit('switch-to-channel', device);
}
</script>

<template>
  <div>
    <el-card>
      <el-input style="width:440px" @clear="getDeviceList" clearable v-model="searchForm.alias"
                placeholder="请输入设备名称"
                class="input-with-select">
        <template #prepend>设备名称</template>
        <template #append>
          <el-button :icon="Search" @click="getDeviceList" style="float:left"/>
        </template>
      </el-input>
      <el-table :data="tableData" border style="width: 100%;margin-top:20px"
                :cell-style="{ textAlign: 'center' }"
                :header-cell-style="{ textAlign: 'center',background: '#f5f7fa', color: '#606266' }">
        <el-table-column label="序号" type="index" width="55"/>
        <el-table-column prop="deviceId" label="设备ID" width="190"/>
        <el-table-column prop="alias" label="设备名称" width="180"/>
        <el-table-column prop="deviceType" label="类型" width="60">
          <template #default="scope">{{ scope.row.deviceType === null ? "_" : scope.row.deviceType }}</template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="厂家" width="95">
          <template #default="scope">{{ scope.row.manufacturer === null ? "_" : scope.row.manufacturer }}</template>
        </el-table-column>
        <el-table-column prop="model" label="型号" width="100">
          <template #default="scope">{{ scope.row.model === null ? "_" : scope.row.model }}</template>
        </el-table-column>
        <el-table-column prop="firmware" label="固件版本" width="95">
          <template #default="scope">{{ scope.row.firmware === null ? "_" : scope.row.firmware }}</template>
        </el-table-column>
        <el-table-column prop="gbVersion" label="国标版本" width="90">
          <template #default="scope">{{ scope.row.gbVersion === null ? "_" : scope.row.gbVersion }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">{{
                scope.row.status === 1 ? "在线" : "离线"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="maxCamera" label="路数" width="60">
          <template #default="scope">
            {{ scope.row.maxCamera === null ? "_" : scope.row.maxCamera }}
          </template>
        </el-table-column>
        <el-table-column prop="cameraInCount" label="接入" width="60"/>
        <el-table-column prop="cameraOffCount" label="离线" width="60"/>
        <el-table-column prop="registerTime" label="注册时间" width="170">
          <template #default="scope">
            {{ scope.row.registerTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="scope">
            <el-button type="danger" size="small" @click="rmDevice(scope.row.deviceId)">删除</el-button>
            <el-button type="primary" size="small" @click="switchToChannel(scope.row)">相机</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>

</style>

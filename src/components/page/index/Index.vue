<template>
  <div>
    <el-card style="max-width: 50%">
      <template #header>
        <div class="card-header">
          <span style="font-size: 18px;">设备告警信息</span>
        </div>
      </template>
      <el-table :data="deviceEventArr" size="small" table-layout="auto"  border style="width: 100%">
        <el-table-column prop="priority" label="等级" width="45"/>
        <el-table-column prop="methodStr" label="方式" width="90"/>
        <el-table-column prop="alarmTypeStr" label="告警类型" width="150"/>
        <el-table-column prop="timeStr" label="告警时间" width="90">
          <template #default="{ row }">
            <div style="text-align: center;">
              <div>{{ row.timeStr.split('T')[0] }}</div>
              <div>{{ row.timeStr.split('T')[1] }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="deviceId" label="设备编号" width="110"/>
        <el-table-column prop="channelId" label="通道编号" min-width="100"/>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import event from "@/api/event.js";

const deviceEventArr = ref([]);
const notifyEventArr = ref([]);
const maxLength = 5

function addData(dataList, data) {
  dataList.value.unshift(data) // 新数据插到最前面
  // 控制最大长度，超出自动删除最后一条
  if (dataList.value.length > maxLength) {
    dataList.value.pop()
  }
}
let controller = event.eventConn(
    (msg) => {
      console.log("🎯 收到 SSE 消息:", msg);
      if (msg.type === 'device') {
        addData(deviceEventArr, msg.data);
      }
    },
    (error) => console.error("❌ SSE 错误:", error)
);

onMounted(() => {

});


</script>


<style scoped>

</style>
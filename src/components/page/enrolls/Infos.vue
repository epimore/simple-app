<script setup>
import enrollsApi from "@/api/enrolls.js";
import {onActivated, onMounted, reactive, ref} from "vue";
import {ElMessage, ElMessageBox} from 'element-plus';
import {Search} from "@element-plus/icons-vue";
import EditComponent from "@/components/page/enrolls/Edit.vue";

// Dom 挂载之后
onMounted(() => {
  getDeviceList();
})
// 用户数据
let tableData = ref([]);
// 搜索条件
const searchForm = reactive({
  alias: ''
})
// 获取设备列表
const getDeviceList = async () => {
  try {
    const res = await enrollsApi.query(searchForm);
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
      const res = await enrollsApi.rm({deviceId: id});
      if (res.data.code === 200) {
        ElMessage.success("删除成功")
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

const showDialog = ref(false);
const dialogTitle = ref('添加设备');
const currentItemInfo = ref({});

const openDialog = (mode, item = {}) => {
  if (mode === 'edit') {
    dialogTitle.value = '编辑设备';
    currentItemInfo.value = {...item};
    showDialog.value = true;
  } else {
    dialogTitle.value = '添加设备';
    currentItemInfo.value = {};
    showDialog.value = true;
  }
};

// 关闭操作
const closeDialog = (flag) => {
  if (flag) {
    getDeviceList()
  }
  showDialog.value = false
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
      <el-button type="primary" style="margin-left:20px" @click="openDialog('add')">添加设备</el-button>
      <el-table :data="tableData" border style="width: 100%;margin-top:20px"
                :cell-style="{ textAlign: 'center' }"
                :header-cell-style="{ textAlign: 'center',background: '#f5f7fa', color: '#606266' }">
        <el-table-column label="序号" type="index" width="60"/>
        <el-table-column prop="deviceId" label="SIP设备ID" width="200"/>
        <el-table-column prop="alias" label="设备名称" width="220"/>
        <el-table-column prop="domainId" label="SIP服务器ID" width="200"/>
        <el-table-column prop="domain" label="SIP服务器域" width="120"/>
        <el-table-column prop="heartbeatSec" label="心跳周期(秒)" width="120"/>
        <el-table-column prop="status" label="状态" width="98">
          <template #default="scope">
            <el-tag :type="scope.row.status === '1' ? 'success' : 'danger'">{{
                scope.row.status === '1' ? "启用" : "停用"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pwdCheck" label="秘钥认证" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.pwdCheck === '1' ? 'success' : 'danger'">{{
                scope.row.pwdCheck === '1' ? "是" : "否"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pwd" label="秘钥" width="220"/>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <el-button type="danger" size="small" @click="rmDevice(scope.row.deviceId)">删除</el-button>
            <el-button type="warning" size="small"
                       @click.native.prevent="openDialog('edit',scope.row)">编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  <EditComponent
      :modelValue="showDialog"
      :dialogTitle="dialogTitle"
      :itemInfo="currentItemInfo"
      @closeDialog="closeDialog"
  ></EditComponent>
</template>

<style scoped>

</style>

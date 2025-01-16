<template>
  <el-dialog
      :title="dialogTitle"
      v-model="showDialog"
      width="560px"
      center
      @close="closeDialog(0)"
  >
    <el-form
        ref="formRef"
        :model="formInfo"
        class="edit"
        label-width="120px"
    >
      <el-form-item label="SIP设备ID：" prop="deviceId" required>
        <el-input :disabled="dialogTitle==='编辑设备'" v-model="formInfo.deviceId"></el-input>
      </el-form-item>
      <el-form-item label="SIP服务器ID：" prop="domainId" required>
        <el-input :disabled="dialogTitle==='编辑设备'" v-model="formInfo.domainId"></el-input>
      </el-form-item>
      <el-form-item label="SIP服务器域：" prop="domain" required>
        <el-input :disabled="dialogTitle==='编辑设备'" v-model="formInfo.domain"></el-input>
      </el-form-item>
      <el-form-item label="设备名称：" prop="alias" required>
        <el-input v-model="formInfo.alias"></el-input>
      </el-form-item>
      <el-form-item label="心跳周期(秒)：" prop="heartbeatSec" required>
        <el-input v-model="formInfo.heartbeatSec"></el-input>
      </el-form-item>
      <el-form-item label="状态：" prop="status" required v-show="dialogTitle==='编辑设备'">
        <el-switch
            v-model="formInfo.status"
            active-value="1"
            inactive-value="0"
            active-text="启用"
            inactive-text="停用"/>
      </el-form-item>
      <el-form-item label="秘钥认证：" prop="pwdCheck" required>
        <el-switch v-model="formInfo.pwdCheck"
                   active-value="1"
                   inactive-value="0"
                   active-text="开启"
                   inactive-text="关闭"/>
      </el-form-item>
      <el-form-item label="秘钥：" prop="pwd" v-show="formInfo.pwdCheck === '1'" :required="formInfo.pwdCheck === '1'">
        <el-input v-model="formInfo.pwd"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer" style="right: auto">
        <el-button type="primary" @click="submitForm">确定</el-button>
        <el-button @click="closeDialog">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import {reactive, ref, watch} from "vue";
import {ElMessage} from "element-plus";
import enrollsApi from "@/api/enrolls.js";

const props = defineProps({
  dialogTitle: {
    type: String,
    default: "添加设备",
  },
  itemInfo: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["update:modelValue", "closeDialog"]);

const formRef = ref(null);
const showDialog = ref(props.modelValue);

watch(
    () => props.modelValue,
    (newVal) => {
      showDialog.value = newVal;
    }
);

watch(
    () => showDialog.value,
    (newVal) => {
      emit("update:modelValue", newVal);
    }
);

const formInfo = reactive({...props.itemInfo});

watch(
    () => props.itemInfo,
    (newItemInfo) => {
      Object.assign(formInfo, JSON.parse(JSON.stringify(newItemInfo)));
    },
    {immediate: true}
);

const submitForm = () => {

  formRef.value.validate((valid) => {
    if (valid) {
      try {
        if (props.dialogTitle === "添加设备") {
          // 调用添加接口
          enrollsApi.add(formInfo).then((res) => {
            if (res.data.code === 200) {
              ElMessage({
                message: "添加成功！",
                type: "success",
              });
              closeDialog(1);
            }
          })
        } else if (props.dialogTitle === "编辑设备") {
          // 调用编辑接口
          enrollsApi.modify(formInfo).then((res) => {
            if (res.data.code === 200) {
              ElMessage({
                message: "编辑成功！",
                type: "success",
              });
              closeDialog(1);
            }
          })
        } else {
          return false;
        }
      } catch (error) {
        ElMessage({
          message: "操作失败！",
          type: "fail",
        });
      }
      closeDialog(1);
    } else {
      return false;
    }
  });
};

const closeDialog = (flag) => {
  formRef.value.resetFields();
  showDialog.value = false;
  emit("closeDialog", flag);
};
</script>

<style scoped>
@keyframes dialog-fade-in {
  0% {
    transform: translate3d(0, -20px, 0);
    opacity: 0;
  }
  100% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

@keyframes dialog-fade-out {
  0% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
  100% {
    transform: translate3d(0, -20px, 0);
    opacity: 0;
  }
}
</style>

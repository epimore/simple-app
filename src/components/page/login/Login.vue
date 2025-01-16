<script setup>
import {reactive, ref} from "vue";
import userApi from "@/api/user";
import {ElMessage} from "element-plus";
import router from "@/router/index.js";

const form = reactive({
  account: "",
  pwd: "",
});
const ruleFormRef = ref();
const rules = reactive({
  account: [{required: true, message: "账号不能为空", trigger: "blur"}],
  pwd: [{required: true, message: "密码不能为空", trigger: "blur"}],
});
const onSubmit = () => {
  if (!ruleFormRef) return;
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      const res = await userApi.login(form);
      if (res.status) {
        if (res.status === 200) {
          sessionStorage.setItem("Gmv-Token", res.data.data);
          await router.push("/home");
        } else {
          ElMessage.error(res.data.message);
        }
      } else {
        ElMessage.error("服务器内部错误");
      }
    } else {
      return false;
    }
  });
};
</script>

<template>
  <div class="login">
    <div class="loginBox">
      <h3>用户登录</h3>
      <span class="deadline"></span>
      <el-form class="form" :model="form" :rules="rules" ref="ruleFormRef">
        <el-form-item prop="account">
          <div class="input">
            <img src="@/assets/login/username.png" alt=""/>
            <input id="account" type="text" placeholder="请输入用户名" v-model="form.account"/>
          </div>
        </el-form-item>
        <el-form-item prop="pwd">
          <div class="input">
            <img src="@/assets/login/password.png" alt=""/>
            <input id="password" type="password" placeholder="请输入密码" v-model="form.pwd"/>
          </div>
        </el-form-item>
        <el-form-item>
          <div class="btn" @click="onSubmit()">登 录</div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login {
  //background-image: url(@/assets/login/bg.png);
  background-repeat: no-repeat;
  width: 100%;
  height: 100vh; /* 使用视口高度 */
  background-size: 100% 100%; /* 可以根据需要调整为 contain 或 100% 100% */
  background-position: center; /* 确保背景图居中 */
  overflow: hidden;
  //background-color: #01cfff;
}

.loginBox {
  width: 62rem;
  height: 82rem;
  background-image: url(@/assets/login/loginbox.png);
  background-repeat: no-repeat;
  background-size: 100% 100%;
  overflow: hidden;

  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -41rem;
  margin-left: -31rem;
  z-index: 2;

  display: flex;
  flex-direction: column;
  align-items: center;
}

.loginBox h3 {
  font-size: 5rem;
  font-weight: 600;
  color: rgb(62, 197, 231);
  margin-top: 7rem;
  text-align: center;
  overflow: hidden;
}

.deadline {
  display: block;
  width: 10rem;
  height: 0.5rem;
  background: #01cfff;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.form {
  width: 44.5rem;
  height: 44.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  overflow: hidden;
}

.input {
  width: 44.5rem;
  height: 7.4rem;
  line-height: 5rem;
  background-image: url(@/assets/login/input.png);
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
}

.input img {
  margin-left: 3rem;
  overflow: hidden;
}

.form input {
  border: none;
  outline: none;
  background-color: transparent;
  color: aliceblue;
  overflow: hidden;
}

::-webkit-input-placeholder {
  color: rgb(51, 189, 239);
  overflow: hidden;
}

.input input {
  width: 35rem;
  height: 3.5rem;
  margin-left: 2rem;
  font-size: 2.4rem;
  overflow: hidden;
}

.btn {
  width: 26rem;
  height: 8.6rem;
  line-height: 8.6rem;
  text-align: center;
  font-size: 3.5rem;
  color: rgb(250, 250, 250);
  background-image: url(@/assets/login/login.png);
  cursor: pointer;
  margin-bottom: 8rem;
  overflow: hidden;
}
</style>

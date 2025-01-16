<script setup>
import {ref} from "vue";
import Device from "@/components/page/info/Device.vue";
import Channel from "@/components/page/info/Channel.vue";
import mitt from "mitt";

const isDevice = ref(true);
const deviceInfo = ref(null);
const emitter = mitt()
// Function to handle the event emitted from Device.vue to switch to Channel.vue
emitter.on('switch-to-channel', (device) => {
  isDevice.value = false;
  deviceInfo.value = device;
});

// Function to switch back to Device.vue
emitter.on('switch-to-device', () => {
  isDevice.value = true;
  deviceInfo.value = null;
});
</script>

<template>
  <template v-if="isDevice">
    <Device :emitter="emitter"/>
  </template>
  <template v-else>
    <Channel :deviceInfo="deviceInfo" :emitter="emitter"/>
  </template>
</template>

<style scoped>
</style>

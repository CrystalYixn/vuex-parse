<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    标准年龄{{ $store.state.age }}
    增加后年龄{{ $store.getters.plusAge }}
    增加后年龄{{ $store.getters.plusAge }}
    增加后年龄{{ $store.getters.plusAge }}
    <button @click="$store.commit('add', 1)">mutation</button>
    <button @click="$store.dispatch('add', 1)">action</button>
    <button @click="$store.state.age++">强制修改</button>

    <br/><br/>
    学校年龄{{ $store.state.school.age }}
    学校增加后年龄{{ $store.getters['school/plusAge'] }}
    <button @click="$store.commit('school/add', 1)">学校mutation</button>

    <br/><br/>
    动态模块{{ $store.state.school.dynamic.age }}
    动态模块增加后年龄{{ $store.getters['school/dynamic/plusAge'] }}
    <button @click="$store.commit('school/dynamic/add', 1)">动态模块mutation</button>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',
  components: {
    HelloWorld
  },
  mounted() {
    console.log(` ================== this.$store ================= `, this.$store)
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

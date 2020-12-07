import { createApp } from 'vue'
import { Slider, Input, List, Skeleton, Button } from 'ant-design-vue';
import App from './App.vue'
import './index.css'
import 'ant-design-vue/dist/antd.css';

const app = createApp(App);

app.use(Slider).use(Input).use(List).use(Skeleton).use(Button);

app.mount('#app');

<template>
  <PostDetail channel-key="daily" :channel-config="config" />
</template>

<script>
import PostDetail from './PostDetail.vue';

export default {
  name: 'DailyView',
  components: { PostDetail },
  data() {
    return {
      config: { title: '日常分享', desc: '分享生活中的点滴瞬间' },
    };
  },
};
</script>

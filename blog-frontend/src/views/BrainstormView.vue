<template>
  <PostDetail channel-key="brainstorm" :channel-config="config" />
</template>

<script>
import PostDetail from './PostDetail.vue';

export default {
  name: 'BrainstormView',
  components: { PostDetail },
  data() {
    return {
      config: { title: '思维风暴', desc: '提问、分享想法、碰撞灵感' },
    };
  },
};
</script>

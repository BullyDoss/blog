<template>
  <PostDetail channel-key="chat" :channel-config="config" />
</template>

<script>
import PostDetail from './PostDetail.vue';

export default {
  name: 'ChatView',
  components: { PostDetail },
  data() {
    return {
      config: { title: '生活碎片', desc: '分享生活，记录瞬间' },
    };
  },
};
</script>

<style scoped>
/* Chat 频道图片更大更突出 */
.post-image { max-height: 600px !important; border-radius: 8px !important; }
</style>

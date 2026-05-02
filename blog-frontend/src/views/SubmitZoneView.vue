<template>
  <PostDetail channel-key="daily" :channel-config="config" />
</template>

<script>
import PostDetail from './PostDetail.vue';

export default {
  name: 'SubmitZoneView',
  components: { PostDetail },
  data() {
    return {
      config: { title: '投稿专区', desc: '精选投稿内容展示' },
    };
  },
};
</script>

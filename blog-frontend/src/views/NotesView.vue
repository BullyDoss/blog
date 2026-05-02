<template>
  <PostDetail channel-key="notes" :channel-config="config" />
</template>

<script>
import PostDetail from './PostDetail.vue';

export default {
  name: 'NotesView',
  components: { PostDetail },
  data() {
    return {
      config: { title: '学习笔记', desc: '记录知识，沉淀思考' },
    };
  },
};
</script>

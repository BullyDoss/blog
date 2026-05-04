<template>
  <div class="channel-tabs">
    <router-link
      v-for="ch in channels"
      :key="ch.key"
      :to="'/' + ch.key"
      class="tab-item"
      :class="{ active: currentChannel === ch.key }"
    >
      {{ ch.label }}
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'ChannelTabs',
  data() {
    return {
      channels: [
        { key: 'notes', label: '学习笔记' },
        { key: 'brainstorm', label: '思维风暴' },
        { key: 'chat', label: '生活碎片' },
      ],
    };
  },
  computed: {
    currentChannel() {
      const path = this.$route.path;
      const segments = path.split('/').filter(Boolean);
      if (segments.length >= 1 && ['notes', 'brainstorm', 'chat'].includes(segments[0])) {
        return segments[0];
      }
      return 'notes';
    },
  },
};
</script>

<style scoped>
.channel-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #eee;
  padding-left: 24px;
  background: #fff;
}

.tab-item {
  padding: 14px 20px;
  font-size: 14px;
  color: #888;
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
  white-space: nowrap;
}

.tab-item:hover {
  color: #333;
}

.tab-item.active {
  color: #111;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #111;
}
</style>

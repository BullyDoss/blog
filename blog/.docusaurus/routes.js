import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/2024/01/01/welcome',
    component: ComponentCreator('/2024/01/01/welcome', 'f5a'),
    exact: true
  },
  {
    path: '/archive',
    component: ComponentCreator('/archive', '51a'),
    exact: true
  },
  {
    path: '/example-post',
    component: ComponentCreator('/example-post', '55e'),
    exact: true
  },
  {
    path: '/submit',
    component: ComponentCreator('/submit', 'f83'),
    exact: true
  },
  {
    path: '/tags',
    component: ComponentCreator('/tags', '626'),
    exact: true
  },
  {
    path: '/tags/公告',
    component: ComponentCreator('/tags/公告', '039'),
    exact: true
  },
  {
    path: '/tags/教程',
    component: ComponentCreator('/tags/教程', '299'),
    exact: true
  },
  {
    path: '/tags/介绍',
    component: ComponentCreator('/tags/介绍', 'baa'),
    exact: true
  },
  {
    path: '/tags/cloudflare',
    component: ComponentCreator('/tags/cloudflare', '126'),
    exact: true
  },
  {
    path: '/tags/docusaurus',
    component: ComponentCreator('/tags/docusaurus', 'eb2'),
    exact: true
  },
  {
    path: '/welcome',
    component: ComponentCreator('/welcome', 'c11'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'ea7'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

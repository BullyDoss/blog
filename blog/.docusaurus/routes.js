import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/admin',
    component: ComponentCreator('/admin', '8d3'),
    exact: true
  },
  {
    path: '/github-callback',
    component: ComponentCreator('/github-callback', '593'),
    exact: true
  },
  {
    path: '/submit',
    component: ComponentCreator('/submit', 'f83'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];

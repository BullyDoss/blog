import React from 'react';
import Layout from '@theme/Layout';
import SubmitForm from '@site/src/components/SubmitForm';

export default function SubmitPage(): React.ReactElement {
  return (
    <Layout title="我要投稿" description="向 Helloworld 的笔记投稿">
      <main style={{ padding: '2rem 0' }}>
        <SubmitForm />
      </main>
    </Layout>
  );
}

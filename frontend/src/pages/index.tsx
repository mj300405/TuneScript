// src/pages/index.tsx
import Layout from '../components/Layout';

const Home = () => {
  return (
    <Layout title="Home">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to TuneScript</h1>
        <p className="text-lg">Your place to upload, manage, and search for piano transcriptions.</p>
      </div>
    </Layout>
  );
};

export default Home;

import MainContent from '@/app/components/main-content';
import Navbar from '@/app/components/navbar';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <MainContent />
    </main>
  );
}

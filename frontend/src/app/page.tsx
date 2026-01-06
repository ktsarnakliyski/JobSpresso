// frontend/src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">JobSpresso</h1>
        <p className="text-lg text-gray-600 mb-8">
          A fresh shot for your job descriptions
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/analyze"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Analyze
          </Link>
          <Link
            href="/generate"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Generate
          </Link>
        </div>
      </div>
    </main>
  );
}

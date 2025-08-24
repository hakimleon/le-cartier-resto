import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Bienvenue sur votre nouvelle application
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Commencez par me dire ce que vous voulez construire.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/menu"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Aller au Menu
          </Link>
        </div>
      </div>
    </main>
  );
}

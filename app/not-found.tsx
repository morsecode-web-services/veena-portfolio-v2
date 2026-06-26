import Link from 'next/link';
import { Button } from '@/components/system/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-playfair text-gold-500/20 font-bold select-none">404</h1>

        <div className="-mt-12 space-y-4">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold text-navy-900">
            Page Not Found
          </h2>

          <p className="text-slate-600">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="primary" size="base">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-20 bg-muted rounded-full mb-6">
          <FileQuestion className="size-10 text-muted-foreground" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button variant="outline" size="lg" asChild>
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

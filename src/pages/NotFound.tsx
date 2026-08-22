import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-8">Page not found or under construction.</p>
      <Link to="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
        Go Home
      </Link>
    </div>
  );
}

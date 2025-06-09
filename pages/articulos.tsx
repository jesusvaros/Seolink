import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This is a redirect page to handle the missing /articulos route
export default function ArticulosRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/articulos/');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirigiendo...</p>
    </div>
  );
}

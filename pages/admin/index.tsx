import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/admin/script-manager');
  }, [router]);
  
  return (
    <>
      <Head>
        <title>Redirigiendo... - Amazon Afiliados</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Redirigiendo al gestor de scripts...</p>
        </div>
      </div>
    </>
  );
}

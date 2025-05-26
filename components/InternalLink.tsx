import Link from 'next/link';
import { ReactNode } from 'react';

interface InternalLinkProps {
  href: string;
  children: ReactNode;
}

export default function InternalLink({ href, children }: InternalLinkProps) {
  return (
    <Link href={href} className="text-blue-600 underline hover:text-blue-800">
      {children}
    </Link>
  );
}

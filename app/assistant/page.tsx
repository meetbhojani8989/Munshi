import App from '@/components/App';
import{auth}from'@/auth';
import{redirect}from'next/navigation';

// Renders inside the main shell like every other page (see app/[page]/page.tsx).
export default async function Page(){
  if(!await auth())redirect('/login');
  return <App page="assistant"/>;
}

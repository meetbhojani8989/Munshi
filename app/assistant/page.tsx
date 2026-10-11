import{redirect}from'next/navigation';
import{auth}from'@/auth';
import TopBar from'@/components/ai/TopBar';
import AssistantView from'@/components/ai/AssistantView';

export default async function AssistantPage(){
  if(!await auth())redirect('/login');
  return <div className="min-h-screen">
    <TopBar/>
    <main className="main p-8 md:p-10 max-w-7xl mx-auto"><AssistantView/></main>
  </div>;
}

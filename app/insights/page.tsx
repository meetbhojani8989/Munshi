import{redirect}from'next/navigation';
import{auth}from'@/auth';
import TopBar from'@/components/ai/TopBar';
import InsightsView from'@/components/ai/InsightsView';

export default async function InsightsPage(){
  if(!await auth())redirect('/login');
  return <div className="min-h-screen">
    <TopBar/>
    <main className="main p-8 md:p-10 max-w-7xl mx-auto"><InsightsView/></main>
  </div>;
}

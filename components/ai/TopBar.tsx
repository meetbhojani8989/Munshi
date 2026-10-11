'use client';
// Temporary top bar for the standalone AI pages. It exists only because these
// pages render outside the main sidebar shell for now; once the shell is
// extracted into a layout, delete this file and the <TopBar/> in each page.
import Link from'next/link';
import{usePathname}from'next/navigation';

const links=[['/dashboard','Dashboard'],['/insights','Insights'],['/scorecard','Scorecard'],['/assistant','Ask Munshi']]as const;

export default function TopBar(){
  const pathname=usePathname();
  return <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-5 md:px-10 h-17 py-3 flex items-center gap-4 justify-between">
    <Link href="/dashboard" className="flex items-center gap-3 text-lg font-extrabold">
      <span className="w-8 h-8 flex items-center justify-center rounded-xl text-white bg-[#154635]">M</span>Munshi
    </Link>
    <nav className="flex gap-1 text-sm">
      {links.map(([href,label])=>
        <Link key={href} href={href} className={'px-3 py-2 rounded-xl '+(pathname===href?'bg-[#e1efe7] text-[#14563d] font-semibold':'muted')}>{label}</Link>
      )}
    </nav>
  </header>;
}

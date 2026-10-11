'use client';
import{useEffect,useState}from'react';
import{LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer}from'recharts';
import type{ScorecardData,Verdict}from'@/lib/ai/types';
import{Card,Title,money}from'./ui';

const verdictLabel:Record<Verdict,string>={right:'Right',partial:'Partial',wrong:'Off target'};
const verdictClass:Record<Verdict,string>={right:'positive',partial:'text-amber',wrong:'negative'};

export default function ScorecardView(){
  const[data,setData]=useState<ScorecardData|null>(null);
  const[error,setError]=useState('');

  useEffect(()=>{
    fetch('/api/scorecard')
      .then(r=>r.json().then(d=>({ok:r.ok,d})))
      .then(({ok,d})=>{if(!ok)throw new Error(d.error||'Unable to load scorecard');setData(d)})
      .catch(e=>setError(e.message));
  },[]);

  if(error)return <Card className="border-red"><p className="negative text-sm">{error}</p></Card>;
  if(!data)return <div className="muted">Loading the scorecard…</div>;

  return <>
    <Title kicker="Accountable advice" title="Prediction Scorecard" sub="Munshi grades its recommendations against actual results."/>
    <div className="grid md:grid-cols-[1fr_2fr] gap-5 mb-5">
      <Card>
        <div className="muted text-sm">Overall accuracy</div>
        <div className="text-5xl font-bold positive mt-3">{data.overallAccuracy}%</div>
        <p className="text-sm mt-4 positive font-semibold">{data.trendingUp?'↗ Trending up':'Holding steady'}</p>
        <p className="text-sm muted mt-2">Advice that keeps being wrong gets weighted down; advice that works gets used more.</p>
      </Card>
      <Card>
        <h2>Accuracy over time</h2>
        <div className="h-44 mt-4">
          <ResponsiveContainer>
            <LineChart data={data.trend}>
              <XAxis dataKey="label"/>
              <YAxis domain={[0,100]}/>
              <Tooltip/>
              <Line dataKey="accuracy" stroke="#16845e" strokeWidth={3} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
    <Card>
      <h2>Past predictions</h2>
      <div className="tablewrap mt-4">
        <table className="table">
          <thead><tr><th>Prediction</th><th>Predicted</th><th>Actual</th><th>Verdict</th><th>What Munshi learned</th></tr></thead>
          <tbody>
            {data.rows.map((r,i)=>
              <tr key={i}>
                <td>{r.prediction}</td>
                <td>{money(r.predicted)}</td>
                <td>{money(r.actual)}</td>
                <td><span className={verdictClass[r.verdict]}>{verdictLabel[r.verdict]}</span></td>
                <td className="text-sm muted">{r.lesson}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  </>;
}

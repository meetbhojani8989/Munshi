// LearningService: grades a past prediction against the actual result, records
// the lesson, and nudges per-category accuracy weights so advice that keeps
// working is trusted more and advice that misses is trusted less.
import{
  suggestionCategories,
  type SuggestionCategory,
  type AccuracyWeights,
  type Verdict,
  type Prediction,
  type LearningResult,
  type ScorecardData,
  type ScorecardRow,
}from'./types';

const RIGHT_WITHIN=0.15; // relative error at/under which a call counts as right
const PARTIAL_WITHIN=0.40; // ...and under which it is partially right
const MIN_WEIGHT=0.25;
const MAX_WEIGHT=2.0;

export function defaultWeights():AccuracyWeights{
  return Object.fromEntries(suggestionCategories.map(c=>[c,1]))as AccuracyWeights;
}

function relativeError(predicted:number,actual:number):number{
  if(predicted===0)return actual===0?0:1;
  return Math.abs(actual-predicted)/Math.abs(predicted);
}

export function verdictFor(predicted:number,actual:number):Verdict{
  const error=relativeError(predicted,actual);
  if(error<=RIGHT_WITHIN)return'right';
  if(error<=PARTIAL_WITHIN)return'partial';
  return'wrong';
}

function lessonFor(verdict:Verdict,predicted:number,actual:number):string{
  if(verdict==='right')return'The forecast matched the result; keep weighting this kind of advice.';
  const softer=actual<predicted;
  if(verdict==='partial')return softer
    ?'Close, but demand came in a little softer than predicted.'
    :'Close, and the upside was slightly stronger than predicted.';
  return softer
    ?'Demand was much weaker than expected; discount this pattern next time.'
    :'The result far outpaced the forecast; the model was too cautious here.';
}

function adjust(weight:number,verdict:Verdict):number{
  const delta=verdict==='right'?0.1:verdict==='partial'?0:-0.15;
  return Math.min(MAX_WEIGHT,Math.max(MIN_WEIGHT,Math.round((weight+delta)*100)/100));
}

export class LearningService{
  constructor(public weights:AccuracyWeights=defaultWeights()){}

  // Grade one prediction, update the category weight, and return the verdict.
  record(prediction:Prediction,actual:number):LearningResult{
    const verdict=verdictFor(prediction.predicted,actual);
    this.weights[prediction.category]=adjust(this.weights[prediction.category],verdict);
    return{
      predictionId:prediction.id,
      verdict,
      lesson:lessonFor(verdict,prediction.predicted,actual),
      predicted:prediction.predicted,
      actual,
      error:Math.round(relativeError(prediction.predicted,actual)*100)/100,
    };
  }

  // Build the scorecard from oldest→newest history so the trend reflects learning.
  scorecard(history:{prediction:Prediction;actual:number}[]):ScorecardData{
    const weights=defaultWeights();
    const rows:ScorecardRow[]=[];
    const trend:{label:string;accuracy:number}[]=[];
    let score=0;
    history.forEach(({prediction,actual},i)=>{
      const verdict=verdictFor(prediction.predicted,actual);
      weights[prediction.category]=adjust(weights[prediction.category],verdict);
      score+=verdict==='right'?1:verdict==='partial'?0.5:0;
      rows.push({
        prediction:prediction.action,
        category:prediction.category,
        predicted:prediction.predicted,
        actual,
        verdict,
        lesson:lessonFor(verdict,prediction.predicted,actual),
      });
      trend.push({label:`#${i+1}`,accuracy:Math.round((score/(i+1))*100)});
    });
    this.weights=weights;
    return{
      overallAccuracy:history.length?Math.round((score/history.length)*100):0,
      trendingUp:trend.length>1&&trend[trend.length-1].accuracy>=trend[0].accuracy,
      trend,
      weights,
      rows,
    };
  }
}

export const learning=new LearningService();

// Re-export so callers can narrow without importing the types module directly.
export type{SuggestionCategory};

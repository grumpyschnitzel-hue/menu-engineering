'use client'

import { useState, useMemo } from 'react'
import { scoreDescription } from '@/lib/psychology'

export default function DescriptionScorer() {
  const [description, setDescription] = useState('')

  const result = useMemo(() => {
    if (description.trim().length < 3) return null
    return scoreDescription(description)
  }, [description])

  const scoreColor = result
    ? result.percentage >= 70 ? 'text-green-400' : result.percentage >= 40 ? 'text-yellow-400' : 'text-red-400'
    : 'text-steel'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold uppercase">Description Quality Scorer</h3>
        <p className="text-xs text-steel mt-1">
          Research: Descriptive menu labels increase sales by 27% (Cornell, Wansink et al.). Score your descriptions to find quick wins.
        </p>
      </div>

      <div className="card">
        <label className="block text-xs font-medium text-steel uppercase tracking-wider mb-2">
          Paste or type a menu item description
        </label>
        <textarea
          className="w-full px-3 py-3 bg-navy-light border border-navy-border rounded-lg text-white text-sm placeholder:text-steel focus:outline-none focus:border-gold transition-colors resize-none"
          rows={3}
          placeholder='e.g. "Slow-braised Black Forest beef cheeks with velvety root vegetable puree and a rich red wine reduction"'
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {result && (
          <div className="mt-4 space-y-4">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy-light border border-navy-border">
              <div>
                <div className="text-xs text-steel uppercase tracking-wider">Overall Score</div>
                <div className={`font-display text-3xl font-bold ${scoreColor}`}>
                  {result.percentage}%
                </div>
              </div>
              <div className="text-right">
                <div className={`font-display text-4xl font-bold ${scoreColor}`}>
                  {result.totalScore}
                </div>
                <div className="text-xs text-steel">/ {result.maxScore} points</div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CriteriaCard
                label="Sensory Words"
                score={result.criteria.sensoryWords.score}
                maxScore={result.criteria.sensoryWords.maxScore}
                detail={result.criteria.sensoryWords.found.length > 0
                  ? `Found: ${result.criteria.sensoryWords.found.join(', ')}`
                  : 'None found — add words like crispy, velvety, smoky'}
              />
              <CriteriaCard
                label="Geographic Origin"
                score={result.criteria.geographicOrigin.score}
                maxScore={result.criteria.geographicOrigin.maxScore}
                detail={result.criteria.geographicOrigin.found
                  ? 'Origin reference detected'
                  : 'Add origin (e.g., "Hudson Valley," "Black Forest")'}
              />
              <CriteriaCard
                label="Preparation Method"
                score={result.criteria.preparationMethod.score}
                maxScore={result.criteria.preparationMethod.maxScore}
                detail={result.criteria.preparationMethod.found.length > 0
                  ? `Found: ${result.criteria.preparationMethod.found.join(', ')}`
                  : 'Add method (slow-braised, wood-fired, house-made)'}
              />
              <CriteriaCard
                label="Emotional Language"
                score={result.criteria.emotionalLanguage.score}
                maxScore={result.criteria.emotionalLanguage.maxScore}
                detail={result.criteria.emotionalLanguage.found.length > 0
                  ? `Found: ${result.criteria.emotionalLanguage.found.join(', ')}`
                  : 'Add nostalgia (heritage, traditional, family recipe)'}
              />
              <CriteriaCard
                label="Optimal Length"
                score={result.criteria.optimalLength.score}
                maxScore={result.criteria.optimalLength.maxScore}
                detail={`${result.criteria.optimalLength.wordCount} words (ideal: 8-25)`}
              />
              <CriteriaCard
                label="No Price Pain"
                score={result.criteria.noPricePain.score}
                maxScore={result.criteria.noPricePain.maxScore}
                detail={result.criteria.noPricePain.clean
                  ? 'Clean — no $ signs or price language'
                  : 'Remove $ signs and price references from description'}
              />
            </div>

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
                <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">Quick Wins</div>
                <ul className="space-y-1">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-white/80 flex items-start gap-2">
                      <span className="text-gold mt-0.5">→</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CriteriaCard({ label, score, maxScore, detail }: { label: string; score: number; maxScore: number; detail: string }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="p-3 rounded-lg bg-navy-light border border-navy-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-steel uppercase">{label}</span>
        <span className="text-xs font-bold text-white">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-navy-card rounded-full h-1.5 mb-2">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-steel">{detail}</p>
    </div>
  )
}

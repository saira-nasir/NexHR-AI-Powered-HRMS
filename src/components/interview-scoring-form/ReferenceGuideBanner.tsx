import { Badge } from '@/components/ui/badge';
import { Info, Star, TrendingUp } from 'lucide-react';

export const ReferenceGuideBanner: React.FC = () => {
  return (
    <div className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-xl border-2 border-indigo-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Info className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Quick Reference Guide</h3>
            <p className="text-sm text-gray-600">Use this guide for consistent and objective scoring</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Scale */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-indigo-600" />
              Rating Scale (1-5)
            </h4>
            <div className="space-y-2">
              {[
                { score: 5, title: 'Exceptional', color: 'bg-green-600' },
                { score: 4, title: 'Strong', color: 'bg-blue-600' },
                { score: 3, title: 'Meets Expectations', color: 'bg-yellow-600' },
                { score: 2, title: 'Below Expectations', color: 'bg-orange-600' },
                { score: 1, title: 'Poor/Red Flag', color: 'bg-red-600' },
              ].map((item) => (
                <div key={item.score} className="flex items-center gap-2">
                  <Badge className={`${item.color} text-white w-6 h-6 flex items-center justify-center p-0`}>
                    {item.score}
                  </Badge>
                  <span className="text-xs text-gray-700">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Thresholds */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              Recommendation Thresholds
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-gray-600 mb-1">Strong Hire</p>
                <p className="text-sm font-bold text-green-700">≥85%</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Hire</p>
                <p className="text-sm font-bold text-blue-700">70-84%</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-gray-600 mb-1">Hold/Discuss</p>
                <p className="text-sm font-bold text-yellow-700">50-69%</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">No Hire</p>
                <p className="text-sm font-bold text-red-700">{'<'}50%</p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="mt-4 pt-4 border-t border-indigo-200">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-900">How to score:</strong> Set Weight (1-5) based on importance → 
            Assign Rating (1-5) during interview → Weighted Score = Rating × Weight → 
            Final Score = Sum of all Weighted Scores
          </p>
        </div>
      </div>
    </div>
  );
};

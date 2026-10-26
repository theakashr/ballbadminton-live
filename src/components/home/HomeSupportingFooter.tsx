import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Radio, CheckCircle2, ShieldCheck } from 'lucide-react';
import { nativeHaptics } from '../../lib/nativeBridge';

export const HomeSupportingFooter: React.FC = () => {
  return (
    <footer className="mt-12 sm:mt-16 border-t border-[#E4E7EC] bg-[#F0F2F6] text-[#182230] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-[#E4E7EC]">
          
          {/* Brand & Federation Overview (Col 1-5) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFF1E5] border border-[#FF851B]/30 shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="none">
                  <ellipse cx="14" cy="13" rx="8" ry="9.5" stroke="#FF851B" strokeWidth="1.8" />
                  <line x1="14" y1="22.5" x2="14" y2="29" stroke="#182230" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="23" cy="21" r="5" fill="#FFDC00" stroke="#FF851B" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-base tracking-tight text-[#182230]">
                  BALL BADMINTON
                </span>
                <span className="bg-[#D92D20]/10 text-[#D92D20] text-[9px] font-black px-1 py-0.5 rounded uppercase tracking-wider border border-[#D92D20]/30">
                  LIVE
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed max-w-sm">
              India&apos;s premier digital broadcasting &amp; scoring platform for Ball Badminton. 
              Delivering verified court scores, 1st/2nd hand rotation tracking, and live championship brackets.
            </p>

            <p className="text-xs font-semibold text-[#FF851B]">
              ಕರ್ನಾಟಕ ಹಾಗೂ ರಾಷ್ಟ್ರಮಟ್ಟದ ಪಂದ್ಯಾವಳಿಗಳ ಅಧಿಕೃತ ಲೈವ್ ಸ್ಕೋರ್ ವೇದಿಕೆ.
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-[#667085]">
              <span className="px-2 py-0.5 rounded bg-[#FFF1E5] border border-[#FF851B]/30 text-[10px] font-bold text-[#FF851B] uppercase">
                Official BBFI Format
              </span>
              <span>29 Points per Set</span>
              <span>•</span>
              <span>5s Team Format</span>
            </div>
          </div>

          {/* Quick Navigation (Col 6-8) */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#182230]">
              Championship Hub
            </h4>
            <ul className="space-y-1.5 text-xs text-[#667085]">
              <li>
                <Link 
                  to="/live" 
                  onClick={() => nativeHaptics.selection()}
                  className="hover:text-[#FF851B] transition-colors flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-[#D92D20]" />
                  <span>Live Matches</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/tournaments" 
                  onClick={() => nativeHaptics.selection()}
                  className="hover:text-[#FF851B] transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#FF851B]" />
                  <span>Tournaments &amp; Draws</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/results" 
                  onClick={() => nativeHaptics.selection()}
                  className="hover:text-[#FF851B] transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16803D]" />
                  <span>Match Results Archive</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Officials & Scorer Portal (Col 9-12) */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#182230]">
              Officials &amp; Umpires
            </h4>
            <p className="text-xs text-[#667085] leading-relaxed">
              Authorized scorers and federation officials can access courtside scoring pads and bracket management.
            </p>
            <div className="pt-1">
              <Link
                to="/admin"
                onClick={() => nativeHaptics.selection()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF1E5] hover:bg-[#FFE5D0] border border-[#FF851B]/30 text-xs font-semibold text-[#FF851B] transition-all active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Scorer Portal</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Legal / Metadata Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085]">
          <p>© 2026 Ball Badminton Live. All official tournament rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Fast • Low Latency • Realtime</span>
            <span>•</span>
            <span>BBFI Certified Logic</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

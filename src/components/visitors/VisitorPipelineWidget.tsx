import React from 'react';
import { Visitor, VisitorStatus } from '@/types/database';
import { UserCheck, ChevronRight } from 'lucide-react';

interface VisitorPipelineWidgetProps {
  visitors: Visitor[];
  onSelectVisitor: (visitor: Visitor) => void;
  onStatusChange: (visitorId: string, newStatus: VisitorStatus) => void;
}

const STAGES: { key: VisitorStatus; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'new', label: 'New Guests', color: 'text-emerald-800', bgColor: 'bg-emerald-50/70', borderColor: 'border-emerald-200' },
  { key: 'contact_pending', label: 'Contact Pending', color: 'text-amber-800', bgColor: 'bg-amber-50/70', borderColor: 'border-amber-200' },
  { key: 'contacted', label: 'Contacted', color: 'text-blue-800', bgColor: 'bg-blue-50/70', borderColor: 'border-blue-200' },
  { key: 'follow_up_scheduled', label: 'Follow-up Due', color: 'text-indigo-800', bgColor: 'bg-indigo-50/70', borderColor: 'border-indigo-200' },
  { key: 'follow_up_completed', label: 'Follow-up Done', color: 'text-purple-800', bgColor: 'bg-purple-50/70', borderColor: 'border-purple-200' },
  { key: 'returned_visitor', label: 'Returned Visitor', color: 'text-sky-800', bgColor: 'bg-sky-50/70', borderColor: 'border-sky-200' },
  { key: 'regular_attendee', label: 'Regular Attendee', color: 'text-teal-800', bgColor: 'bg-teal-50/70', borderColor: 'border-teal-200' },
  { key: 'became_member', label: 'Became Member', color: 'text-violet-800', bgColor: 'bg-violet-50/70', borderColor: 'border-violet-200' },
];

export function VisitorPipelineWidget({ visitors, onSelectVisitor }: VisitorPipelineWidgetProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-600" /> Visitor Journey Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track visitors through stages from first Sunday attendance to member conversion.
          </p>
        </div>
      </div>

      {/* Horizontal Stage Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageVisitors = visitors.filter((v) => v.status === stage.key);
          return (
            <div
              key={stage.key}
              className={`rounded-2xl border ${stage.borderColor} ${stage.bgColor} p-3 flex flex-col justify-between min-h-[320px] shadow-xs`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                  <h4 className={`text-xs font-black uppercase tracking-tight ${stage.color}`}>{stage.label}</h4>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-white text-slate-800 shadow-xs border border-slate-200">
                    {stageVisitors.length}
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  {stageVisitors.length === 0 ? (
                    <div className="text-[11px] text-slate-400 font-medium italic text-center py-8">No guests</div>
                  ) : (
                    stageVisitors.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => onSelectVisitor(v)}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md cursor-pointer transition hover:border-sky-400 group"
                      >
                        <div className="font-extrabold text-slate-900 text-xs group-hover:text-sky-600 transition flex items-center justify-between">
                          <span>
                            {v.first_name} {v.last_name}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1 space-y-0.5">
                          {v.phone && <div>📞 {v.phone}</div>}
                          <div>📅 {v.visit_date}</div>
                          {(v.visit_count || 1) > 1 && (
                            <div className="text-sky-600 font-extrabold">🔁 {v.visit_count} visits</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

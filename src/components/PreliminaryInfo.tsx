import { useState } from 'react';
import { PreliminaryInfo as PreliminaryInfoType } from '@/lib/types';
import { useWorkflowStore } from '@/lib/workflow-store';
import { CheckCircle2, AlertTriangle, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface PreliminaryInfoProps {
  schemeId: string;
  info: PreliminaryInfoType;
}

type EditField = 'schemeRegNo' | 'priorYearDocs' | 'acPeriod' | 'schemeName' | 'abbreviation' | null;

function FieldCard({ label, value, isComplete, onEdit }: {
  label: string;
  value?: string;
  isComplete: boolean;
  onEdit: () => void;
}) {
  return (
    <button
      onClick={onEdit}
      className={`rounded-lg border-2 p-3 min-w-[140px] transition-colors text-left hover:shadow-sm group ${
        isComplete ? 'border-task-complete bg-task-complete/5' : 'border-task-overdue bg-task-overdue/5'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
        <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium truncate">{value || '—'}</span>
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-task-complete shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-task-overdue shrink-0" />
        )}
      </div>
    </button>
  );
}

export default function PreliminaryInfo({ schemeId, info }: PreliminaryInfoProps) {
  const { updatePreliminaryInfo } = useWorkflowStore();
  const [editField, setEditField] = useState<EditField>(null);

  // Local state for dialog
  const [localRegNo, setLocalRegNo] = useState(info.schemeRegNo);
  const [localAcDate, setLocalAcDate] = useState(info.acPeriodDate);
  const [localSchemeName, setLocalSchemeName] = useState(info.schemeName);
  const [localAbbrev, setLocalAbbrev] = useState(info.nameAbbreviation);

  const openEdit = (field: EditField) => {
    setLocalRegNo(info.schemeRegNo);
    setLocalAcDate(info.acPeriodDate);
    setLocalSchemeName(info.schemeName);
    setLocalAbbrev(info.nameAbbreviation);
    setEditField(field);
  };

  const saveField = () => {
    if (editField === 'schemeRegNo') {
      updatePreliminaryInfo(schemeId, { schemeRegNo: localRegNo });
    } else if (editField === 'priorYearDocs') {
      updatePreliminaryInfo(schemeId, { priorYearDocsUploaded: !info.priorYearDocsUploaded });
    } else if (editField === 'acPeriod') {
      updatePreliminaryInfo(schemeId, { acPeriodDate: localAcDate, acPeriodConfirmed: !!localAcDate });
    } else if (editField === 'schemeName') {
      updatePreliminaryInfo(schemeId, { schemeName: localSchemeName, schemeNameConfirmed: !!localSchemeName });
    } else if (editField === 'abbreviation') {
      updatePreliminaryInfo(schemeId, { nameAbbreviation: localAbbrev });
    }
    setEditField(null);
  };

  const completedCount = [
    info.acPeriodConfirmed,
    info.schemeNameConfirmed, !!info.nameAbbreviation,
  ].filter(Boolean).length;
  const allComplete = completedCount === 3;

  return (
    <>
      <div className="bg-card border rounded-xl p-5 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold">Preliminary Checks</h3>
            <p className="text-xs text-muted-foreground">Click any field to update · Complete all to unlock tasks</p>
          </div>
          <div className={`text-2xl font-bold ml-auto ${allComplete ? 'text-task-complete' : 'text-task-overdue'}`}>
            {completedCount}/3
            {!allComplete && <AlertTriangle className="inline h-5 w-5 ml-1 -mt-1" />}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <FieldCard label="AC Period Confirmed?" value={info.acPeriodDate || 'Pending'} isComplete={info.acPeriodConfirmed} onEdit={() => openEdit('acPeriod')} />
          <FieldCard label="Scheme Name Confirmed?" value={info.schemeName || 'Pending'} isComplete={info.schemeNameConfirmed} onEdit={() => openEdit('schemeName')} />
          <FieldCard label="Abbreviation Confirmed?" value={info.nameAbbreviation || 'Pending'} isComplete={!!info.nameAbbreviation} onEdit={() => openEdit('abbreviation')} />
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editField !== null} onOpenChange={(open) => !open && setEditField(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editField === 'schemeRegNo' && 'Scheme Registration Number'}
              {editField === 'priorYearDocs' && 'Prior Year Documents'}
              {editField === 'acPeriod' && 'Accounting Period'}
              {editField === 'schemeName' && 'Scheme Name'}
              {editField === 'abbreviation' && 'Name Abbreviation'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {editField === 'schemeRegNo' && (
              <div>
                <Label className="text-xs">Registration Number</Label>
                <Input value={localRegNo} onChange={(e) => setLocalRegNo(e.target.value)} placeholder="e.g. 00765918RD" className="mt-1" />
              </div>
            )}
            {editField === 'priorYearDocs' && (
              <p className="text-sm text-muted-foreground">
                Current status: <span className="font-medium">{info.priorYearDocsUploaded ? 'Uploaded' : 'Not uploaded'}</span>.
                Click Save to toggle.
              </p>
            )}
            {editField === 'acPeriod' && (
              <div>
                <Label className="text-xs">Accounting Period End Date</Label>
                <Input value={localAcDate} onChange={(e) => setLocalAcDate(e.target.value)} placeholder="e.g. 31-Mar-26" className="mt-1" />
              </div>
            )}
            {editField === 'schemeName' && (
              <div>
                <Label className="text-xs">Confirmed Scheme Name</Label>
                <Input value={localSchemeName} onChange={(e) => setLocalSchemeName(e.target.value)} placeholder="Full scheme name" className="mt-1" />
              </div>
            )}
            {editField === 'abbreviation' && (
              <div>
                <Label className="text-xs">Select abbreviation</Label>
                <Select value={localAbbrev} onValueChange={setLocalAbbrev}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {['Scheme', 'Plan', 'Fund', 'Section'].map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditField(null)}>Cancel</Button>
            <Button size="sm" onClick={saveField}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

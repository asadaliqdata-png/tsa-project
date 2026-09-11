import { useState, useEffect, useMemo } from 'react';
import { Phase, PHASE_SHORT } from '@/lib/types';
import { useWorkflowStore } from '@/lib/workflow-store';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schemeId: string;
  phase: Phase;
  schemePreparer?: string;
}

const adhocTypes = [
  'Audit queries received',
  'Consultant accounts comments received',
  'Trustee comments received',
  'Other',
];

// Mapping of task type to default phase
const typeToPhase: Record<string, Phase> = {
  'Audit queries received': 'audit-process',
  'Consultant accounts comments received': 'audit-process',
  'Trustee comments received': 'audit-sign-off',
};

const phases: Phase[] = ['planning', 'peer-review', 'audit-process', 'audit-sign-off'];

export default function AdhocTaskDialog({ open, onOpenChange, schemeId, phase, schemePreparer }: Props) {
  const { addAdhocTask, schemes, teams } = useWorkflowStore();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskType, setTaskType] = useState(adhocTypes[0]);
  const [selectedPhase, setSelectedPhase] = useState<Phase>(phase);
  const [assignee, setAssignee] = useState('');

  // Get current scheme data for defaults
  const scheme = schemes.find(s => s.id === schemeId);

  // Find the team for this scheme based on preparer
  const schemeTeam = useMemo(() => {
    if (!scheme?.preparer) return null;
    return teams.find(team => 
      team.members.some(m => m.name === scheme.preparer) || team.teamLead === scheme.preparer
    );
  }, [scheme?.preparer, teams]);

  // Get team members (active only) plus team lead
  const teamAssignees = useMemo(() => {
    if (!schemeTeam) return [];
    const memberNames = schemeTeam.members
      .filter(m => m.isActive)
      .map(m => m.name);
    // Include team lead if not already in members
    if (!memberNames.includes(schemeTeam.teamLead)) {
      memberNames.unshift(schemeTeam.teamLead);
    }
    return memberNames;
  }, [schemeTeam]);

  // Update phase when task type changes
  useEffect(() => {
    if (taskType === 'Other') {
      // No default phase for "Other", keep current or reset
      setSelectedPhase(phase);
    } else {
      const defaultPhase = typeToPhase[taskType];
      if (defaultPhase) {
        setSelectedPhase(defaultPhase);
      }
    }
  }, [taskType, phase]);

  // Set default assignee to preparer when dialog opens
  useEffect(() => {
    if (open) {
      const defaultAssignee = schemePreparer || scheme?.preparer || (teamAssignees.length > 0 ? teamAssignees[0] : '');
      setAssignee(defaultAssignee);
      setTaskType(adhocTypes[0]);
      setSelectedPhase(typeToPhase[adhocTypes[0]] || phase);
      setTitle('');
      setDesc('');
      setDueDate('');
    }
  }, [open, schemePreparer, scheme?.preparer, phase, teamAssignees]);

  const handleSubmit = () => {
    const finalTitle = taskType === 'Other' ? title : taskType;
    if (!finalTitle.trim()) return;
    addAdhocTask(schemeId, {
      number: 99,
      phase: selectedPhase,
      title: taskType === 'Other' ? title : taskType,
      description: desc || finalTitle,
      type: 'standard',
      status: 'pending',
      assignedTo: [assignee || 'Preparer'],
      dueDate: dueDate,
      dueDateLabel: dueDate || 'No deadline',
      notes: [],
      isTeamLeadRequired: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Ad-hoc Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {adhocTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Phase</Label>
            <Select value={selectedPhase} onValueChange={(v) => setSelectedPhase(v as Phase)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {phases.map((p) => (
                  <SelectItem key={p} value={p}>{PHASE_SHORT[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {taskType !== 'Other' && typeToPhase[taskType] && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Auto-selected based on task type
              </p>
            )}
          </div>

          {taskType === 'Other' && (
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
            </div>
          )}

          <div>
            <Label className="text-xs flex items-center gap-1.5">
              <UserCircle className="h-3.5 w-3.5 text-primary" /> Assigned To
            </Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="Select assignee..." /></SelectTrigger>
              <SelectContent>
                {teamAssignees.map((name) => (
                  <SelectItem key={name} value={name}>
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-3.5 w-3.5 text-primary" /> {name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schemeTeam && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Team {schemeTeam.name} members
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details..." className="min-h-[80px]" />
          </div>
          <div>
            <Label className="text-xs">Deadline</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

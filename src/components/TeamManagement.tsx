import { useWorkflowStore } from '@/lib/workflow-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Shield, UserCircle, Eye, UserMinus, UserPlus, Crown, Plus, X } from 'lucide-react';
import { USER_ROLE_LABELS } from '@/lib/types';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TeamManagement() {
  const { teams, toggleTeamMemberActive, setTeamLead, addTeamMember, changeTeamMemberRole, currentUserRole } = useWorkflowStore();
  const [expandedTeam, setExpandedTeam] = useState<string | null>(teams[0]?.id || null);
  const [addMemberDialog, setAddMemberDialog] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'preparer' | 'peer-reviewer'>('preparer');

  const canEdit = currentUserRole === 'manager' || currentUserRole === 'admin';

  const handleAddMember = () => {
    if (!newName.trim() || !newEmail.trim() || !addMemberDialog) return;
    addTeamMember(addMemberDialog, { name: newName.trim(), email: newEmail.trim(), role: newRole });
    setNewName('');
    setNewEmail('');
    setNewRole('preparer');
    setAddMemberDialog(null);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Team Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {teams.length} teams · Manage team structures, members, and leads
          </p>
        </div>

        <div className="grid gap-4">
          {teams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const activeMembers = team.members.filter(m => m.isActive);
            const preparerCount = activeMembers.filter(m => m.role === 'preparer').length;
            const reviewerCount = activeMembers.filter(m => m.role === 'peer-reviewer').length;

            return (
              <div key={team.id} className="bg-card border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{team.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" /> {team.teamLead}
                        </span>
                        <span>{activeMembers.length} active members</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">{preparerCount} Preparers</Badge>
                    <Badge variant="outline" className="text-[10px]">{reviewerCount} Reviewers</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team Members</h4>
                      {canEdit && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddMemberDialog(team.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Member
                        </Button>
                      )}
                    </div>

                    {/* Team Lead */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className="h-4 w-4 text-primary" />
                        <div>
                          <span className="text-sm font-semibold">{team.teamLead}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/30">Team Lead</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-1.5">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${
                            member.isActive ? 'bg-muted/30' : 'bg-muted/10 opacity-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {member.role === 'preparer' ? (
                              <UserCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <Eye className="h-4 w-4 text-accent-foreground" />
                            )}
                            <div>
                              <span className="font-medium">{member.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{member.email}</span>
                            </div>
                            {canEdit ? (
                              <Select
                                value={member.role}
                                onValueChange={(val: 'preparer' | 'peer-reviewer') => changeTeamMemberRole(team.id, member.id, val)}
                              >
                                <SelectTrigger className="h-6 w-[110px] text-[10px] border-dashed">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="preparer" className="text-xs">Preparer</SelectItem>
                                  <SelectItem value="peer-reviewer" className="text-xs">Reviewer</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                {member.role === 'preparer' ? 'Preparer' : 'Reviewer'}
                              </Badge>
                            )}
                            {!member.isActive && (
                              <Badge variant="destructive" className="text-[10px]">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {canEdit && member.isActive && member.name !== team.teamLead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => setTeamLead(team.id, member.name)}
                                title="Make Team Lead"
                              >
                                <Crown className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => toggleTeamMemberActive(team.id, member.id)}
                            >
                              {member.isActive ? (
                                <><UserMinus className="h-3 w-3 mr-1" /> Deactivate</>
                              ) : (
                                <><UserPlus className="h-3 w-3 mr-1" /> Activate</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={!!addMemberDialog} onOpenChange={(open) => !open && setAddMemberDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Full Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Smith" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. john.smith@isio.com" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Role</label>
              <Select value={newRole} onValueChange={(v: 'preparer' | 'peer-reviewer') => setNewRole(v)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparer">Preparer</SelectItem>
                  <SelectItem value="peer-reviewer">Peer Reviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddMemberDialog(null)}>Cancel</Button>
              <Button size="sm" onClick={handleAddMember} disabled={!newName.trim() || !newEmail.trim()}>
                <Plus className="h-3 w-3 mr-1" /> Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

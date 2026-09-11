import { useState, useMemo } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { MasterScheme, SchemeContact, ContactType, CONTACT_TYPE_FIELDS, SchemeType, SchemeStatus, TrusteeDesignation, ActuaryGender } from '@/lib/types';
import { Plus, Search, Edit2, Trash2, ArrowLeft, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft as ChevLeft, ChevronsRight, Users, UserCheck, Building2, Stethoscope, UsersRound, ShieldCheck, Briefcase, FileSearch, TrendingUp, Landmark, Shield, LineChart, Scale, Building, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const CONTACT_TYPES: ContactType[] = [
  'Trustee', 'Secretary to the trustee', 'Principal Employer', 'Scheme Actuary',
  'Actuarial Team', 'Administrator', 'Client Team/Consultant', 'Auditor',
  'Investment Managers', 'AVC providers', 'Insurance companies', 'Investment Advisors',
  'Legal Advisers', 'Banks',
];

const CONTACT_TYPE_ICONS: Record<ContactType, LucideIcon> = {
  'Trustee': Users,
  'Secretary to the trustee': UserCheck,
  'Principal Employer': Building2,
  'Scheme Actuary': Stethoscope,
  'Actuarial Team': UsersRound,
  'Administrator': ShieldCheck,
  'Client Team/Consultant': Briefcase,
  'Auditor': FileSearch,
  'Investment Managers': TrendingUp,
  'AVC providers': Landmark,
  'Insurance companies': Shield,
  'Investment Advisors': LineChart,
  'Legal Advisers': Scale,
  'Banks': Building,
};

const clientOptions = ['AAA Group Limited', 'BBB Holdings', 'CCC Corporation', 'DDD Enterprises', 'EEE Partners'];

type SortKey = 'schemeName' | 'registrationNumber' | 'schemeType' | 'yearEndDate' | 'clientName' | 'status' | 'contacts';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function SchemeManagement() {
  const { masterSchemes, addMasterScheme, updateMasterScheme } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<MasterScheme | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Partial<MasterScheme>>({});
  const [selectedContactType, setSelectedContactType] = useState<ContactType | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<SchemeContact>>({});

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('schemeName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterYearEnd, setFilterYearEnd] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const yearEndOptions = useMemo(() => {
    const set = new Set(masterSchemes.map(s => s.yearEndDate));
    return Array.from(set).sort();
  }, [masterSchemes]);

  const filtered = useMemo(() => {
    let result = masterSchemes.filter((s) =>
      s.schemeName.toLowerCase().includes(search.toLowerCase()) ||
      s.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.clientName.toLowerCase().includes(search.toLowerCase())
    );
    if (filterType !== 'all') result = result.filter(s => s.schemeType === filterType);
    if (filterStatus !== 'all') result = result.filter(s => s.status === filterStatus);
    if (filterYearEnd !== 'all') result = result.filter(s => s.yearEndDate === filterYearEnd);
    return result;
  }, [masterSchemes, search, filterType, filterStatus, filterYearEnd]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortKey === 'contacts') {
        aVal = a.contacts.length;
        bVal = b.contacts.length;
      } else {
        aVal = (a[sortKey] || '').toLowerCase();
        bVal = (b[sortKey] || '').toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-primary" /> : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const toggleContactType = (ct: ContactType) => {
    setSelectedContactType(prev => prev === ct ? null : ct);
  };

  const handleSaveScheme = () => {
    if (editingScheme.id) {
      updateMasterScheme(editingScheme.id, editingScheme);
    } else {
      const newScheme: MasterScheme = {
        id: `master-${Date.now()}`,
        schemeName: editingScheme.schemeName || '',
        registrationNumber: editingScheme.registrationNumber || '',
        schemeType: (editingScheme.schemeType as SchemeType) || 'Defined Benefit',
        yearEndDate: editingScheme.yearEndDate || '',
        abbreviation: editingScheme.abbreviation || '',
        clientName: editingScheme.clientName || '',
        status: (editingScheme.status as SchemeStatus) || 'Active',
        contacts: [],
      };
      addMasterScheme(newScheme);
    }
    setShowAddDialog(false);
    setEditingScheme({});
  };

  const handleSaveContact = () => {
    if (!selectedScheme) return;
    const contacts = [...selectedScheme.contacts];
    if (editingContact.id) {
      const idx = contacts.findIndex((c) => c.id === editingContact.id);
      if (idx >= 0) contacts[idx] = { ...contacts[idx], ...editingContact } as SchemeContact;
    } else {
      contacts.push({
        ...editingContact,
        id: `c-${Date.now()}`,
      } as SchemeContact);
    }
    updateMasterScheme(selectedScheme.id, { contacts });
    setSelectedScheme({ ...selectedScheme, contacts });
    setShowContactDialog(false);
    setEditingContact({});
  };

  const handleDeleteContact = (contactId: string) => {
    if (!selectedScheme) return;
    const contacts = selectedScheme.contacts.filter((c) => c.id !== contactId);
    updateMasterScheme(selectedScheme.id, { contacts });
    setSelectedScheme({ ...selectedScheme, contacts });
  };

  // Scheme list view
  if (!selectedScheme) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Scheme Master List</h1>
              <p className="text-xs text-muted-foreground">{masterSchemes.length} schemes configured</p>
            </div>
            <Button size="sm" onClick={() => { setEditingScheme({}); setShowAddDialog(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Scheme
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Search + Filters row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, reg no, or client..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Defined Benefit">Defined Benefit</SelectItem>
                <SelectItem value="Defined Contribution">Defined Contribution</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="De-activated">De-activated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterYearEnd} onValueChange={(v) => { setFilterYearEnd(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="All Year Ends" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Year Ends</SelectItem>
                {yearEndOptions.map(ye => <SelectItem key={ye} value={ye}>{ye}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
            <span>Showing {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length} schemes{sorted.length !== masterSchemes.length ? ` (filtered from ${masterSchemes.length})` : ''}</span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[65px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 border-b">
                  {([
                    { key: 'schemeName' as SortKey, label: 'Scheme Name', align: 'left' },
                    { key: 'registrationNumber' as SortKey, label: 'Reg No.', align: 'left' },
                    { key: 'schemeType' as SortKey, label: 'Type', align: 'left' },
                    { key: 'yearEndDate' as SortKey, label: 'Year End', align: 'left' },
                    { key: 'clientName' as SortKey, label: 'Client', align: 'left' },
                    { key: 'status' as SortKey, label: 'Status', align: 'left' },
                    { key: 'contacts' as SortKey, label: 'Contacts', align: 'center' },
                  ]).map(col => (
                    <th
                      key={col.key}
                      className={`text-${col.align} px-3 py-2 font-semibold text-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none`}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon col={col.key} />
                      </span>
                    </th>
                  ))}
                  <th className="text-right px-3 py-2 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-foreground">{s.schemeName}</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono">{s.registrationNumber}</td>
                    <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{s.schemeType}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{s.yearEndDate}</td>
                    <td className="px-3 py-2 text-muted-foreground">{s.clientName}</td>
                    <td className="px-3 py-2">
                      <Badge variant={s.status === 'Active' ? 'default' : 'secondary'} className="text-[10px]">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setSelectedScheme(s)}>
                        {s.contacts.length} contacts
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEditingScheme(s); setShowAddDialog(true); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage <= 1} onClick={() => setCurrentPage(1)}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let page: number;
                if (totalPages <= 5) {
                  page = idx + 1;
                } else if (safePage <= 3) {
                  page = idx + 1;
                } else if (safePage >= totalPages - 2) {
                  page = totalPages - 4 + idx;
                } else {
                  page = safePage - 2 + idx;
                }
                return (
                  <Button
                    key={page}
                    variant={page === safePage ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Add/Edit Scheme Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{editingScheme.id ? 'Edit Scheme' : 'Add New Scheme'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="col-span-2">
                <Label className="text-xs">Scheme Name</Label>
                <Input className="mt-1 text-sm" value={editingScheme.schemeName || ''} onChange={(e) => setEditingScheme({ ...editingScheme, schemeName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Registration Number</Label>
                <Input className="mt-1 text-sm" value={editingScheme.registrationNumber || ''} onChange={(e) => setEditingScheme({ ...editingScheme, registrationNumber: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={editingScheme.schemeType || 'Defined Benefit'} onValueChange={(v) => setEditingScheme({ ...editingScheme, schemeType: v as SchemeType })}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Defined Benefit">Defined Benefit</SelectItem>
                    <SelectItem value="Defined Contribution">Defined Contribution</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year End Date</Label>
                <Input type="date" className="mt-1 text-sm" value={editingScheme.yearEndDate || ''} onChange={(e) => setEditingScheme({ ...editingScheme, yearEndDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Abbreviation</Label>
                <Input className="mt-1 text-sm" value={editingScheme.abbreviation || ''} onChange={(e) => setEditingScheme({ ...editingScheme, abbreviation: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Client Name</Label>
                <Select value={editingScheme.clientName || clientOptions[0]} onValueChange={(v) => setEditingScheme({ ...editingScheme, clientName: v })}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clientOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={editingScheme.status || 'Active'} onValueChange={(v) => setEditingScheme({ ...editingScheme, status: v as SchemeStatus })}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="De-activated">De-activated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveScheme}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Scheme detail / contacts view
  const contactsByType = CONTACT_TYPES.map((ct) => ({
    type: ct,
    contacts: selectedScheme.contacts.filter((c) => c.contactType === ct),
  }));

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedScheme(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{selectedScheme.schemeName}</h1>
            <p className="text-xs text-muted-foreground">
              {selectedScheme.registrationNumber} · {selectedScheme.schemeType} · Year end: {selectedScheme.yearEndDate}
            </p>
          </div>
          <Badge variant={selectedScheme.status === 'Active' ? 'default' : 'secondary'}>
            {selectedScheme.status}
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Contacts</h2>
          <Button size="sm" onClick={() => { setEditingContact({}); setShowContactDialog(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Contact
          </Button>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {contactsByType.map(({ type, contacts }) => {
            const Icon = CONTACT_TYPE_ICONS[type];
            const isSelected = selectedContactType === type;
            const isEmpty = contacts.length === 0;
            return (
              <button
                key={type}
                onClick={() => toggleContactType(type)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                  isSelected
                    ? 'ring-2 ring-primary bg-primary/5 border-primary/30'
                    : isEmpty
                    ? 'border-dashed border-muted-foreground/30 opacity-60 hover:opacity-80'
                    : 'hover:bg-muted/40'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{type}</p>
                  <p className={`text-[10px] ${contacts.length > 0 ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                    {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
                  </p>
                </div>
                {isSelected && <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Expanded Detail Panel */}
        {selectedContactType && (() => {
          const selectedContacts = selectedScheme.contacts.filter(c => c.contactType === selectedContactType);
          return (
            <div className="mt-4 border rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = CONTACT_TYPE_ICONS[selectedContactType]; return <Icon className="h-4 w-4 text-primary" />; })()}
                  <h3 className="text-sm font-semibold text-foreground">{selectedContactType}</h3>
                  <Badge variant="outline" className="text-[10px]">{selectedContacts.length}</Badge>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingContact({ contactType: selectedContactType }); setShowContactDialog(true); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add {selectedContactType}
                </Button>
              </div>
              <div className="p-3">
                {selectedContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">No {selectedContactType.toLowerCase()} contacts yet</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => { setEditingContact({ contactType: selectedContactType }); setShowContactDialog(true); }}>
                      <Plus className="h-3 w-3 mr-1" /> Add first {selectedContactType.toLowerCase()}
                    </Button>
                  </div>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b">
                        {CONTACT_TYPE_FIELDS[selectedContactType].map((f) => (
                          <th key={f} className="text-left px-2 py-1.5 font-semibold text-foreground capitalize">
                            {f.replace(/([A-Z])/g, ' $1').trim()}
                          </th>
                        ))}
                        <th className="text-right px-2 py-1.5 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedContacts.map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                          {CONTACT_TYPE_FIELDS[selectedContactType].map((f) => (
                            <td key={f} className="px-2 py-1.5 text-muted-foreground">
                              {(c as any)[f] || '—'}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-right">
                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 mr-1" onClick={() => { setEditingContact(c); setShowContactDialog(true); }}>
                              <Edit2 className="h-2.5 w-2.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive" onClick={() => handleDeleteContact(c.id)}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{editingContact.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <Label className="text-xs">Contact Type</Label>
              <Select value={editingContact.contactType || ''} onValueChange={(v) => setEditingContact({ ...editingContact, contactType: v as ContactType })}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((ct) => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editingContact.contactType && CONTACT_TYPE_FIELDS[editingContact.contactType as ContactType]?.map((field) => (
              <div key={field}>
                <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                {field === 'designation' ? (
                  <Select value={(editingContact as any)[field] || ''} onValueChange={(v) => setEditingContact({ ...editingContact, [field]: v } as any)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MNT">MNT (Member-nominated)</SelectItem>
                      <SelectItem value="CAT">CAT (Company-appointed)</SelectItem>
                      <SelectItem value="Corporate Independent">Corporate Independent</SelectItem>
                    </SelectContent>
                  </Select>
                ) : field === 'gender' ? (
                  <Select value={(editingContact as any)[field] || ''} onValueChange={(v) => setEditingContact({ ...editingContact, [field]: v } as any)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : field === 'status' ? (
                  <Select value={(editingContact as any)[field] || ''} onValueChange={(v) => setEditingContact({ ...editingContact, [field]: v })}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retired">Retired</SelectItem>
                      <SelectItem value="Ceased">Ceased</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Resigned">Resigned</SelectItem>
                    </SelectContent>
                  </Select>
                ) : field.includes('Date') || field.includes('date') ? (
                  <Input type="date" className="mt-1 text-sm" value={(editingContact as any)[field] || ''} onChange={(e) => setEditingContact({ ...editingContact, [field]: e.target.value })} />
                ) : (
                  <Input className="mt-1 text-sm" value={(editingContact as any)[field] || ''} onChange={(e) => setEditingContact({ ...editingContact, [field]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveContact}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

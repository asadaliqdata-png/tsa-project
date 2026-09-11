import { useState, useRef, useMemo, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/workflow-store';
import { DraftAccountingReportData } from '@/lib/types';
import { QUESTIONNAIRE_QUESTIONS, QuestionDefinition, DocumentUpload } from '@/lib/types';
import { ArrowLeft, FileText, FileSpreadsheet, Upload, Download, CheckCircle2, Loader2, Trash2, Plus, Clock, MessageSquare, AlertTriangle, FileUp, X, FileType, File, Brain, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface DraftAccountingReportProps {
  schemeId: string;
  onBack: () => void;
  inline?: boolean;
}

function QuestionInput({ question, answered, value, subValues, onAnswer }: {
  question: QuestionDefinition;
  answered: boolean;
  value: string;
  subValues?: Record<string, string>;
  onAnswer: (value: string, subValues?: Record<string, string>) => void;
}) {
  const [localSubValues, setLocalSubValues] = useState<Record<string, string>>(subValues || {});

  const handleSubChange = (id: string, val: string) => {
    const updated = { ...localSubValues, [id]: val };
    setLocalSubValues(updated);
    onAnswer(value, updated);
  };

  if (question.type === 'select') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
        <Select value={value} onValueChange={(v) => onAnswer(v)}>
          <SelectTrigger className="w-full max-w-md text-sm">
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (question.type === 'yes-no') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={value === 'Yes'} onCheckedChange={() => onAnswer('Yes')} /> Yes
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={value === 'No'} onCheckedChange={() => onAnswer('No')} /> No
          </label>
        </div>
        {question.subQuestions && value === 'Yes' && (
          <div className="ml-4 mt-3 space-y-3 border-l-2 border-primary/20 pl-4">
            {question.subQuestions.map((sq) => (
              <div key={sq.id}>
                <label className="text-xs font-medium">{sq.id} {sq.label}</label>
                {sq.type === 'text' ? (
                  <Textarea className="mt-1 text-xs min-h-[60px]" placeholder="Enter details..." value={localSubValues[sq.id] || ''} onChange={(e) => handleSubChange(sq.id, e.target.value)} />
                ) : sq.type === 'yes-no' ? (
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-2 text-xs"><Checkbox checked={localSubValues[sq.id] === 'Yes'} onCheckedChange={() => handleSubChange(sq.id, 'Yes')} /> Yes</label>
                    <label className="flex items-center gap-2 text-xs"><Checkbox checked={localSubValues[sq.id] === 'No'} onCheckedChange={() => handleSubChange(sq.id, 'No')} /> No</label>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (question.type === 'date') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
        <Input type="date" className="w-48 text-sm" value={value} onChange={(e) => onAnswer(e.target.value)} />
      </div>
    );
  }

  if (question.type === 'multi-select') {
    const selected = value ? value.split(',').filter(Boolean) : [];
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
        <div className="flex flex-wrap gap-3">
          {question.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  const next = checked ? [...selected, opt] : selected.filter((s) => s !== opt);
                  onAnswer(next.join(','));
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">{question.description}</p>
      <Textarea className="text-sm min-h-[60px] max-w-lg" placeholder="Enter your answer..." value={value} onChange={(e) => onAnswer(e.target.value)} />
    </div>
  );
}

export default function DraftAccountingReport({ schemeId, onBack, inline }: DraftAccountingReportProps) {
  const { schemes, masterSchemes, updateDraftAccountingReport, answerQuestion, clearAnswer, startGenerateAccounts, completeGenerateAccounts, addInvestmentManagerReport, removeInvestmentManagerReport, updateGenerationNotes, uploadDraftVersion, dismissFormatWarning } = useWorkflowStore();
  const scheme = schemes.find((s) => s.id === schemeId);
  const [showGenerating, setShowGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [showExtraction, setShowExtraction] = useState(false);
  const [extractionDocName, setExtractionDocName] = useState('');
  const [animatingFields, setAnimatingFields] = useState<Set<string>>(new Set());
  const [recentlyCompletedFields, setRecentlyCompletedFields] = useState<Set<string>>(new Set());
  
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [clientQuestionnaireUploaded, setClientQuestionnaireUploaded] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  if (!scheme) return null;

  // Find the master scheme to determine scheme type for conditional documents
  const masterScheme = masterSchemes.find(ms => ms.schemeName === scheme.name);
  const schemeType = masterScheme?.schemeType || 'Defined Benefit';
  const isDCorHybridDC = schemeType === 'Defined Contribution' || schemeType === 'Hybrid';
  const isDBorHybridDB = schemeType === 'Defined Benefit' || schemeType === 'Hybrid';

  const dar = scheme.draftAccountingReport;
  const answeredCount = dar.questionnaireAnswers.filter((a) => a.answered).length;
  const totalQuestions = QUESTIONNAIRE_QUESTIONS.length;
  const allAnswered = answeredCount === totalQuestions;
  const allDocsUploaded = dar.prevYearReportUploaded && dar.workingPaperUploaded;
  const canGenerate = allAnswered && allDocsUploaded;

  const pendingItems: string[] = [];
  if (!dar.prevYearReportUploaded) pendingItems.push('Previous year annual report not uploaded');
  if (!dar.workingPaperUploaded) pendingItems.push('Working paper not uploaded');
  if (!allAnswered) pendingItems.push(`${totalQuestions - answeredCount} questions pending`);

  const triggerExtraction = (docName: string, fieldKey: string, commitFn: () => void) => {
    setExtractionDocName(docName);
    setShowExtraction(true);
    setAnimatingFields(prev => new Set(prev).add(fieldKey));
    
    // After 4s popup disappears, commit the upload and trigger checkmark animation
    setTimeout(() => {
      setShowExtraction(false);
      commitFn();
      // Mark field as recently completed for checkmark draw animation
      setRecentlyCompletedFields(prev => new Set(prev).add(fieldKey));
      // Remove from animating
      setAnimatingFields(prev => { const n = new Set(prev); n.delete(fieldKey); return n; });
      // Clear the recently-completed flag after the animation plays (1s)
      setTimeout(() => {
        setRecentlyCompletedFields(prev => { const n = new Set(prev); n.delete(fieldKey); return n; });
      }, 1200);
    }, 4000);
  };

  const handleDocUpload = (field: keyof typeof dar, fileName: string) => {
    triggerExtraction(fileName, field as string, () => {
      updateDraftAccountingReport(schemeId, {
        [field]: { uploaded: true, fileName, uploadedAt: new Date().toISOString() } as DocumentUpload,
      });
    });
  };

  const handleDocDelete = (field: string, isSpecial?: 'prevYear' | 'workingPaper') => {
    if (isSpecial === 'prevYear') {
      updateDraftAccountingReport(schemeId, { prevYearReportUploaded: false, prevYearReportName: undefined });
    } else if (isSpecial === 'workingPaper') {
      updateDraftAccountingReport(schemeId, { workingPaperUploaded: false, workingPaperName: undefined });
    } else {
      updateDraftAccountingReport(schemeId, {
        [field]: { uploaded: false, fileName: undefined, uploadedAt: undefined } as any,
      });
    }
  };

  const handleFileUpload = (type: 'prevYear' | 'workingPaper') => {
    const name = type === 'prevYear' ? 'Annual_Report_2024.pdf' : 'Working_Papers_2024.xlsx';
    const fieldKey = type === 'prevYear' ? '_prevYear' : '_workingPaper';
    triggerExtraction(name, fieldKey, () => {
      if (type === 'prevYear') {
        updateDraftAccountingReport(schemeId, { prevYearReportUploaded: true, prevYearReportName: name });
      } else {
        updateDraftAccountingReport(schemeId, { workingPaperUploaded: true, workingPaperName: name });
      }
    });
  };




  const handleGenerate = () => {
    setShowGenerating(true);
    startGenerateAccounts(schemeId);
    setTimeout(() => setShowGenerating(false), 1000);
    setTimeout(() => completeGenerateAccounts(schemeId), 5000);
  };

  const handleDownload = (fileName?: string) => {
    const blob = new Blob(['This is a placeholder for the generated annual report.'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || dar.generatedFileName || 'Annual_Report.docx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Upload Documents
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Questionnaire
              {!allAnswered && <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1">{totalQuestions - answeredCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="generate" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Generate Accounts
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Upload Documents */}
          <TabsContent value="upload" className="space-y-4">
            {(() => {
              // Define all document slots
              const documents: { title: string; fileType: 'pdf' | 'excel' | 'word'; doc: DocumentUpload | null; field: string; conditional?: boolean; conditionLabel?: string; disabledMessage?: string; show: boolean; isSpecial?: 'prevYear' | 'workingPaper'; disabled?: boolean }[] = [
                { title: 'Previous Year Annual Report', fileType: 'pdf', doc: { uploaded: dar.prevYearReportUploaded, fileName: dar.prevYearReportName }, field: '_prevYear', show: true, isSpecial: 'prevYear' },
                { title: 'Working Paper', fileType: 'excel', doc: { uploaded: dar.workingPaperUploaded, fileName: dar.workingPaperName }, field: '_workingPaper', show: true, isSpecial: 'workingPaper' },
                { title: 'Implementation Statement', fileType: 'pdf', doc: dar.implementationStatement, field: 'implementationStatement', show: true },
                { title: "Chair's Statement / DC Governance", fileType: 'pdf', doc: dar.chairsStatement, field: 'chairsStatement', conditional: true, conditionLabel: 'DC / Hybrid', show: true, disabled: !isDCorHybridDC, disabledMessage: 'Only for DC schemes or Hybrid with DC membership' },
                { title: 'Report on Actuarial Liabilities', fileType: 'pdf', doc: dar.reportOnActuarialLiabilities, field: 'reportOnActuarialLiabilities', conditional: true, conditionLabel: 'DB / Hybrid', show: true, disabled: !isDBorHybridDB, disabledMessage: 'Only for DB schemes or Hybrid with DB membership' },
                { title: 'Investment Report', fileType: 'pdf', doc: dar.investmentReport, field: 'investmentReport', show: true },
                { title: 'Pension Increases', fileType: 'excel', doc: dar.pensionIncreases, field: 'pensionIncreases', show: true },
                { title: 'Audit Report', fileType: 'word', doc: dar.auditReport, field: 'auditReport', show: true },
                { title: "Auditor's Statement", fileType: 'word', doc: dar.auditorsStatement, field: 'auditorsStatement', show: true },
                { title: 'Investment Risk Disclosure', fileType: 'pdf', doc: dar.investmentRiskDisclosure, field: 'investmentRiskDisclosure', show: true },
                { title: 'Schedule of Contribution', fileType: 'pdf', doc: dar.scheduleOfContribution, field: 'scheduleOfContribution', show: true },
                { title: 'Certification of Schedule', fileType: 'pdf', doc: dar.certificationOfSchedule, field: 'certificationOfSchedule', show: true },
              ];

              const visibleDocs = documents.filter(d => d.show);
              const applicableDocs = visibleDocs.filter(d => !d.disabled);
              const uploadedCount = applicableDocs.filter(d => d.doc?.uploaded).length;
              const applicableCount = applicableDocs.length;

              const getIcon = (fileType: string, uploaded: boolean, size: string = 'h-4 w-4') => {
                if (!uploaded) {
                  if (fileType === 'pdf') return <FileText className={`${size} text-muted-foreground/40`} />;
                  if (fileType === 'excel') return <FileSpreadsheet className={`${size} text-muted-foreground/40`} />;
                  return <FileType className={`${size} text-muted-foreground/40`} />;
                }
                if (fileType === 'pdf') return <FileText className={`${size} text-destructive`} />;
                if (fileType === 'excel') return <FileSpreadsheet className={`${size} text-task-complete`} />;
                return <FileType className={`${size} text-primary`} />;
              };

              return (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Documents</h3>
                    <Badge variant={uploadedCount === applicableCount ? 'default' : 'outline'} className="text-[10px]">
                      {uploadedCount}/{applicableCount} uploaded
                    </Badge>
                  </div>

                  {(() => {
                    const priorDocs = visibleDocs.filter(d => d.isSpecial);
                    const otherDocs = visibleDocs.filter(d => !d.isSpecial);

                    const renderDocRow = (d: typeof visibleDocs[0]) => {
                      const isUploaded = d.doc?.uploaded;
                      const hasWarning = d.doc && 'formatWarning' in d.doc && d.doc.formatWarning;
                      const isDisabled = d.disabled;
                      const isProcessing = animatingFields.has(d.field);
                      const justCompleted = recentlyCompletedFields.has(d.field);
                      
                      return (
                        <div
                          key={d.field}
                          className={`flex items-center gap-2.5 px-3 py-2 border-b md:odd:border-r transition-colors duration-700 ${
                            isDisabled ? 'bg-muted/20 opacity-60' :
                            isProcessing ? 'bg-primary/5 border-l-2 border-l-primary/40' :
                            justCompleted ? 'bg-task-complete/10 animate-fade-in' :
                            isUploaded ? 'bg-task-complete/5' : 'bg-muted/30 border-l-2 border-l-amber-400/60'
                          }`}
                        >
                          {/* Status icon */}
                          {isDisabled ? (
                            <div className="h-4 w-4 rounded-full border-2 border-dashed border-muted-foreground/25 shrink-0" />
                          ) : isProcessing ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                          ) : justCompleted ? (
                            <svg className="h-5 w-5 shrink-0 checkmark-animated" viewBox="0 0 24 24" fill="none">
                              <circle className="checkmark-circle" cx="12" cy="12" r="10" stroke="hsl(var(--task-complete))" strokeWidth="2" />
                              <path className="checkmark-check" d="M8 12.5l2.5 2.5 5.5-5.5" stroke="hsl(var(--task-complete))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isUploaded ? (
                            <CheckCircle2 className="h-4 w-4 text-task-complete shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500/70 shrink-0" />
                          )}

                          {/* File type icon */}
                          {getIcon(d.fileType, !!isUploaded && !isDisabled)}

                          {/* Title + filename */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-medium truncate ${isDisabled || !isUploaded ? 'text-muted-foreground' : ''}`}>{d.title}</span>
                              {d.conditional && d.conditionLabel && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0">{d.conditionLabel}</Badge>
                              )}
                              {hasWarning && (
                                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {isUploaded && d.doc?.fileName && (
                              <span className="text-[10px] text-muted-foreground truncate block">{d.doc.fileName}</span>
                            )}
                            {isDisabled && d.disabledMessage && (
                              <span className="text-[10px] text-muted-foreground/50 truncate block">{d.disabledMessage}</span>
                            )}
                          </div>

                          {/* Action buttons */}
                          {!isDisabled && !isProcessing && (
                            <div className="flex items-center gap-0.5 shrink-0">
                              {isUploaded ? (
                                <>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Download">
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm" variant="ghost" className="h-7 px-2 text-[10px]"
                                    onClick={() => d.isSpecial ? handleFileUpload(d.isSpecial) : handleDocUpload(d.field as keyof typeof dar, d.doc?.fileName || '')}
                                  >
                                    <Upload className="h-3 w-3 mr-1" /> Replace
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Delete" onClick={() => handleDocDelete(d.field, d.isSpecial)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <div className="h-7 w-7" />
                                  <Button
                                    size="sm" variant="outline" className="h-7 px-2.5 text-[10px]"
                                    onClick={() => d.isSpecial ? handleFileUpload(d.isSpecial) : handleDocUpload(d.field as keyof typeof dar, `${d.title.replace(/[\s\/()]+/g, '_')}.${d.fileType === 'pdf' ? 'pdf' : d.fileType === 'excel' ? 'xlsx' : 'docx'}`)}
                                  >
                                    <Upload className="h-3 w-3 mr-1" /> Upload
                                  </Button>
                                  <div className="h-7 w-7" />
                                </>
                              )}
                            </div>
                          )}

                          {isDisabled && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 text-muted-foreground/60">N/A</Badge>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* Prior Year docs */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-2">
                            {priorDocs.map(renderDocRow)}
                          </div>
                        </div>

                        {/* Separator gap */}
                        <div className="h-1" />

                        {/* Remaining documents */}
                        <div className="border rounded-lg overflow-hidden">
                          <div className="px-3 py-1.5 bg-muted/40 border-b">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Report Components</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2">
                            {otherDocs.map(renderDocRow)}
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Investment Performance (IM Reports) */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                      <h4 className="text-xs font-semibold">Investment Performance (IM Reports)</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {dar.investmentManagerReports.length}/6 uploaded
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                    {['Mobius Life', 'Standard Life', 'Aegon Asset Management', 'Fidelity International', 'Aviva International', 'Legal & General'].map((provider) => {
                      const existing = dar.investmentManagerReports.find(r => r.name === provider);
                      const imFieldKey = `im-${provider}`;
                      const isProcessing = animatingFields.has(imFieldKey);
                      const justCompleted = recentlyCompletedFields.has(imFieldKey);
                      return (
                        <div key={provider} className={`flex items-center gap-2.5 px-3 py-2 border-b md:odd:border-r transition-colors duration-700 ${
                          isProcessing ? 'bg-primary/5 border-l-2 border-l-primary/40' :
                          justCompleted ? 'bg-task-complete/10 animate-fade-in' :
                          existing ? 'bg-task-complete/5' : 'bg-muted/30 border-l-2 border-l-amber-400/60'
                        }`}>
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                          ) : justCompleted ? (
                            <svg className="h-5 w-5 shrink-0 checkmark-animated" viewBox="0 0 24 24" fill="none">
                              <circle className="checkmark-circle" cx="12" cy="12" r="10" stroke="hsl(var(--task-complete))" strokeWidth="2" />
                              <path className="checkmark-check" d="M8 12.5l2.5 2.5 5.5-5.5" stroke="hsl(var(--task-complete))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : existing ? (
                            <CheckCircle2 className="h-4 w-4 text-task-complete shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500/70 shrink-0" />
                          )}
                          <FileText className={`h-4 w-4 ${existing ? 'text-destructive' : 'text-muted-foreground/40'} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-medium ${!existing ? 'text-muted-foreground' : ''}`}>{provider}</span>
                            {existing ? (
                              <p className="text-[10px] text-muted-foreground truncate">{existing.fileName}</p>
                            ) : (
                              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Pending upload</p>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-1 shrink-0 w-[140px]">
                            {existing ? (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Download">
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => {
                                  const fileName = `${provider.replace(/\s+/g, '_')}_Report.pdf`;
                                  removeInvestmentManagerReport(schemeId, existing.id);
                                  triggerExtraction(fileName, `im-${provider}`, () => {
                                    addInvestmentManagerReport(schemeId, { id: `im-${Date.now()}`, name: provider, fileName, uploadedAt: new Date().toISOString() });
                                  });
                                }}>
                                  <Upload className="h-3 w-3 mr-1" /> Replace
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeInvestmentManagerReport(schemeId, existing.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="h-7 w-7" />
                                <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px]" onClick={() => {
                                  const fileName = `${provider.replace(/\s+/g, '_')}_Report.pdf`;
                                  triggerExtraction(fileName, `im-${provider}`, () => {
                                    addInvestmentManagerReport(schemeId, { id: `im-${Date.now()}-${provider}`, name: provider, fileName, uploadedAt: new Date().toISOString() });
                                  });
                                }}>
                                  <Upload className="h-3 w-3 mr-1" /> Upload
                                </Button>
                                <div className="h-7 w-7" />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Tab 2: Questionnaire */}
          <TabsContent value="info">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold">Questionnaire – {answeredCount}/{totalQuestions} completed</h3>
                {clientQuestionnaireUploaded ? (
                  <div className="flex items-center gap-1.5 bg-muted/50 rounded px-2 py-1">
                    <FileText className="h-3 w-3 text-destructive" />
                    <span className="text-[10px] text-foreground font-medium">Client_Team_Questionnaire.pdf</span>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0 ml-0.5" onClick={() => {
                      triggerExtraction('Client_Team_Questionnaire.pdf', '_clientQuestionnaire', () => {
                        setClientQuestionnaireUploaded(true);
                      });
                    }}>
                      <Upload className="h-2.5 w-2.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 border border-dashed border-border rounded px-2 py-1">
                    <FileUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Client Team Questionnaire (.pdf)</span>
                    <Button size="sm" variant="outline" className="h-5 px-2 text-[9px] ml-1" onClick={() => {
                      triggerExtraction('Client_Team_Questionnaire.pdf', '_clientQuestionnaire', () => {
                        setClientQuestionnaireUploaded(true);
                      });
                    }}>
                      <Upload className="h-2.5 w-2.5 mr-0.5" /> Upload
                    </Button>
                  </div>
                )}
              </div>
              <Badge variant={allAnswered ? 'default' : 'outline'} className="text-[10px]">
                {totalQuestions - answeredCount} remaining
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
              {QUESTIONNAIRE_QUESTIONS.map((q) => {
                const answer = dar.questionnaireAnswers.find((a) => a.questionId === q.id);
                const isAnswered = answer?.answered ?? false;
                const answerValue = answer?.value || '';
                const isExpanded = expandedQuestion === q.id;

                return (
                  <div
                    key={q.id}
                    className={`border rounded-md overflow-hidden transition-colors cursor-pointer ${
                      isAnswered
                        ? 'border-task-complete/50 bg-task-complete/8'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      {isAnswered ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-task-complete shrink-0" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-[11px] font-medium flex-1 min-w-0 truncate">
                        {q.id}. {q.title}
                      </span>
                      {isAnswered && answerValue && (
                        <span className="text-[11px] font-bold text-task-complete shrink-0 max-w-[140px] truncate" title={answerValue}>
                          {answerValue}
                        </span>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-2.5 pt-1 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                        <QuestionInput
                          question={q}
                          answered={isAnswered}
                          value={answerValue}
                          subValues={answer?.subValues}
                          onAnswer={(val, subs) => answerQuestion(schemeId, q.id, val, subs)}
                        />
                        {!isAnswered ? (
                          <Button size="sm" className="mt-2 h-7 text-[11px]" onClick={() => answerQuestion(schemeId, q.id, answer?.value || '', answer?.subValues)}>
                            Mark as Answered
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 text-[11px] text-muted-foreground hover:text-destructive"
                            onClick={() => clearAnswer(schemeId, q.id)}
                          >
                            <X className="h-3 w-3 mr-1" /> Clear Answer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-6">
            {/* Hidden file input for upload */}
            <input
              ref={uploadRef}
              type="file"
              accept=".docx,.doc"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadDraftVersion(schemeId, file.name);
                  e.target.value = '';
                }
              }}
            />

            {/* Pending items */}
            {pendingItems.length > 0 && (
              <div className="bg-task-overdue/10 border border-task-overdue/30 rounded-xl p-4">
                <h4 className="text-xs font-semibold flex items-center gap-1.5 text-task-overdue mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Items Pending Before Generation
                </h4>
                <ul className="space-y-1">
                  {pendingItems.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-task-overdue" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generate / Upload actions */}
            <div className="border rounded-xl p-6 bg-card text-center">
              <h3 className="text-sm font-bold mb-2">Generate Accounts</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {canGenerate
                  ? 'All prerequisites complete. Ready to generate accounts.'
                  : 'Complete all documents and questions before generating.'}
              </p>

              {dar.accountsGenerationStatus === 'generated' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-1.5 text-sm text-task-complete">
                    <CheckCircle2 className="h-4 w-4" /> Accounts generated successfully
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button size="sm" variant="default" onClick={handleGenerate}>
                      Re-generate Accounts
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => uploadRef.current?.click()}>
                      <FileUp className="h-3.5 w-3.5 mr-1" /> Upload New Version
                    </Button>
                  </div>
                </div>
              ) : dar.accountsGenerationStatus === 'generating' ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Button size="default" variant="default" disabled={!canGenerate} onClick={handleGenerate}>
                    Generate Accounts
                  </Button>
                  <Button size="default" variant="outline" onClick={() => uploadRef.current?.click()}>
                    <FileUp className="h-3.5 w-3.5 mr-1" /> Upload Document
                  </Button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-xs font-semibold mb-2">Generation Notes</h4>
              <Textarea
                placeholder="Add notes about this generation (e.g. special instructions, known issues)..."
                value={dar.generationNotes}
                onChange={(e) => updateGenerationNotes(schemeId, e.target.value)}
                className="text-sm min-h-[80px]"
              />
            </div>

            {/* Draft History / Audit Trail */}
            <div className="border rounded-xl p-4 bg-card">
              <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Draft History
              </h4>
              {dar.generationHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No accounts generated or uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {[...dar.generationHistory].reverse().map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-[10px] ${attempt.actionType === 'uploaded' ? 'border-phase-peer-review/50 text-phase-peer-review' : ''}`}>
                          v{attempt.version}
                        </Badge>
                        <div className="shrink-0">
                          {attempt.actionType === 'uploaded' ? (
                            <FileUp className="h-4 w-4 text-phase-peer-review" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{attempt.fileName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {attempt.actionType === 'uploaded' ? 'Uploaded' : 'Generated'} by {attempt.actionBy || 'System'} · {format(parseISO(attempt.generatedAt), 'dd MMM yyyy HH:mm')}
                            {attempt.actionType === 'generated' && ` · ${attempt.questionsAnswered}/${attempt.totalQuestions} questions`}
                          </p>
                          {attempt.notes && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Note: {attempt.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDownload(attempt.fileName)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      {/* Generating popup */}
      <Dialog open={showGenerating} onOpenChange={setShowGenerating}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-base">Generating Accounts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Account generation is in progress...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Extraction popup */}
      <Dialog open={showExtraction} onOpenChange={setShowExtraction}>
        <DialogContent className="sm:max-w-sm text-center border-primary/20 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Intelligent Extraction
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-[spin_8s_linear_infinite]">
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40 animate-spin" />
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center animate-bounce [animation-duration:2s]">
                <Zap className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Extracting information...</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                Our AI is analysing <span className="font-medium text-foreground">{extractionDocName}</span> and intelligently extracting key data points
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-[220px] h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary extraction-progress" />
            </div>
            <div className="w-full max-w-[200px] space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-fade-in">
                <div className="h-1.5 w-1.5 rounded-full bg-task-complete animate-pulse" />
                Parsing document structure
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-fade-in [animation-delay:1.2s] opacity-0 [animation-fill-mode:forwards]">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Identifying key fields
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-fade-in [animation-delay:2.4s] opacity-0 [animation-fill-mode:forwards]">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Cross-referencing data
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

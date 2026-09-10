/**
 * Bulk CSV Worker Import Modal
 * Supports template download, CSV parsing, validation, and batch insertion
 */

import React, { useState } from 'react';
import { useBulkImportEmployees } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { Employee } from '../../types';
import { X, Upload, Download, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const { success, error } = useToast();
  const bulkImportMutation = useBulkImportEmployees();

  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<Employee>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const sampleTemplate = `name,designation,category,departmentId,shiftId,basicSalaryOrWage,joiningDate,accountNumber,bankName,ifsc,uan,pfNumber,esiNumber
Suresh More,Welder Grade A,contractual_worker,1,1,720,2026-03-01,98765432101,SBI,SBIN0001234,101992288331,MH/PUN/0012345/007,31000988776655111
Vijay Gaikwad,Maintenance Electrician,permanent_staff,3,1,32000,2026-02-15,11223344556,HDFC,HDFC0000123,101992288332,MH/PUN/0012345/008,31000988776655222`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Omech_Worker_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Import template downloaded');
  };

  const handleParse = (text: string) => {
    setCsvContent(text);
    const lines = text.trim().split('\n');
    if (lines.length <= 1) {
      setParsedRows([]);
      setParseErrors(['CSV contains no data rows']);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Partial<Employee>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map((v) => v.trim());

      if (values.length < 6) {
        errors.push(`Row ${i}: Missing required columns`);
        continue;
      }

      const rowObj: any = {
        name: values[0],
        designation: values[1],
        category: values[2] === 'permanent_staff' ? 'permanent_staff' : 'contractual_worker',
        departmentId: Number(values[3]) || 1,
        shiftId: Number(values[4]) || 1,
        basicSalaryOrWage: Number(values[5]) || 650,
        joiningDate: values[6] || '2026-01-01',
        isActive: true,
        bankDetails: {
          accountNumber: values[7] || '334455667788',
          bankName: values[8] || 'State Bank of India',
          ifsc: values[9] || 'SBIN0001234',
        },
        statutory: {
          uan: values[10] || '101299887766',
          pfNumber: values[11] || 'MH/PUN/0012345/000',
          esiNumber: values[12] || '31000988776655000',
        },
      };
      rows.push(rowObj);
    }

    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      error('No valid rows to import.');
      return;
    }

    try {
      const count = await bulkImportMutation.mutateAsync(parsedRows);
      success(`Successfully imported ${count} workers with generated sequence codes!`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Import failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Workforce Onboarding
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              Bulk CSV Worker Import
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          <div className="flex items-center justify-between bg-stone-950 p-3 border border-stone-800">
            <div>
              <div className="font-semibold text-stone-200">Step 1: Download Standard Template</div>
              <div className="text-stone-400 text-[11px]">Includes all factory headers and statutory fields.</div>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 font-mono text-[11px] uppercase font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div>
            <div className="font-semibold text-stone-200 mb-1.5">Step 2: Upload CSV File or Paste Raw Text</div>
            <label className="border-2 border-dashed border-stone-700 hover:border-amber-500/60 p-4 block text-center cursor-pointer bg-stone-950 transition">
              <Upload className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-stone-300 font-medium">Click to upload .csv file</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
              Or Paste CSV Data Directly:
            </label>
            <textarea
              rows={4}
              value={csvContent}
              onChange={(e) => handleParse(e.target.value)}
              placeholder={sampleTemplate}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-[11px]"
            />
          </div>

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-stone-300 font-semibold font-mono text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{parsedRows.length} Valid Worker Records Ready</span>
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto border border-stone-800 divide-y divide-stone-800 bg-stone-950">
                {parsedRows.map((r, i) => (
                  <div key={i} className="p-2 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-stone-200">{r.name}</span>
                      <span className="text-stone-500 font-mono ml-2">({r.designation})</span>
                    </div>
                    <span className="text-amber-400 font-mono uppercase">
                      {r.category === 'permanent_staff' ? 'Staff' : 'Contractor'} • ₹{r.basicSalaryOrWage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs space-y-1">
              <div className="flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Parsing Warnings:</span>
              </div>
              {parseErrors.map((err, i) => (
                <div key={i} className="text-[11px] font-mono">• {err}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs">
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={parsedRows.length === 0 || bulkImportMutation.isPending}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider disabled:opacity-50"
          >
            {bulkImportMutation.isPending ? 'Importing...' : `Import ${parsedRows.length} Workers`}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Trash2, 
  ArrowLeft,
  Info,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { useAppDispatch } from '../../../../store/hooks';
import { bulkAddProducts, AdminProduct } from '../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

interface BulkUploadTabProps {
  onSuccess: () => void;
}

interface ParsedRow {
  id: string;
  sku: string;
  title: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  stock: number;
  isValid: boolean;
  errors: string[];
}

export const BulkUploadTab: React.FC<BulkUploadTabProps> = ({ onSuccess }) => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadSample = () => {
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      "name,sku,category,price,original price,stock\n" +
      '"Wireless Touch Earbuds Pro","EB-PRO-BT5","Smart Life Gadgets",1499,2999,60\n' +
      '"Stainless Steel Thermal Flask 1L","FLASK-SS-1L","Home & Kitchen",799,1299,40\n' +
      '"Magnetic Car Phone Mount 360","MOUNT-MAG-360","Car Accessories",499,899,85\n' +
      '"Organic Cotton Baby Romper Set","ROM-BABY-SET","Baby Items",899,1499,30\n' +
      '"Ergonomic Lumbar Support Cushion","CUSH-LUMB-01","Home Improvement",999,1799,25';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "admin_products_sample_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample template downloaded');
  };

  const processCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      toast.error('CSV file must have a header row and data rows');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    const titleIdx = headers.findIndex(h => h === 'name' || h === 'title' || h === 'product name');
    const skuIdx = headers.findIndex(h => h === 'sku' || h === 'product code' || h === 'item code');
    const priceIdx = headers.findIndex(h => h === 'price' || h === 'currentprice' || h === 'selling price');
    const mrpIdx = headers.findIndex(h => h === 'mrp' || h === 'originalprice' || h === 'original price');
    const stockIdx = headers.findIndex(h => h === 'stock' || h === 'quantity' || h === 'qty');
    const categoryIdx = headers.findIndex(h => h === 'category' || h === 'cat');

    const missing: string[] = [];
    if (titleIdx === -1) missing.push('name/title');
    if (skuIdx === -1) missing.push('sku');
    if (priceIdx === -1) missing.push('price');
    if (stockIdx === -1) missing.push('stock');

    if (missing.length > 0) {
      toast.error(`Missing required headers: ${missing.join(', ')}`);
      return;
    }

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

      const title = values[titleIdx] || '';
      const sku = values[skuIdx] || `SKU-${Date.now().toString().slice(-4)}-${i}`;
      const price = parseFloat(values[priceIdx]) || 0;
      const originalPrice = mrpIdx !== -1 && values[mrpIdx] ? parseFloat(values[mrpIdx]) : (price > 0 ? Math.round(price * 1.3) : 0);
      const stock = stockIdx !== -1 && values[stockIdx] ? parseInt(values[stockIdx], 10) : 0;
      const category = categoryIdx !== -1 && values[categoryIdx] ? values[categoryIdx] : 'Smart Life Gadgets';

      const errors: string[] = [];
      if (!title) errors.push('Title missing');
      if (!sku) errors.push('SKU missing');
      if (isNaN(price) || price <= 0) errors.push('Invalid price');
      if (isNaN(stock) || stock < 0) errors.push('Invalid stock');

      rows.push({
        id: `row-${i}`,
        sku,
        title,
        category,
        currentPrice: price,
        originalPrice: originalPrice > price ? originalPrice : Math.round(price * 1.25),
        stock: isNaN(stock) ? 0 : stock,
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedRows(rows);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('Please upload a .csv or .json file');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (!Array.isArray(json)) {
            toast.error('JSON file must contain an array of products');
            return;
          }

          const rows: ParsedRow[] = json.map((item: any, idx: number) => {
            const title = item.title || item.name || '';
            const sku = item.sku || `SKU-${idx + 1}`;
            const price = Number(item.price || item.currentPrice || 0);
            const originalPrice = Number(item.originalPrice || item.mrp || Math.round(price * 1.25));
            const stock = Number(item.stock || item.qty || 0);
            const category = item.category || 'Smart Life Gadgets';

            const errors: string[] = [];
            if (!title) errors.push('Title missing');
            if (price <= 0) errors.push('Invalid price');
            if (stock < 0) errors.push('Invalid stock');

            return {
              id: `json-row-${idx + 1}`,
              sku,
              title,
              category,
              currentPrice: price,
              originalPrice,
              stock,
              isValid: errors.length === 0,
              errors
            };
          });

          setParsedRows(rows);
        } else {
          processCSVText(content);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const handleCommit = () => {
    const valid = parsedRows.filter(r => r.isValid);
    if (valid.length === 0) {
      toast.error('No valid rows to commit');
      return;
    }

    const payload: Partial<AdminProduct>[] = valid.map(row => ({
      sku: row.sku,
      title: row.title,
      category: row.category,
      currentPrice: row.currentPrice,
      originalPrice: row.originalPrice,
      stock: row.stock,
      status: 'Active',
      discountPercentage: Math.max(0, Math.round(((row.originalPrice - row.currentPrice) / row.originalPrice) * 100)),
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      tag: 'NEW IMPORT'
    }));

    dispatch(bulkAddProducts(payload));
    toast.success(`Successfully imported ${valid.length} products to local catalog!`);
    onSuccess();
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Back to All Products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Bulk CSV Catalog Importer
            </h1>
            <p className="text-xs text-slate-500">
              Upload spreadsheets, validate columns, and bulk-load items into local Redux store
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSample}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Download Sample CSV Template
        </button>
      </div>

      {/* Main Upload Box */}
      {parsedRows.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[300px] ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
            }`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, .json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-20 h-20 rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              Click to select or drag and drop your catalog CSV
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-6">
              File must include columns: <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">name</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">sku</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">price</span>, <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">stock</span>, and optionally <span className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">category</span>
            </p>

            <button
              type="button"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              Browse Files
            </button>
          </div>

          {/* Instruction info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-slate-800">100% Client-Side Processing</div>
              <div>Your files are parsed securely inside the browser using standard JavaScript FileReaders. No product data leaves your device or goes to an external backend server. Data is stored directly into your browser's LocalStorage under key <code className="bg-slate-200 px-1 rounded text-slate-900">admin_products_store</code>.</div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview Table & Commit Screen */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>{fileName}</span>
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-semibold text-slate-700">
                    {parsedRows.length} total rows
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs mt-1">
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} ready to import
                  </span>
                  {errorCount > 0 && (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errorCount} errors
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear & Change File
              </button>
              <button
                type="button"
                disabled={validCount === 0 || isProcessing}
                onClick={handleCommit}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Commit {validCount} Products to Store
              </button>
            </div>
          </div>

          {/* Rows table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold uppercase tracking-wider z-10">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`transition-colors ${
                      row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      {row.isValid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{row.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{row.title}</td>
                    <td className="py-3 px-4 text-slate-600">{row.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">₹{row.currentPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-400">₹{row.originalPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">{row.stock}</td>
                    <td className="py-3 px-4 text-rose-600">
                      {row.errors.length > 0 ? row.errors.join(', ') : 'OK'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

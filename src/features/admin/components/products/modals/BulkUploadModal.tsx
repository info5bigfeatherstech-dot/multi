import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Download,
  Info
} from 'lucide-react';
import { useAppDispatch } from '../../../../../store/hooks';
import { bulkAddProducts, AdminProduct } from '../../../../../store/adminProductsSlice';
import toast from 'react-hot-toast';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  stock: number;
  status: 'Active' | 'Draft';
  isValid: boolean;
  validationErrors: string[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Body scroll lock & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside to dismiss
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const resetUpload = () => {
    setFileName(null);
    setParsedItems([]);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to parse CSV text
  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      toast.error('CSV file must have a header row and at least 1 data row');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Find column indexes
    const titleIdx = headers.findIndex(h => h === 'name' || h === 'title' || h === 'product name');
    const skuIdx = headers.findIndex(h => h === 'sku' || h === 'product code' || h === 'item code');
    const priceIdx = headers.findIndex(h => h === 'price' || h === 'currentprice' || h === 'selling price');
    const mrpIdx = headers.findIndex(h => h === 'mrp' || h === 'originalprice' || h === 'original price');
    const stockIdx = headers.findIndex(h => h === 'stock' || h === 'quantity' || h === 'qty');
    const categoryIdx = headers.findIndex(h => h === 'category' || h === 'cat');

    const missingRequired: string[] = [];
    if (titleIdx === -1) missingRequired.push('name/title');
    if (skuIdx === -1) missingRequired.push('sku');
    if (priceIdx === -1) missingRequired.push('price');
    if (stockIdx === -1) missingRequired.push('stock');

    if (missingRequired.length > 0) {
      toast.error(`Missing required columns: ${missingRequired.join(', ')}`);
      return;
    }

    const items: ParsedItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex for splitting commas ignoring quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

      const title = values[titleIdx] || '';
      const sku = values[skuIdx] || `SKU-${Date.now().toString().slice(-4)}-${i}`;
      const price = parseFloat(values[priceIdx]) || 0;
      const originalPrice = mrpIdx !== -1 && values[mrpIdx] ? parseFloat(values[mrpIdx]) : (price > 0 ? Math.round(price * 1.3) : 0);
      const stock = stockIdx !== -1 && values[stockIdx] ? parseInt(values[stockIdx], 10) : 0;
      const category = categoryIdx !== -1 && values[categoryIdx] ? values[categoryIdx] : 'Smart Life Gadgets';

      const validationErrors: string[] = [];
      if (!title) validationErrors.push('Product name is required');
      if (!sku) validationErrors.push('SKU is required');
      if (isNaN(price) || price <= 0) validationErrors.push('Valid price is required');
      if (isNaN(stock) || stock < 0) validationErrors.push('Valid non-negative stock required');

      items.push({
        id: `bulk-${Date.now()}-${i}`,
        sku,
        title,
        category,
        currentPrice: price,
        originalPrice: originalPrice > price ? originalPrice : Math.round(price * 1.25),
        stock: isNaN(stock) ? 0 : stock,
        status: 'Active',
        isValid: validationErrors.length === 0,
        validationErrors
      });
    }

    setParsedItems(items);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('Please upload a .csv or .json file');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(content);
          if (!Array.isArray(json)) {
            toast.error('JSON file must contain an array of products');
            setIsLoading(false);
            return;
          }

          const items: ParsedItem[] = json.map((item: any, idx: number) => {
            const title = item.title || item.name || '';
            const sku = item.sku || `SKU-JSON-${idx + 1}`;
            const price = Number(item.price || item.currentPrice || 0);
            const originalPrice = Number(item.originalPrice || item.mrp || Math.round(price * 1.25));
            const stock = Number(item.stock || item.qty || 0);
            const category = item.category || 'Smart Life Gadgets';

            const validationErrors: string[] = [];
            if (!title) validationErrors.push('Product name is required');
            if (price <= 0) validationErrors.push('Price must be greater than 0');
            if (stock < 0) validationErrors.push('Stock cannot be negative');

            return {
              id: `bulk-json-${Date.now()}-${idx}`,
              sku,
              title,
              category,
              currentPrice: price,
              originalPrice,
              stock,
              status: (item.status === 'Draft' ? 'Draft' : 'Active') as 'Active' | 'Draft',
              isValid: validationErrors.length === 0,
              validationErrors
            };
          });

          setParsedItems(items);
        } else {
          parseCSVText(content);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse file. Please check format.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      "name,sku,category,price,original price,stock\n" +
      '"RGB Smart Desk Lamp","DESK-RGB-01","Smart Life Gadgets",1299,1999,45\n' +
      '"Ceramic Non-Stick Pan 28cm","PAN-CER-28","Home & Kitchen",1499,2299,30\n' +
      '"Wireless Fast Magnetic Charger","CHG-MAG-15W","Smart Life Gadgets",899,1499,60\n' +
      '"Ergonomic Memory Foam Pillow","PLW-MEM-02","Home Improvement",799,1299,25';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded');
  };

  const handleCommit = () => {
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      toast.error('No valid products to import');
      return;
    }

    const payload: Partial<AdminProduct>[] = validItems.map(item => ({
      sku: item.sku,
      title: item.title,
      category: item.category,
      currentPrice: item.currentPrice,
      originalPrice: item.originalPrice,
      stock: item.stock,
      status: item.status,
      discountPercentage: Math.max(0, Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)),
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      tag: 'NEW IMPORT'
    }));

    dispatch(bulkAddProducts(payload));
    toast.success(`Successfully imported ${validItems.length} products to catalog!`);
    resetUpload();
    onClose();
  };

  if (!isOpen) return null;

  const validCount = parsedItems.filter(i => i.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Bulk CSV/JSON Product Import</h2>
              <p className="text-xs text-slate-500">Quickly upload or update your catalog client-side</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              title="Download sample CSV template"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Sample CSV
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {parsedItems.length === 0 ? (
            /* Dropzone view */
            <div>
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[260px] ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
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
                
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Drag & Drop your CSV or JSON file here
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm">
                  Support standard CSV with headers: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">name</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">sku</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">price</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">stock</code>, <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">category</code>
                </p>

                <button 
                  type="button"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                >
                  Browse Computer
                </button>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200/60 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-semibold">Local Storage Persistence:</span> Imported products are automatically formatted, given IDs, and synced to Redux Toolkit & LocalStorage (`admin_products_store`) without sending data to any external server.
                </div>
              </div>
            </div>
          ) : (
            /* Preview table view */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>{fileName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-200 text-slate-700">
                        {parsedItems.length} rows found
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} valid
                      </span>
                      {invalidCount > 0 && (
                        <span className="text-rose-600 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> {invalidCount} with errors
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={resetUpload}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Reset File
                </button>
              </div>

              {/* Table preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[340px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold uppercase tracking-wider z-10">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Stock</th>
                      <th className="py-2.5 px-3">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`transition-colors ${
                          item.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/40 hover:bg-rose-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          {item.isValid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{item.sku}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={item.title}>
                          {item.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">₹{item.currentPrice.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{item.stock}</td>
                        <td className="py-2.5 px-3 text-rose-600 max-w-[150px] truncate" title={item.validationErrors.join(', ')}>
                          {item.validationErrors.length > 0 ? item.validationErrors.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {parsedItems.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                Importing <strong className="text-slate-800">{validCount}</strong> items
              </span>
              <button 
                type="button"
                disabled={validCount === 0 || isLoading}
                onClick={handleCommit}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Commit to Catalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

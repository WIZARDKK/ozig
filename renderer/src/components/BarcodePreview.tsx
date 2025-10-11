import React, { useState, useRef } from 'react';
import { Barcode } from '../types/barcode.types';
import { barcodeService } from '../services/barcode.service';
import { X, Printer, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface BarcodePreviewProps {
  barcodes: Barcode[];
  onClose: () => void;
  onPrint: (barcodes: Barcode[], options: PrintOptions) => void;
}

interface PrintOptions {
  copies: number;
  paperSize: 'A4' | 'Label' | 'Receipt';
  layout: 'grid' | 'single' | 'list';
  includeProductName: boolean;
  includePrice: boolean;
  includeSku: boolean;
  labelWidth: number;
  labelHeight: number;
  margin: number;
}

const BarcodePreview: React.FC<BarcodePreviewProps> = ({ barcodes, onClose, onPrint }) => {
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    copies: 1,
    paperSize: 'A4',
    layout: 'grid',
    includeProductName: true,
    includePrice: false,
    includeSku: true,
    labelWidth: 80,
    labelHeight: 40,
    margin: 5
  });

  const [zoom, setZoom] = useState(100);
  const [selectedBarcode, setSelectedBarcode] = useState<Barcode | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    onPrint(barcodes, printOptions);
  };

  const handlePrintPreview = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode Print Preview</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .print-container { width: 100%; }
                .barcode-grid { display: grid; gap: ${printOptions.margin}mm; }
                .barcode-item { 
                  width: ${printOptions.labelWidth}mm; 
                  height: ${printOptions.labelHeight}mm;
                  border: 1px solid #ddd;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding: 2mm;
                  box-sizing: border-box;
                  page-break-inside: avoid;
                }
                .barcode-image { max-width: 100%; max-height: 60%; object-fit: contain; }
                .barcode-text { font-size: 8pt; text-align: center; margin-top: 1mm; }
                .product-info { font-size: 7pt; text-align: center; margin-top: 1mm; }
                @media print {
                  body { margin: 0; }
                  .barcode-item { border: none; }
                }
                ${printOptions.layout === 'grid' ? `
                  .barcode-grid { 
                    grid-template-columns: repeat(auto-fit, minmax(${printOptions.labelWidth}mm, 1fr)); 
                  }
                ` : printOptions.layout === 'list' ? `
                  .barcode-grid { 
                    grid-template-columns: 1fr; 
                  }
                  .barcode-item { 
                    height: auto; 
                    flex-direction: row; 
                    justify-content: space-between; 
                  }
                ` : `
                  .barcode-grid { 
                    grid-template-columns: 1fr; 
                  }
                `}
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const generatePrintLayout = () => {
    const items: React.ReactElement[] = [];
    
    for (let copy = 0; copy < printOptions.copies; copy++) {
      barcodes.forEach((barcode) => {
        items.push(
          <div key={`${barcode.id}-${copy}`} className="barcode-item">
            <img
              src={barcodeService.generateBarcodeImage(barcode.code, barcode.format)}
              alt={barcode.code}
              className="barcode-image"
            />
            <div className="barcode-text">{barcode.code}</div>
            
            {(printOptions.includeProductName || printOptions.includePrice || printOptions.includeSku) && (
              <div className="product-info">
                {printOptions.includeProductName && (
                  <div className="product-name">{barcode.product?.name}</div>
                )}
                {printOptions.includeSku && (
                  <div className="product-sku">SKU: {barcode.product?.sku}</div>
                )}
                {printOptions.includePrice && (
                  <div className="product-price">${barcode.product?.price}</div>
                )}
              </div>
            )}
          </div>
        );
      });
    }
    
    return items;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex">
        {/* Settings Panel */}
        <div className="w-80 bg-gray-50 p-6 overflow-y-auto border-r">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Print Settings</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Print Options */}
          <div className="space-y-6">
            {/* Copies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Copies
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={printOptions.copies}
                onChange={(e) => setPrintOptions(prev => ({ ...prev, copies: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Paper Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paper Size
              </label>
              <select
                value={printOptions.paperSize}
                onChange={(e) => setPrintOptions(prev => ({ 
                  ...prev, 
                  paperSize: e.target.value as 'A4' | 'Label' | 'Receipt' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A4">A4 Paper</option>
                <option value="Label">Label Paper</option>
                <option value="Receipt">Receipt Paper</option>
              </select>
            </div>

            {/* Layout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layout
              </label>
              <select
                value={printOptions.layout}
                onChange={(e) => setPrintOptions(prev => ({ 
                  ...prev, 
                  layout: e.target.value as 'grid' | 'single' | 'list' 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="grid">Grid Layout</option>
                <option value="single">Single Column</option>
                <option value="list">List Layout</option>
              </select>
            </div>

            {/* Label Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (mm)
                </label>
                <input
                  type="number"
                  min="20"
                  max="200"
                  value={printOptions.labelWidth}
                  onChange={(e) => setPrintOptions(prev => ({ ...prev, labelWidth: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (mm)
                </label>
                <input
                  type="number"
                  min="15"
                  max="100"
                  value={printOptions.labelHeight}
                  onChange={(e) => setPrintOptions(prev => ({ ...prev, labelHeight: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Margin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margin (mm)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={printOptions.margin}
                onChange={(e) => setPrintOptions(prev => ({ ...prev, margin: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Include Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include Information
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={printOptions.includeProductName}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, includeProductName: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Product Name</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={printOptions.includeSku}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, includeSku: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">SKU</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={printOptions.includePrice}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, includePrice: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Price</span>
                </label>
              </div>
            </div>

            {/* Zoom Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview Zoom ({zoom}%)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t">
              <button
                onClick={handlePrintPreview}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Preview
              </button>
              <button
                onClick={handlePrint}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Send to Printer
              </button>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Print Preview ({barcodes.length} barcode{barcodes.length !== 1 ? 's' : ''})
              </h3>
              <div className="text-sm text-gray-600">
                Total labels: {barcodes.length * printOptions.copies}
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 p-6 overflow-auto bg-white">
            <div 
              className="mx-auto bg-white shadow-lg"
              style={{ 
                zoom: `${zoom}%`,
                width: printOptions.paperSize === 'A4' ? '210mm' : 
                      printOptions.paperSize === 'Label' ? '100mm' : '80mm',
                minHeight: printOptions.paperSize === 'A4' ? '297mm' : 'auto',
                padding: '10mm'
              }}
            >
              <div ref={printRef} className="print-container">
                <div 
                  className="barcode-grid"
                  style={{
                    display: 'grid',
                    gap: `${printOptions.margin}mm`,
                    gridTemplateColumns: printOptions.layout === 'grid' 
                      ? `repeat(auto-fit, minmax(${printOptions.labelWidth}mm, 1fr))`
                      : '1fr'
                  }}
                >
                  {generatePrintLayout()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode Details Panel */}
        {selectedBarcode && (
          <div className="w-80 bg-gray-50 p-6 border-l">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">Barcode Details</h4>
              <button 
                onClick={() => setSelectedBarcode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Code</label>
                <p className="font-mono text-sm">{selectedBarcode.code}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Product</label>
                <p className="text-sm">{selectedBarcode.product?.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Format</label>
                <p className="text-sm">{selectedBarcode.format}</p>
              </div>
              <div className="pt-4">
                <img
                  src={barcodeService.generateBarcodeImage(selectedBarcode.code, selectedBarcode.format)}
                  alt={selectedBarcode.code}
                  className="w-full border"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodePreview;
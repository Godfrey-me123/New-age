import React, { useEffect, useState } from 'react';
import { DownloadCloud, Trash2, Search, ArrowLeft, Image, FileText, CheckCircle2, Clock, XCircle, Code, Eye } from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { DownloadRecord, getAllDownloadRecordsDB, deleteDownloadRecordDB } from '../utils/idb';
import { UniversalBackButton } from './common/UniversalBackButton';

export const DownloadsScreen: React.FC = () => {
  const { setActiveScreen } = useTemplateStore();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const records = await getAllDownloadRecordsDB();
      setDownloads(records);
    } catch (e) {
      console.error('Error loading downloads', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDownloadRecordDB(id);
      setDownloads(downloads.filter(d => d.id !== id));
    } catch (e) {
      console.error('Error deleting download', e);
    }
  };

  const handleDownloadAgain = (record: DownloadRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = record.fileName;
    link.href = record.dataUrl;
    link.click();
  };

  const filteredDownloads = downloads.filter(d => 
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-8 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <header className="bg-white border-b border-[#E7E9EB] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <UniversalBackButton />
            <div>
              <h1 className="text-xl font-extrabold text-gray-950 flex items-center gap-2">
                <DownloadCloud className="w-6 h-6 text-blue-600" />
                BIGsta Downloads Center
              </h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Manage your generated files and export history</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search files, formats, or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#dadcdc] rounded-xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Downloads List */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Clock className="w-8 h-8 text-gray-300 animate-spin mb-3" />
            <p className="text-gray-500 text-sm font-medium">Loading downloads...</p>
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="py-24 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <DownloadCloud className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold text-lg">No downloads found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              {searchQuery ? "Try a different search term." : "Files you generate (PDF, PNG, JPG) will appear here for easy access."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#dadcdc] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-[#dadcdc] text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">File details</th>
                    <th className="py-4 px-6 hidden sm:table-cell">Service / Source</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dadcdc]">
                  {filteredDownloads.map(record => {
                    const isPdf = record.format === 'PDF';
                    const isImg = record.format === 'PNG' || record.format === 'JPG';
                    const isSvg = record.format === 'SVG';
                    const isJson = record.format === 'JSON';

                    return (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6 align-top">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center ${
                              isPdf ? 'bg-red-50 text-red-600' :
                              isImg ? 'bg-blue-50 text-blue-600' :
                              isSvg ? 'bg-orange-50 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {isPdf ? <FileText className="w-5 h-5" /> : 
                               isImg ? <Image className="w-5 h-5" /> :
                               isSvg ? <Code className="w-5 h-5" /> :
                               <FileText className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-950 truncate max-w-[200px] sm:max-w-xs">{record.fileName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  isPdf ? 'bg-red-100 text-red-800' :
                                  isImg ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {record.format}
                                </span>
                                {record.status === 'COMPLETED' ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" /> Ready
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    <XCircle className="w-3 h-3" /> Failed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell align-middle">
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                            {record.service}
                          </span>
                        </td>
                        <td className="py-4 px-6 align-middle">
                          <div className="text-xs text-gray-600 font-medium">
                            {record.date.split(',')[0]}
                            <span className="block text-gray-400 text-[11px] mt-0.5">{record.date.split(',')[1]}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => handleDownloadAgain(record, e)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap border border-blue-200"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">Download Again</span>
                              <span className="lg:hidden">Save</span>
                            </button>
                            {isImg && (
                              <button
                                onClick={() => {
                                  // Open preview in new tab
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<iframe src="${record.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                  }
                                }}
                                className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors hidden sm:flex"
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(record.id, e)}
                              className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors flex shrink-0"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

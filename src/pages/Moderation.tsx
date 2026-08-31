import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import moderationService from '../services/moderationService';
import type { SharedDocument } from '../types';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

export default function Moderation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchPendingCount();
  }, [activeTab, pagination.currentPage]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (activeTab === 'pending') {
        response = await moderationService.getPendingDocuments(pagination.currentPage, pagination.pageSize);
      } else if (activeTab === 'all') {
        response = await moderationService.getAllDocuments(pagination.currentPage, pagination.pageSize);
      } else {
        response = await moderationService.getDocumentsByStatus(activeTab, pagination.currentPage, pagination.pageSize);
      }

      setDocuments(response.data);
      setPagination(prev => ({
        ...prev,
        totalItems: response.pagination?.totalItems || 0,
        totalPages: response.pagination?.totalPages || 1
      }));
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản admin.');
        toast.error('Không có quyền truy cập trang kiểm duyệt');
      } else {
        setError('Không thể tải danh sách tài liệu');
        toast.error('Không thể tải danh sách tài liệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await moderationService.getPendingCount();
      setPendingCount(response.count);
    } catch (error) {
      // Don't show error for pending count - user might not have permission
      console.error('Failed to fetch pending count:', error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await moderationService.approveDocument(id, actionNotes || undefined);
      toast.success('Đã phê duyệt tài liệu');
      fetchDocuments();
      fetchPendingCount();
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error('Không thể phê duyệt tài liệu');
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await moderationService.rejectDocument(id, rejectReason);
      toast.success('Đã từ chối tài liệu');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedDocument(null);
      fetchDocuments();
      fetchPendingCount();
    } catch (error) {
      toast.error('Không thể từ chối tài liệu');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu');
      return;
    }
    try {
      const result = await moderationService.approveBatch(Array.from(selectedIds), actionNotes || undefined);
      toast.success(result.message);
      setSelectedIds(new Set());
      setActionNotes('');
      fetchDocuments();
      fetchPendingCount();
    } catch (error) {
      toast.error('Không thể phê duyệt các tài liệu đã chọn');
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu');
      return;
    }
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      const result = await moderationService.rejectBatch(Array.from(selectedIds), rejectReason);
      toast.success(result.message);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedIds(new Set());
      fetchDocuments();
      fetchPendingCount();
    } catch (error) {
      toast.error('Không thể từ chối các tài liệu đã chọn');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
    try {
      await moderationService.deleteDocument(id);
      toast.success('Đã xóa tài liệu');
      fetchDocuments();
      fetchPendingCount();
    } catch (error) {
      toast.error('Không thể xóa tài liệu');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  const getStatusBadge = (status?: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Đã duyệt</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Từ chối</span>;
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Chờ duyệt</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800">Không thể truy cập trang này</h3>
              <p className="mt-2 text-red-700">{error}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Đăng nhập lại
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Về Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt tài liệu</h1>
          <p className="text-gray-500 mt-1">Quản lý và duyệt tài liệu được chia sẻ bởi người dùng</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <span className="text-yellow-700 font-medium">{pendingCount} tài liệu chờ duyệt</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'pending', label: 'Chờ duyệt', count: pendingCount },
          { key: 'approved', label: 'Đã duyệt' },
          { key: 'rejected', label: 'Từ chối' },
          { key: 'all', label: 'Tất cả' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as TabType);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Batch Actions */}
      {activeTab === 'pending' && selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <span className="text-indigo-700 font-medium">
              Đã chọn {selectedIds.size} tài liệu
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ghi chú (tùy chọn)"
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleBatchApprove}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Duyệt tất cả
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Từ chối tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {activeTab === 'pending' && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={documents.length > 0 && selectedIds.size === documents.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tài liệu
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người gửi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày gửi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={activeTab === 'pending' ? 7 : 6} className="px-4 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'pending' ? 7 : 6} className="px-4 py-12 text-center text-gray-500">
                  Không có tài liệu nào
                </td>
              </tr>
            ) : (
              documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  {activeTab === 'pending' && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{doc.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{doc.description || 'Không có mô tả'}</p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        {doc.subject && <span>{doc.subject.name}</span>}
                        {doc.questionCount && <span>• {doc.questionCount} câu</span>}
                        {doc.gradeLevel && <span>• Lớp {doc.gradeLevel}</span>}
                        {doc.fileSize && <span>• {formatFileSize(doc.fileSize)}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.documentType === 'file' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {doc.documentType === 'file' ? 'File' : 'Link'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {doc.sharedByName || 'Ẩn danh'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(doc.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(doc.moderationStatus)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowPreviewModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(doc.id)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Phê duyệt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowRejectModal(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Từ chối"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Xóa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Trang {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Từ chối tài liệu</h3>
            <p className="text-gray-600 mb-4">
              Vui lòng nhập lý do từ chối. Người dùng sẽ thấy thông báo này.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Nội dung không phù hợp, thông tin sai sót, ..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => selectedDocument ? handleReject(selectedDocument.id) : handleBatchReject()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Chi tiết tài liệu</h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedDocument(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tiêu đề</label>
                <p className="text-gray-900">{selectedDocument.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-gray-700">{selectedDocument.description || 'Không có'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại tài liệu</label>
                  <p className="text-gray-900">{selectedDocument.documentType === 'file' ? 'File' : 'Link'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Môn học</label>
                  <p className="text-gray-900">{selectedDocument.subject?.name || 'Chưa phân loại'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số câu hỏi</label>
                  <p className="text-gray-900">{selectedDocument.questionCount || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lớp</label>
                  <p className="text-gray-900">{selectedDocument.gradeLevel ? `Lớp ${selectedDocument.gradeLevel}` : '-'}</p>
                </div>
              </div>

              {selectedDocument.linkUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Đường dẫn</label>
                  <a href={selectedDocument.linkUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-indigo-600 hover:underline break-all">
                    {selectedDocument.linkUrl}
                  </a>
                </div>
              )}

              {selectedDocument.fileUrl && (
                <div>
                  <label className="text-sm font-medium text-gray-500">File đính kèm</label>
                  <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer"
                     className="text-indigo-600 hover:underline">
                    {selectedDocument.fileType} - {formatFileSize(selectedDocument.fileSize)}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-500">Người gửi</label>
                  <p className="text-gray-900">{selectedDocument.sharedByName || 'Ẩn danh'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày gửi</label>
                  <p className="text-gray-900">{formatDate(selectedDocument.createdAt)}</p>
                </div>
              </div>

              {selectedDocument.moderationNotes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <label className="text-sm font-medium text-yellow-700">Ghi chú kiểm duyệt</label>
                  <p className="text-yellow-800 mt-1">{selectedDocument.moderationNotes}</p>
                </div>
              )}
            </div>

            {activeTab === 'pending' && (
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleApprove(selectedDocument.id);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Phê duyệt
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

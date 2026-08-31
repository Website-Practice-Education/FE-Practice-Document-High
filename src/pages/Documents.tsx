import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import documentService from '../services/documentService';
import { SubjectService } from '../services/subjectService';
import type { SharedDocument, Subject, CreateDocumentRequest, DocumentFilterRequest } from '../types';

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function Documents() {
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<DocumentFilterRequest>({
    page: 1,
    pageSize: 12,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Form state
  const [formData, setFormData] = useState<CreateDocumentRequest>({
    title: '',
    description: '',
    documentType: 'link',
    linkUrl: '',
    linkSource: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileSize: undefined,
    subjectId: undefined,
    topicId: undefined,
    questionCount: undefined,
    gradeLevel: undefined,
  });
  
  // Separate state for file object (for upload to Neon Storage)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    fetchSubjects();
    fetchDocuments();
  }, [filters]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  const fetchSubjects = async () => {
    try {
      const data = await SubjectService.getAll();
      console.log('Subjects loaded:', data);
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Fallback with sample subjects for testing
      setSubjects([
        { id: 1, code: 'TOAN', name: 'Toán học' },
        { id: 2, code: 'LY', name: 'Vật lý' },
        { id: 3, code: 'HOA', name: 'Hóa học' },
        { id: 4, code: 'VAN', name: 'Ngữ văn' },
        { id: 5, code: 'ANH', name: 'Tiếng Anh' },
        { id: 6, code: 'SU', name: 'Lịch sử' },
        { id: 7, code: 'DIA', name: 'Địa lý' },
      ]);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentService.getDocuments(filters);
      setDocuments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof DocumentFilterRequest, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    if (formData.documentType === 'link' && !formData.linkUrl?.trim()) {
      toast.error('Vui lòng nhập link chia sẻ');
      return;
    }

    if (formData.documentType === 'file' && !selectedFile && !formData.fileUrl?.trim()) {
      toast.error('Vui lòng chọn file hoặc nhập link file');
      return;
    }

    try {
      // Nếu là file type và có file object, sử dụng upload flow
      if (formData.documentType === 'file' && selectedFile) {
        // Upload file trước, sau đó tạo document
        toast.info('Đang upload file lên storage...');
        await documentService.createDocumentWithFile(
          {
            title: formData.title,
            description: formData.description,
            documentType: formData.documentType,
            linkUrl: formData.linkUrl,
            linkSource: formData.linkSource,
            subjectId: formData.subjectId,
            topicId: formData.topicId,
            questionCount: formData.questionCount,
            gradeLevel: formData.gradeLevel,
          },
          selectedFile
        );
      } else {
        // Link type hoặc file có URL trực tiếp
        await documentService.createDocument(formData);
      }
      
      toast.success('Chia sẻ tài liệu thành công!');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        documentType: 'link',
        linkUrl: '',
        linkSource: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
        fileSize: undefined,
        subjectId: undefined,
        topicId: undefined,
        questionCount: undefined,
        gradeLevel: undefined,
      });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi chia sẻ tài liệu');
    }
  };

  const handleOpenLink = async (doc: SharedDocument) => {
    const url = doc.linkUrl || doc.fileUrl;
    if (url) {
      window.open(url, '_blank');
      try {
        await documentService.incrementDownload(doc.id);
      } catch {}
    }
  };

  const handleLike = async (doc: SharedDocument) => {
    try {
      await documentService.incrementLike(doc.id);
      setDocuments(prev =>
        prev.map(d => d.id === doc.id ? { ...d, likeCount: d.likeCount + 1 } : d)
      );
      toast.success('Đã thích tài liệu!');
    } catch {
      toast.error('Có lỗi khi thích tài liệu');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'link' ? 'Link' : 'File';
  };

  const getDocumentTypeColor = (type: string) => {
    return type === 'link' 
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getGradeLabel = (grade?: number) => {
    if (!grade) return '';
    return `Lớp ${grade}`;
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      pageSize: 12,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const gradeOptions = [10, 11, 12];
  const questionCountOptions = [
    { label: 'Tất cả', min: undefined, max: undefined },
    { label: '1-10 câu', min: 1, max: 10 },
    { label: '11-25 câu', min: 11, max: 25 },
    { label: '26-50 câu', min: 26, max: 50 },
    { label: '51-100 câu', min: 51, max: 100 },
    { label: '> 100 câu', min: 101, max: undefined },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📚 Tài Liệu Chia Sẻ</h1>
            <p className="text-slate-400">Nơi mọi người có thể chia sẻ tài liệu học tập và link hữu ích</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-indigo-500/30 flex items-center gap-2"
            >
              <span className="text-xl">+</span> Chia sẻ tài liệu
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Môn học</label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) => handleFilterChange('subjectId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tất cả môn</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          {/* Question Count Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Số lượng câu</label>
            <select
              onChange={(e) => {
                const selected = questionCountOptions.find((_, idx) => idx === Number(e.target.value));
                if (selected) {
                  handleFilterChange('minQuestionCount', selected.min);
                  handleFilterChange('maxQuestionCount', selected.max);
                }
              }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {questionCountOptions.map((opt, idx) => (
                <option key={idx} value={idx}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Loại tài liệu</label>
            <select
              value={filters.documentType || ''}
              onChange={(e) => handleFilterChange('documentType', e.target.value || undefined)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="link">Link chia sẻ</option>
              <option value="file">File tải lên</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sắp xếp theo</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="created_at-desc">Mới nhất</option>
              <option value="created_at-asc">Cũ nhất</option>
              <option value="view_count-desc">Lượt xem</option>
              <option value="like_count-desc">Lượt thích</option>
              <option value="download_count-desc">Lượt tải</option>
              <option value="question_count-desc">Nhiều câu hỏi nhất</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-medium text-white mb-2">Chưa có tài liệu nào</h3>
          <p className="text-slate-400 mb-6">Hãy là người đầu tiên chia sẻ tài liệu!</p>
          {isLoggedIn && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Chia sẻ tài liệu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group"
            >
              {/* Document Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(doc.documentType)}`}>
                    {getDocumentTypeLabel(doc.documentType)}
                  </span>
                  {doc.isVerified && (
                    <span className="text-yellow-400 text-sm" title="Đã xác minh">✓</span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                  {doc.title}
                </h3>
                
                {doc.description && (
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {doc.subject && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                      📖 {doc.subject.name}
                    </span>
                  )}
                  {doc.questionCount && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                      ❓ {doc.questionCount} câu
                    </span>
                  )}
                  {doc.gradeLevel && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                      🎓 {getGradeLabel(doc.gradeLevel)}
                    </span>
                  )}
                </div>

                {/* Shared By */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                    {doc.sharedByName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span>{doc.sharedByName || 'Người dùng ẩn danh'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>👁️</span> {doc.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📥</span> {doc.downloadCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>❤️</span> {doc.likeCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(doc)}
                    className="p-2 text-slate-400 hover:text-pink-400 hover:bg-pink-400/10 rounded-lg transition-colors"
                    title="Thích"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleOpenLink(doc)}
                    className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                  >
                    <span>Mở</span>
                    <span>↗️</span>
                  </button>
                </div>
              </div>

              {/* Time */}
              <div className="px-5 py-2 text-xs text-slate-500">
                {new Date(doc.createdAt).toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            ← Trước
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    pagination.currentPage === pageNum
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Chia sẻ tài liệu mới</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tiêu đề <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Đề thi Toán THPT 2024"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về tài liệu..."
                  rows={3}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Loại tài liệu</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="documentType"
                      value="link"
                      checked={formData.documentType === 'link'}
                      onChange={() => setFormData(prev => ({ ...prev, documentType: 'link' }))}
                      className="w-4 h-4 text-indigo-500 bg-slate-700 border-slate-600 focus:ring-indigo-500"
                    />
                    <span className="text-white">Link chia sẻ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="documentType"
                      value="file"
                      checked={formData.documentType === 'file'}
                      onChange={() => setFormData(prev => ({ ...prev, documentType: 'file' }))}
                      className="w-4 h-4 text-indigo-500 bg-slate-700 border-slate-600 focus:ring-indigo-500"
                    />
                    <span className="text-white">File tải lên</span>
                  </label>
                </div>
              </div>

              {/* Link URL */}
              {formData.documentType === 'link' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Link chia sẻ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                      placeholder="https://drive.google.com/... hoặc https://zalo.me/..."
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Nguồn</label>
                    <select
                      value={formData.linkSource}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkSource: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Chọn nguồn</option>
                      <option value="Google Drive">Google Drive</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Zalo">Zalo</option>
                      <option value="Website">Website</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chọn file tài liệu <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Lưu file object để upload lên Neon Storage
                            setSelectedFile(file);
                            setFormData(prev => ({ 
                              ...prev, 
                              fileName: file.name,
                              fileSize: file.size,
                              fileType: file.type
                            }));
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center justify-center gap-2 w-full bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-xl px-4 py-6 text-white cursor-pointer hover:bg-slate-700 hover:border-indigo-500 transition-colors"
                      >
                        <span className="text-2xl">📁</span>
                        <div className="text-left">
                          <p className="font-medium">Click để chọn file</p>
                          <p className="text-sm text-slate-400">PDF, Word, Excel, PowerPoint</p>
                        </div>
                      </label>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-green-400">✓</span>
                        <span className="text-white text-sm flex-1 truncate">{selectedFile.name}</span>
                        <span className="text-slate-400 text-xs">{formatFileSize(selectedFile.size)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setFormData(prev => ({ 
                              ...prev, 
                              fileUrl: undefined,
                              fileName: undefined,
                              fileSize: undefined,
                              fileType: undefined
                            }));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Hoặc nhập link file</label>
                    <input
                      type="url"
                      value={formData.fileUrl && !formData.fileName ? formData.fileUrl : ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fileUrl: e.target.value,
                        fileName: undefined,
                        fileSize: undefined,
                        fileType: undefined
                      }))}
                      placeholder="Link file (VD: Google Drive)"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Môn học</label>
                <select
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              {/* Question Count & Grade Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Số lượng câu</label>
                  <input
                    type="number"
                    value={formData.questionCount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, questionCount: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="VD: 50"
                    min="1"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Lớp</label>
                  <select
                    value={formData.gradeLevel || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Chọn lớp</option>
                    {gradeOptions.map(grade => (
                      <option key={grade} value={grade}>Lớp {grade}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/30"
                >
                  Chia sẻ ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

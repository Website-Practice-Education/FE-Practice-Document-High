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
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null); // Detail modal state
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMyDocuments, setShowMyDocuments] = useState(false); // Toggle: my docs vs all docs

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
    // Fetch based on toggle
    if (showMyDocuments) {
      fetchMyDocuments();
    } else {
      fetchDocuments();
    }
  }, [filters, showMyDocuments]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole?.toLowerCase() === 'admin');
  };

  const fetchSubjects = async () => {
    try {
      const data = await SubjectService.getAll();
      console.log('Raw subjects response:', data);
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
    setError(null);
    try {
      const response = await documentService.getDocuments(filters);
      console.log('API Response for documents:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));
      console.log('Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      
      // Check if response has isAdmin flag from backend
      if (response && typeof response === 'object' && 'isAdmin' in response) {
        setIsAdmin((response as any).isAdmin || false);
      }
      
      // Normalize response to handle different API formats
      // ASP.NET Core 8 with $id wrapper: { $id: '1', success: true, data: [...], pagination: {...} }
      // ASP.NET Core with $values: { data: { $values: [...] } }
      // Standard format: { success: true, data: [...] }
      // Direct array: [...]
      let docsArray: SharedDocument[] = [];
      
      // Step 1: Extract the actual response data
      let responseData = response;
      if (responseData && typeof responseData === 'object') {
        // Handle $id wrapper (ASP.NET Core 8 ProblemDetail or similar)
        if ('$id' in responseData) {
          console.log('Detected $id wrapper, extracting...');
          responseData = (responseData as any).data || responseData;
        }
      }
      
      // Step 2: Handle data extraction based on structure
      if (Array.isArray(responseData)) {
        // Direct array response
        docsArray = responseData;
      } else if (responseData && typeof responseData === 'object') {
        // Try to find documents array in various formats
        const extractArray = (obj: any): any[] | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Direct array
          if (Array.isArray(obj)) return obj;
          
          // Check common keys for arrays
          const arrayKeys = ['$values', 'data', 'items', 'documents', 'results', 'records', 'value'];
          for (const key of arrayKeys) {
            if (obj[key] !== undefined) {
              if (Array.isArray(obj[key])) return obj[key];
              // Handle nested $values
              if (obj[key] && typeof obj[key] === 'object' && Array.isArray((obj[key] as any).$values)) {
                return (obj[key] as any).$values;
              }
            }
          }
          
          // Check if object has numeric keys (array-like)
          const keys = Object.keys(obj);
          if (keys.length > 0 && keys.every(k => !isNaN(parseInt(k)))) {
            return Object.values(obj);
          }
          
          return null;
        };
        
        const extractedArray = extractArray(responseData);
        if (extractedArray) {
          docsArray = extractedArray;
        }
      }
      
      // Step 3: Ensure docsArray is properly typed
      if (!Array.isArray(docsArray)) {
        docsArray = [];
      }
      
      console.log('Normalized documents array:', docsArray);
      console.log('Documents count:', docsArray.length);
      setDocuments(docsArray);
      
      // Step 4: Handle pagination from different formats
      let paginationData = null;
      
      // Try to find pagination in response
      if (response?.pagination) {
        paginationData = response.pagination;
      } else if (response?.data?.pagination) {
        paginationData = response.data.pagination;
      } else if (responseData?.pagination) {
        paginationData = responseData.pagination;
      }
      
      if (paginationData) {
        setPagination(paginationData);
      } else {
        setPagination({
          currentPage: filters.page || 1,
          pageSize: filters.pageSize || 12,
          totalItems: docsArray.length,
          totalPages: Math.ceil(docsArray.length / (filters.pageSize || 12)),
        });
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Không thể tải danh sách tài liệu. Vui lòng kiểm tra kết nối server.';
      setError(errorMessage);
      toast.error(errorMessage);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's own documents (including pending ones)
  const fetchMyDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getMyDocuments(filters.page || 1, filters.pageSize || 12);
      console.log('My Documents Response:', response);
      
      let docsArray: SharedDocument[] = [];
      
      // Normalize response
      if (Array.isArray(response)) {
        docsArray = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        docsArray = (response as any).data || [];
        if (Array.isArray(docsArray)) {
          // Check for $values
          docsArray = Array.isArray((docsArray as any).$values) ? (docsArray as any).$values : docsArray;
        }
      }
      
      setDocuments(docsArray);
      setPagination({
        currentPage: filters.page || 1,
        pageSize: filters.pageSize || 12,
        totalItems: docsArray.length,
        totalPages: Math.ceil(docsArray.length / (filters.pageSize || 12)),
      });
    } catch (error: any) {
      console.error('Error fetching my documents:', error);
      setError(error.response?.data?.message || 'Không thể tải tài liệu của bạn.');
      toast.error('Không thể tải tài liệu của bạn.');
      setDocuments([]);
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
        const response = await documentService.createDocumentWithFile(
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
        toast.success(response?.message || 'Chia sẻ tài liệu thành công! Tài liệu đang chờ admin duyệt.');
      } else {
        // Link type hoặc file có URL trực tiếp
        const response = await documentService.createDocument(formData);
        toast.success(response?.message || 'Chia sẻ tài liệu thành công! Tài liệu đang chờ admin duyệt.');
      }
      
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
    let url = doc.linkUrl || doc.fileUrl;
    if (url) {
      // Nếu là đường dẫn tương đối (/uploads/...), thêm base URL của backend
      if (url.startsWith('/')) {
        const apiBaseUrl = (
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_API_BASE_URL ||
          import.meta.env.VITE_API_BASE_URL_SECURE ||
          'http://localhost:5058'
        ).replace(/\/+$/, '');
        url = `${apiBaseUrl}${url}`;
      }
      
      window.open(url, '_blank');
      try {
        await documentService.incrementDownload(doc.id);
      } catch {}
    }
  };

  // Handle opening document detail modal
  const handleOpenDetail = (doc: SharedDocument) => {
    setSelectedDocument(doc);
  };

  const handleCloseDetail = () => {
    setSelectedDocument(null);
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
            <h1 className="text-3xl font-bold text-white mb-2">Tài Liệu Chia Sẻ</h1>
            <p className="text-slate-400">Nơi mọi người có thể chia sẻ tài liệu học tập và link hữu ích</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle: All docs vs My docs */}
            {isLoggedIn && (
              <div className="flex bg-slate-700/50 rounded-xl p-1">
                <button
                  onClick={() => setShowMyDocuments(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    !showMyDocuments 
                      ? 'bg-indigo-500 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setShowMyDocuments(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showMyDocuments 
                      ? 'bg-indigo-500 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tài liệu của tôi
                </button>
              </div>
            )}
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
      </div>

      {/* My documents notice */}
      {showMyDocuments && (
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-indigo-300 font-medium">Đang xem tài liệu của bạn</h3>
              <p className="text-indigo-400/70 text-sm">Bao gồm cả tài liệu đang chờ duyệt</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 mb-8 text-center">
          <h3 className="text-lg font-medium text-red-400 mb-2">Lỗi kết nối</h3>
          <p className="text-red-300/80 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-red-500/30 text-red-300 rounded-lg hover:bg-red-500/40 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      {/* Loading state for filters */}
      {!subjects.length && !loading && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-slate-700/50 text-center">
          <p className="text-slate-400 text-sm">Đang tải danh sách môn học...</p>
        </div>
      )}

      {/* Admin notice */}
      {isAdmin && documents.length === 0 && !loading && !error && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-8 text-center">
          <h3 className="text-lg font-medium text-yellow-400 mb-2">Chế độ Admin</h3>
          <p className="text-yellow-300/80 mb-2">Bạn đang xem với tư cách Quản trị viên.</p>
          <p className="text-yellow-300/80">Nếu danh sách trống, có thể tất cả tài liệu đều đang chờ kiểm duyệt.</p>
          <a 
            href="/moderation"
            className="inline-block mt-3 px-4 py-2 bg-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/40 transition-colors"
          >
            Đi đến trang kiểm duyệt
          </a>
        </div>
      )}

      {/* Documents Grid - Safe array check */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : !Array.isArray(documents) || documents.length === 0 ? (
        <div className="text-center py-16">
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
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group cursor-pointer"
              onClick={() => handleOpenDetail(doc)}
            >
              {/* Document Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDocumentTypeColor(doc.documentType)}`}>
                      {getDocumentTypeLabel(doc.documentType)}
                    </span>
                    {/* Admin: Show moderation status badge */}
                    {isAdmin && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.moderationStatus === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        doc.moderationStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        doc.moderationStatus === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {doc.moderationStatus === 'approved' ? 'Đã duyệt' :
                         doc.moderationStatus === 'pending' ? 'Chờ duyệt' :
                         doc.moderationStatus === 'rejected' ? 'Từ chối' : '?'}
                      </span>
                    )}
                  </div>
                  {doc.isVerified && (
                    <span className="text-yellow-400 text-sm" title="Đã xác minh">Đã xác minh</span>
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
                      {doc.subject.name}
                    </span>
                  )}
                  {doc.questionCount && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                      {doc.questionCount} câu
                    </span>
                  )}
                  {doc.gradeLevel && (
                    <span className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                      {getGradeLabel(doc.gradeLevel)}
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
                    {doc.viewCount} lượt xem
                  </span>
                  <span className="flex items-center gap-1">
                    {doc.downloadCount} lượt tải
                  </span>
                  <span className="flex items-center gap-1">
                    {doc.likeCount} lượt thích
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(doc)}
                    className="p-2 text-slate-400 hover:text-pink-400 hover:bg-pink-400/10 rounded-lg transition-colors"
                    title="Thích"
                  >
                    Thích
                  </button>
                  <button
                    onClick={() => handleOpenDetail(doc)}
                    className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                  >
                    Chi tiết
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
            Trước
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
            Sau
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
                  Đóng
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
                        <div className="text-left">
                          <p className="font-medium">Click để chọn file</p>
                          <p className="text-sm text-slate-400">PDF, Word, Excel, PowerPoint</p>
                        </div>
                      </label>
                    </div>
                    {selectedFile && (
                      <div className="mt-2 flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                        <span className="text-green-400">Đã chọn</span>
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
                          Xóa
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

      {/* Document Detail Modal - Added safety check */}
      {selectedDocument && selectedDocument.id && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseDetail}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Purple gradient background */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">{selectedDocument.title || 'Không có tiêu đề'}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedDocument.documentType === 'link' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {selectedDocument.documentType === 'link' ? 'Link' : 'File'}
                    </span>
                    {selectedDocument.subject && (
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                        {selectedDocument.subject.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleOpenLink(selectedDocument)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                >
                  Mở tài liệu
                </button>
                <button
                  onClick={() => {
                    toast.success('Đã lưu tài liệu!');
                  }}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Lưu
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{selectedDocument.viewCount}</div>
                  <div className="text-xs text-slate-500">Lượt xem</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{selectedDocument.likeCount}</div>
                  <div className="text-xs text-slate-500">Lượt thích</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{selectedDocument.downloadCount}</div>
                  <div className="text-xs text-slate-500">Lượt tải</div>
                </div>
              </div>

              {/* Info Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedDocument.questionCount && (
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm">
                    {selectedDocument.questionCount} câu
                  </span>
                )}
                {selectedDocument.gradeLevel && (
                  <span className="px-3 py-1.5 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-300 rounded-lg text-sm">
                    {getGradeLabel(selectedDocument.gradeLevel)}
                  </span>
                )}
                {selectedDocument.linkSource && (
                  <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg text-sm">
                    {selectedDocument.linkSource}
                  </span>
                )}
              </div>

              {/* Description */}
              {selectedDocument.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Mô tả</h3>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                      {selectedDocument.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Shared By & Time */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                    {selectedDocument.sharedByName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedDocument.sharedByName || 'Người dùng ẩn danh'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(selectedDocument.createdAt).toLocaleDateString('vi-VN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

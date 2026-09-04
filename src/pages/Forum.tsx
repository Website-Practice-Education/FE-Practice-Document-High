import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { forumService } from '../services/forumService';
import type { ForumPost, ForumComment } from '../services/forumService';
import Loading from '../components/Loading';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useTheme } from '../contexts/ThemeContext';

export default function Forum() {
  // Initialize as empty array to ensure posts is always an array
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [newContent, setNewContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [postingComment, setPostingComment] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'post' | 'comment' | null;
    id: number | null;
    postId?: number;
  }>({ isOpen: false, type: null, id: null });
  const { isDark } = useTheme();

  const getUserInfo = (): { name: string; avatar: string } => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return { 
          name: user.fullName || user.email || 'User', 
          avatar: user.avatarUrl || '' 
        };
      } catch {
        return { name: 'User', avatar: '' };
      }
    }
    return { name: 'User', avatar: '' };
  };

  const userInfo = getUserInfo();

  const loadPosts = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await forumService.getPosts(pageNum, 20);
      console.log('[Forum] loadPosts response:', response);
      const responseData = response?.data;
      
      if (response.success && Array.isArray(responseData)) {
        if (pageNum === 1) {
          setPosts(responseData);
        } else {
          setPosts(prev => [...prev, ...responseData]);
        }
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.totalCount || 0);
      } else {
        console.warn('[Forum] Unexpected response format:', response);
        // Handle non-array response
        if (pageNum === 1) {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Không thể tải bài viết');
      if (pageNum === 1) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim() && !selectedImage) {
      toast.error('Vui lòng nhập nội dung hoặc chọn hình ảnh');
      return;
    }

    try {
      setPosting(true);
      let documentUrl: string | undefined;

      if (selectedImage) {
        try {
          documentUrl = await forumService.uploadImage(selectedImage);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          toast.warning('Upload ảnh thất bại, bài viết sẽ không có ảnh');
        }
      }

      const response = await forumService.createPost(newContent.trim(), documentUrl);
      if (response.success) {
        setPosts(prev => [response.data, ...prev]);
        setNewContent('');
        removeImage();
        setTotalCount(prev => prev + 1);
        toast.success('Đăng bài thành công!');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Không thể đăng bài');
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    setDeleteModal({ isOpen: true, type: 'post', id: postId });
  };

  const confirmDeletePost = async () => {
    const postId = deleteModal.id;
    if (!postId) return;
    
    try {
      const response = await forumService.deletePost(postId);
      if (response.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setTotalCount(prev => prev - 1);
        toast.success('Xóa bài viết thành công');
      }
    } catch (error) {
      toast.error('Không thể xóa bài viết');
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null });
    }
  };

  const handleToggleLike = async (postId: number) => {
    try {
      const response = await forumService.toggleLike(postId);
      if (response.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: response.data.isLiked,
              likeCount: response.data.isLiked ? p.likeCount + 1 : p.likeCount - 1
            };
          }
          return p;
        }));
      }
    } catch (error) {
      toast.error('Không thể thích bài viết');
    }
  };

  const toggleComments = async (postId: number) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      setExpandedComments(prev => new Set([...prev, postId]));
      if (!commentsCache.current[postId]) {
        loadComments(postId);
      }
    }
  };

  const commentsCache = useRef<Record<number, ForumComment[]>>({});

  const loadComments = async (postId: number) => {
    try {
      const response = await forumService.getComments(postId);
      if (response.success) {
        commentsCache.current[postId] = response.data;
        setPosts(prev => [...prev]); // Force re-render
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      setPostingComment(postId);
      const response = await forumService.addComment(postId, content);
      if (response.success) {
        commentsCache.current[postId] = [response.data, ...(commentsCache.current[postId] || [])];
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, commentCount: p.commentCount + 1 };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        toast.success('Bình luận thành công!');
      }
    } catch (error) {
      toast.error('Không thể bình luận');
    } finally {
      setPostingComment(null);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    setDeleteModal({ isOpen: true, type: 'comment', id: commentId, postId });
  };

  const confirmDeleteComment = async () => {
    const { id, postId } = deleteModal;
    if (!id || !postId) return;
    
    try {
      const response = await forumService.deleteComment(id);
      if (response.success) {
        commentsCache.current[postId] = commentsCache.current[postId]?.filter(c => c.id !== id) || [];
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, commentCount: Math.max(0, p.commentCount - 1) };
          }
          return p;
        }));
        toast.success('Xóa bình luận thành công');
      }
    } catch (error) {
      toast.error('Không thể xóa bình luận');
    } finally {
      setDeleteModal({ isOpen: false, type: null, id: null });
    }
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      setPage(prev => prev + 1);
      loadPosts(page + 1);
    }
  };

  // Ensure posts is always an array for rendering
  const safePosts = Array.isArray(posts) ? posts : [];

  if (loading && safePosts.length === 0) return <Loading message="Đang tải diễn đàn..." />;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              userInfo.name.charAt(0).toUpperCase()
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-800 font-[family-name:var(--font-display)]">
            Diễn đàn cộng đồng
          </h1>
        </div>
      </div>

      {/* Create Post */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              userInfo.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`${userInfo.name}, bạn đang nghĩ gì?`}
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none outline-none text-sm"
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-64 rounded-xl object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  Hình ảnh
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={posting || (!newContent.trim() && !selectedImage)}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Đang đăng...
                  </span>
                ) : 'Đăng bài'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {safePosts.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="empty-symbol">📝</div>
            <p className="text-lg font-semibold text-slate-700">Chưa có bài viết nào</p>
            <p className="text-sm text-slate-400 mt-1">Hãy là người đầu tiên đăng bài!</p>
          </div>
        ) : (
          safePosts.map((post) => (
            <div key={post.id} className="glass-card rounded-2xl overflow-hidden animate-fade-in-up">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {post.userAvatar ? (
                    <img src={post.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    post.userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 truncate">{post.userName}</p>
                    {post.isOwner && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full font-medium">
                        Bạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{post.timeAgo}</p>
                </div>
                {post.isOwner && (
                  <div className="relative group">
                    <button className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                      >
                        Xóa bài viết
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 pb-2">
                <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.documentUrl && (
                <div className="mt-2">
                  <img 
                    src={post.documentUrl} 
                    alt="" 
                    className="w-full max-h-[500px] object-contain bg-slate-50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Post Stats */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-slate-500 border-b border-slate-100">
                <span>{post.likeCount} lượt thích</span>
                <span>{post.commentCount} bình luận</span>
              </div>

              {/* Post Actions */}
              <div className="px-4 py-2 flex items-center gap-4">
                <button
                  onClick={() => handleToggleLike(post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    post.isLiked 
                      ? 'text-indigo-600 bg-indigo-50' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post.isLiked ? 'Đã thích' : 'Thích'}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Bình luận
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments.has(post.id) && (
                <div className="border-t border-slate-100">
                  {/* Comment Input */}
                  <div className="p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {userInfo.avatar ? (
                        <img src={userInfo.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        userInfo.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment(post.id)}
                        placeholder="Viết bình luận..."
                        className="flex-1 px-4 py-2 rounded-full bg-slate-100 border-0 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={postingComment === post.id || !commentInputs[post.id]?.trim()}
                        className="btn-primary !px-4 !py-2 !text-sm disabled:opacity-50"
                      >
                        {postingComment === post.id ? '...' : 'Gửi'}
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="px-4 pb-4 space-y-3">
                    {commentsCache.current[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {comment.userAvatar ? (
                            <img src={comment.userAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            comment.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3 py-2">
                            <p className="font-medium text-sm text-slate-800">{comment.userName}</p>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 ml-2">
                            <span className="text-xs text-slate-400">{comment.timeAgo}</span>
                            {comment.isOwner && (
                              <button
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                                className="text-xs text-slate-400 hover:text-red-500"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!commentsCache.current[post.id] || commentsCache.current[post.id].length === 0) && (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {page < totalPages && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Đang tải...' : 'Xem thêm bài viết'}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'post' ? 'Xóa bài viết' : 'Xóa bình luận'}
        message={
          deleteModal.type === 'post'
            ? 'Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.'
            : 'Bạn có chắc muốn xóa bình luận này?'
        }
        onConfirm={deleteModal.type === 'post' ? confirmDeletePost : confirmDeleteComment}
        onCancel={() => setDeleteModal({ isOpen: false, type: null, id: null })}
        isDark={isDark}
      />
    </div>
  );
}

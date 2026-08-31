import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateSpaceRequest, StudySpace, UpdateSpaceRequest } from '../services/studySpaceService';
import type { Friend, FriendRequest } from '../services/studySpaceService';
import { studySpaceService, friendService } from '../services/studySpaceService';
import Loading from '../components/Loading';
import TabBar from '../components/TabBar';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function StudySpaces() {
  const navigate = useNavigate();
  const [mySpaces, setMySpaces] = useState<StudySpace[]>([]);
  const [myCreatedSpaces, setMyCreatedSpaces] = useState<StudySpace[]>([]);
  const [publicSpaces, setPublicSpaces] = useState<StudySpace[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'joined' | 'public' | 'friends'>('my-rooms');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSpaceId, setDeletingSpaceId] = useState<number | null>(null);
  const [editingSpace, setEditingSpace] = useState<StudySpace | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [newSpace, setNewSpace] = useState<CreateSpaceRequest>({
    name: '',
    description: '',
    spaceType: 'public',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [my, myCreated, publicData, friendsData, requestsData] = await Promise.all([
        studySpaceService.getMySpaces(),
        studySpaceService.getMyCreatedSpaces(),
        studySpaceService.getPublicSpaces(),
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setMySpaces(my);
      setMyCreatedSpaces(myCreated);
      setPublicSpaces(publicData);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!newSpace.name.trim()) return;
    try {
      const space = await studySpaceService.createSpace(newSpace);
      navigate(`/study-spaces/${space.id}`);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  const handleEditSpace = (space: StudySpace, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSpace(space);
    setShowEditModal(true);
  };

  const handleUpdateSpace = async () => {
    if (!editingSpace || !editingSpace.name.trim()) return;
    setIsUpdating(true);
    try {
      const updateData: UpdateSpaceRequest = {
        name: editingSpace.name,
        description: editingSpace.description,
        spaceType: editingSpace.spaceType,
      };
      await studySpaceService.updateSpace(editingSpace.id, updateData);
      setShowEditModal(false);
      setEditingSpace(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to update space:', error);
      const message = error.response?.data?.message || 'Không thể cập nhật phòng học';
      alert(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSpace = async (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSpaceId(spaceId);
    setShowDeleteModal(true);
  };

  const confirmDeleteSpace = async () => {
    if (!deletingSpaceId) return;
    setIsDeleting(true);
    try {
      await studySpaceService.deleteSpace(deletingSpaceId);
      setShowDeleteModal(false);
      setDeletingSpaceId(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to delete space:', error);
      const message = error.response?.data?.message || 'Không thể xóa phòng học';
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      const result = await studySpaceService.joinByCode(inviteCode);
      navigate(`/study-spaces/${result.spaceId}`);
    } catch (error) {
      console.error('Failed to join space:', error);
      alert('Mã mời không hợp lệ');
    }
  };

  const handleJoinSpace = async (spaceId: number) => {
    try {
      await studySpaceService.joinSpace(spaceId);
      navigate(`/study-spaces/${spaceId}`);
    } catch (error) {
      console.error('Failed to join space:', error);
    }
  };

  const handleLeaveSpace = async (spaceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc muốn rời phòng học này?')) return;
    try {
      await studySpaceService.leaveSpace(spaceId);
      loadData();
    } catch (error) {
      console.error('Failed to leave space:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (searchQuery.length < 2) return;
    try {
      const results = await friendService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await friendService.sendRequest(userId);
      alert('Đã gửi lời mời kết bạn!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gửi lời mời thất bại');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendService.acceptRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      await friendService.declineRequest(requestId);
      loadData();
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  if (loading) return <Loading message="Đang tải phòng học..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Phòng Học</h1>
          <p className="page-subtitle">Học cùng nhau với chat thời gian thực</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Thời gian hiện tại</p>
            <p className="text-2xl font-bold text-indigo-600 font-[family-name:var(--font-display)]">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Ngày</p>
            <p className="text-sm font-semibold text-slate-700">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
              Tham gia bằng mã
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              + Tạo phòng mới
            </button>
          </div>
        </div>
      </div>

      <TabBar
        className="mb-8 animate-fade-in-up"
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        tabs={[
          { id: 'my-rooms', label: 'Phòng của tôi', count: myCreatedSpaces.length },
          { id: 'joined', label: 'Đã tham gia', count: mySpaces.filter(s => !myCreatedSpaces.some(cs => cs.id === s.id)).length },
          { id: 'public', label: 'Phòng công khai' },
          { id: 'friends', label: 'Bạn bè', count: friends.length, badge: requests.length || undefined },
        ]}
      />

      {activeTab === 'my-rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myCreatedSpaces.length === 0 ? (
            <div className="col-span-full text-center py-16 glass-card rounded-2xl animate-scale-in">
              <div className="empty-symbol">0</div>
              <p className="text-lg font-semibold text-slate-700 mb-2">Bạn chưa tạo phòng nào</p>
              <button onClick={() => setShowCreateModal(true)} className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                Tạo phòng mới ngay
              </button>
            </div>
          ) : (
            myCreatedSpaces.map((space, index) => (
              <div
                key={space.id}
                onClick={() => navigate(`/study-spaces/${space.id}`)}
                className={`space-card animate-fade-in-up stagger-${(index % 6) + 1}`}
                style={{ animationFillMode: 'forwards', opacity: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 font-[family-name:var(--font-display)]">{space.name}</h3>
                      <span className="badge badge-warning !text-xs">Chủ phòng</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {space.description || 'Chưa có mô tả'}
                    </p>
                  </div>
                  <span className={`badge ${space.spaceType === 'public' ? 'badge-success' : 'badge-info'}`}>
                    {space.spaceType === 'public' ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">{space.memberCount} thành viên</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleEditSpace(space, e)} 
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSpace(space.id, e)} 
                      className="btn-danger !px-3 !py-1.5 !text-xs"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'joined' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(() => {
            const joinedSpaces = mySpaces.filter(s => !myCreatedSpaces.some(cs => cs.id === s.id));
            return joinedSpaces.length === 0 ? (
              <div className="col-span-full text-center py-16 glass-card rounded-2xl animate-scale-in">
                <div className="empty-symbol">—</div>
                <p className="text-lg font-semibold text-slate-700 mb-2">Bạn chưa tham gia phòng nào</p>
                <button onClick={() => setActiveTab('public')} className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                  Khám phá phòng công khai
                </button>
              </div>
            ) : (
              joinedSpaces.map((space, index) => (
                <div
                  key={space.id}
                  onClick={() => navigate(`/study-spaces/${space.id}`)}
                  className={`space-card animate-fade-in-up stagger-${(index % 6) + 1}`}
                  style={{ animationFillMode: 'forwards', opacity: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 font-[family-name:var(--font-display)]">{space.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {space.description || 'Chưa có mô tả'}
                      </p>
                    </div>
                    <span className={`badge ${space.spaceType === 'public' ? 'badge-success' : 'badge-info'}`}>
                      {space.spaceType === 'public' ? 'Công khai' : 'Riêng tư'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">{space.memberCount} thành viên</span>
                    <button onClick={(e) => handleLeaveSpace(space.id, e)} className="btn-danger text-xs">
                      Rời phòng
                    </button>
                  </div>
                </div>
              ))
            );
          })()}
        </div>
      )}

      {activeTab === 'public' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {publicSpaces.map((space, index) => (
            <div
              key={space.id}
              className={`space-card animate-fade-in-up stagger-${(index % 6) + 1}`}
              style={{ animationFillMode: 'forwards', opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 font-[family-name:var(--font-display)]">{space.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {space.description || 'Chưa có mô tả'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Tạo bởi {space.creatorName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500">{space.memberCount} thành viên</span>
                <button onClick={() => handleJoinSpace(space.id)} className="btn-primary !px-4 !py-1.5 !text-xs">
                  Tham gia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.length > 0 && (
            <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
              <h3 className="font-bold text-slate-800 mb-4 font-[family-name:var(--font-display)]">
                Lời mời kết bạn
              </h3>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="user-item">
                    <div className="avatar">{request.userName?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{request.userName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptRequest(request.id)} className="btn-primary !px-3 !py-1.5 !text-xs">
                        Chấp nhận
                      </button>
                      <button onClick={() => handleDeclineRequest(request.id)} className="btn-secondary !px-3 !py-1.5 !text-xs">
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 font-[family-name:var(--font-display)]">Bạn bè của tôi</h3>
              <button onClick={() => setShowAddFriendModal(true)} className="text-sm text-indigo-500 hover:text-indigo-700 font-semibold transition-colors">
                + Thêm bạn
              </button>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="empty-symbol">—</div>
                <p className="text-slate-500">Chưa có bạn bè</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="user-item">
                    <div className="avatar">{friend.friendName?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{friend.friendName}</p>
                      <p className="text-xs text-slate-500">
                        Bạn bè từ {new Date(friend.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)]">Tạo Phòng Học</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên phòng</label>
                <input
                  type="text"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  className="input-field"
                  placeholder="VD: Nhóm học Toán"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Phòng học này về gì?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại phòng</label>
                <select
                  value={newSpace.spaceType}
                  onChange={(e) => setNewSpace({ ...newSpace, spaceType: e.target.value })}
                  className="input-field"
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư (chỉ mời)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Hủy</button>
              <button onClick={handleCreateSpace} className="btn-primary">Tạo phòng</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingSpace && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)]">Chỉnh sửa phòng học</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên phòng</label>
                <input
                  type="text"
                  value={editingSpace.name}
                  onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                  className="input-field"
                  placeholder="VD: Nhóm học Toán"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                <textarea
                  value={editingSpace.description || ''}
                  onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Phòng học này về gì?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại phòng</label>
                <select
                  value={editingSpace.spaceType}
                  onChange={(e) => setEditingSpace({ ...editingSpace, spaceType: e.target.value })}
                  className="input-field"
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư (chỉ mời)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setEditingSpace(null); }} className="btn-secondary">Hủy</button>
              <button onClick={handleUpdateSpace} className="btn-primary" disabled={isUpdating}>
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)]">Tham gia bằng mã mời</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field text-center text-xl tracking-[0.3em] font-bold border-dashed border-2"
              placeholder="ABCD1234"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary">Hủy</button>
              <button onClick={handleJoinByCode} className="btn-primary">Tham gia</button>
            </div>
          </div>
        </div>
      )}

      {showAddFriendModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-5 font-[family-name:var(--font-display)]">Thêm bạn bè</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="input-field flex-1"
                placeholder="Tìm theo tên hoặc email"
              />
              <button onClick={handleSearchUsers} className="btn-primary">Tìm</button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="user-item">
                    <div className="avatar">{user.name?.charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button onClick={() => handleSendRequest(user.id)} className="btn-primary !px-3 !py-1.5 !text-xs">
                      Thêm
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowAddFriendModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Xóa phòng học"
        message="Bạn có chắc muốn xóa phòng học này? Hành động này không thể hoàn tác."
        onConfirm={confirmDeleteSpace}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingSpaceId(null);
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}

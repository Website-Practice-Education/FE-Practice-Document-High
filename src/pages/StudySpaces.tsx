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
      const message = error.response?.data?.message || 'Khong the cap nhat phong hoc';
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
      const message = error.response?.data?.message || 'Khong the xoa phong hoc';
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
      alert('Ma moi khong hop le');
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
    if (!confirm('Ban co chac muon roi phong hoc nay?')) return;
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
      alert('Da gui loi moi ket ban!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gui loi moi that bai');
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

  if (loading) return <Loading message="Dang tai phong hoc..." />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in-down">
        <div className="page-header !mb-0">
          <h1 className="page-title">Phong Hoc</h1>
          <p className="page-subtitle">Hoc cung nhau voi chat thoi gian thuc</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Thoi gian hien tai</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-display)] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowJoinModal(true)} 
              className="btn-secondary"
              style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              Tham gia bang ma
            </button>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="btn-primary"
            >
              + Tao phong moi
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabBar
        className="mb-8 animate-fade-in-up"
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        tabs={[
          { id: 'my-rooms', label: 'Phong cua toi', count: myCreatedSpaces.length },
          { id: 'joined', label: 'Da tham gia', count: mySpaces.filter(s => !myCreatedSpaces.some(cs => cs.id === s.id)).length },
          { id: 'public', label: 'Phong cong khai' },
          { id: 'friends', label: 'Ban be', count: friends.length, badge: requests.length || undefined },
        ]}
      />

      {/* My Rooms */}
      {activeTab === 'my-rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCreatedSpaces.length === 0 ? (
            <div className="col-span-full text-center py-20 rounded-3xl glass-card animate-scale-in">
              <div className="empty-symbol">0</div>
              <p className="text-lg font-semibold text-white mb-2">Ban chua tao phong nao</p>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Tao phong moi ngay
              </button>
            </div>
          ) : (
            myCreatedSpaces.map((space, index) => (
              <div
                key={space.id}
                onClick={() => navigate(`/study-spaces/${space.id}`)}
                className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                  background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.currentTarget.style.boxShadow = '0 24px 48px rgba(99, 102, 241, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-white font-[family-name:var(--font-display)] text-lg">{space.name}</h3>
                      <span 
                        className="badge"
                        style={{
                          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        Chu phong
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">
                      {space.description || 'Chua co mo ta'}
                    </p>
                  </div>
                  <span 
                    className="badge"
                    style={{
                      background: space.spaceType === 'public' 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))'
                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.15))',
                      color: space.spaceType === 'public' ? '#22c55e' : '#6366f1',
                      border: space.spaceType === 'public' 
                        ? '1px solid rgba(34, 197, 94, 0.25)'
                        : '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    {space.spaceType === 'public' ? 'Cong khai' : 'Rieng tu'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span className="text-sm text-slate-500">{space.memberCount} thanh vien</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleEditSpace(space, e)} 
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      }}
                    >
                      Sua
                    </button>
                    <button 
                      onClick={(e) => handleDeleteSpace(space.id, e)} 
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                      }}
                    >
                      Xoa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Joined */}
      {activeTab === 'joined' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const joinedSpaces = mySpaces.filter(s => !myCreatedSpaces.some(cs => cs.id === s.id));
            return joinedSpaces.length === 0 ? (
              <div className="col-span-full text-center py-20 rounded-3xl glass-card animate-scale-in">
                <div className="empty-symbol">—</div>
                <p className="text-lg font-semibold text-white mb-2">Ban chua tham gia phong nao</p>
                <button 
                  onClick={() => setActiveTab('public')} 
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Kham pha phong cong khai
                </button>
              </div>
            ) : (
              joinedSpaces.map((space, index) => (
                <div
                  key={space.id}
                  onClick={() => navigate(`/study-spaces/${space.id}`)}
                  className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.boxShadow = '0 24px 48px rgba(99, 102, 241, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white font-[family-name:var(--font-display)] text-lg">{space.name}</h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {space.description || 'Chua co mo ta'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span className="text-sm text-slate-500">{space.memberCount} thanh vien</span>
                    <button 
                      onClick={(e) => handleLeaveSpace(space.id, e)} 
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      Roi phong
                    </button>
                  </div>
                </div>
              ))
            );
          })()}
        </div>
      )}

      {/* Public */}
      {activeTab === 'public' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicSpaces.map((space, index) => (
            <div
              key={space.id}
              className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer animate-fade-in-up"
              style={{
                animationDelay: `${index * 100}ms`,
                background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                e.currentTarget.style.boxShadow = '0 24px 48px rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-white font-[family-name:var(--font-display)] text-lg">{space.name}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                    {space.description || 'Chua co mo ta'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Tao boi {space.creatorName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span className="text-sm text-slate-500">{space.memberCount} thanh vien</span>
                <button 
                  onClick={() => handleJoinSpace(space.id)} 
                  className="btn-primary !px-4 !py-1.5 !text-xs"
                >
                  Tham gia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.length > 0 && (
            <div className="rounded-2xl p-6 animate-fade-in-up" style={{
              background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}>
              <h3 className="font-bold text-white mb-4 font-[family-name:var(--font-display)]">Loi moi ket ban</h3>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div 
                    key={request.id} 
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      {request.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{request.userName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAcceptRequest(request.id)} 
                        className="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        Chap nhan
                      </button>
                      <button 
                        onClick={() => handleDeclineRequest(request.id)} 
                        className="btn-secondary !px-3 !py-1.5 !text-xs"
                      >
                        Tu choi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-6 animate-fade-in-up" style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            animationDelay: requests.length > 0 ? '150ms' : '0ms',
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white font-[family-name:var(--font-display)]">Ban be cua toi</h3>
              <button 
                onClick={() => setShowAddFriendModal(true)} 
                className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                + Them ban
              </button>
            </div>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <div className="empty-symbol">—</div>
                <p className="text-slate-400">Chua co ban be</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div 
                    key={friend.id} 
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                      }}
                    >
                      {friend.friendName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{friend.friendName}</p>
                      <p className="text-xs text-slate-500">
                        Ban be tu {new Date(friend.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Tao Phong Hoc</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ten phong</label>
                <input
                  type="text"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  className="input-field"
                  placeholder="VD: Nhom hoc Toan"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mo ta</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Phong hoc nay ve gi?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loai phong</label>
                <select
                  value={newSpace.spaceType}
                  onChange={(e) => setNewSpace({ ...newSpace, spaceType: e.target.value })}
                  className="input-field"
                >
                  <option value="public">Cong khai</option>
                  <option value="private">Rieng tu (chi moi)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Huy</button>
              <button onClick={handleCreateSpace} className="btn-primary">Tao phong</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingSpace && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Chinh sua phong hoc</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ten phong</label>
                <input
                  type="text"
                  value={editingSpace.name}
                  onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                  className="input-field"
                  placeholder="VD: Nhom hoc Toan"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Mo ta</label>
                <textarea
                  value={editingSpace.description || ''}
                  onChange={(e) => setEditingSpace({ ...editingSpace, description: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Phong hoc nay ve gi?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Loai phong</label>
                <select
                  value={editingSpace.spaceType}
                  onChange={(e) => setEditingSpace({ ...editingSpace, spaceType: e.target.value })}
                  className="input-field"
                >
                  <option value="public">Cong khai</option>
                  <option value="private">Rieng tu (chi moi)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowEditModal(false); setEditingSpace(null); }} className="btn-secondary">Huy</button>
              <button onClick={handleUpdateSpace} className="btn-primary" disabled={isUpdating}>
                {isUpdating ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Tham gia bang ma moi</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="input-field text-center text-xl tracking-[0.3em] font-bold"
              style={{ border: '2px dashed rgba(99, 102, 241, 0.3)' }}
              placeholder="ABCD1234"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary">Huy</button>
              <button onClick={handleJoinByCode} className="btn-primary">Tham gia</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 32px 64px rgba(0, 0, 0, 0.5)',
          }}>
            <h2 className="text-xl font-bold text-white mb-5 font-[family-name:var(--font-display)]">Them ban be</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="input-field flex-1"
                placeholder="Tim theo ten hoac email"
              />
              <button onClick={handleSearchUsers} className="btn-primary">Tim</button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      }}
                    >
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <button onClick={() => handleSendRequest(user.id)} className="btn-primary !px-3 !py-1.5 !text-xs">
                      Them
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
                Dong
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Xoa phong hoc"
        message="Ban co chac muon xoa phong hoc nay? Hanh dong nay khong the hoan tac."
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

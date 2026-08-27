import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateSpaceRequest, StudySpace } from '../services/studySpaceService';
import type { Friend, FriendRequest } from '../services/studySpaceService';
import { studySpaceService, friendService } from '../services/studySpaceService';
import Loading from '../components/Loading';

export default function StudySpaces() {
  const navigate = useNavigate();
  const [mySpaces, setMySpaces] = useState<StudySpace[]>([]);
  const [publicSpaces, setPublicSpaces] = useState<StudySpace[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-spaces' | 'public' | 'friends'>('my-spaces');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');

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
      const [my, publicData, friendsData, requestsData] = await Promise.all([
        studySpaceService.getMySpaces(),
        studySpaceService.getPublicSpaces(),
        friendService.getFriends(),
        friendService.getPendingRequests(),
      ]);
      setMySpaces(my);
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

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      const result = await studySpaceService.joinByCode(inviteCode);
      navigate(`/study-spaces/${result.spaceId}`);
    } catch (error) {
      console.error('Failed to join space:', error);
      alert('Invalid invite code');
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
    if (!confirm('Are you sure you want to leave this space?')) return;
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
      alert('Friend request sent!');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send request');
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

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Study Spaces</h1>
          <p className="text-gray-500">Join spaces to study together with real-time chat</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Join by Code
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Space
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('my-spaces')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'my-spaces' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
          }`}
        >
          My Spaces ({mySpaces.length})
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'public' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
          }`}
        >
          Public Spaces
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
          }`}
        >
          Friends ({friends.length})
          {requests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* My Spaces Tab */}
      {activeTab === 'my-spaces' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySpaces.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg mb-2">You haven't joined any spaces yet</p>
              <button
                onClick={() => setActiveTab('public')}
                className="text-blue-500 hover:underline"
              >
                Browse public spaces
              </button>
            </div>
          ) : (
            mySpaces.map((space) => (
              <div
                key={space.id}
                onClick={() => navigate(`/study-spaces/${space.id}`)}
                className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{space.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {space.description || 'No description'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    space.spaceType === 'public' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {space.spaceType}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-sm text-gray-500">{space.memberCount} members</span>
                  <button
                    onClick={(e) => handleLeaveSpace(space.id, e)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Leave
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Public Spaces Tab */}
      {activeTab === 'public' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicSpaces.map((space) => (
            <div
              key={space.id}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{space.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {space.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Created by {space.creatorName}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <span className="text-sm text-gray-500">{space.memberCount} members</span>
                <button
                  onClick={() => handleJoinSpace(space.id)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Friend Requests */}
          {requests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Friend Requests</h3>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      {request.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{request.userName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-100"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">My Friends</h3>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="text-sm text-blue-500 hover:underline"
              >
                Add Friend
              </button>
            </div>
            {friends.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No friends yet</p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-white">
                      {friend.friendName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{friend.friendName}</p>
                      <p className="text-xs text-gray-500">Friend since {new Date(friend.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Study Space</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Math Study Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's this space about?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newSpace.spaceType}
                  onChange={(e) => setNewSpace({ ...newSpace, spaceType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private (invite only)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Join by Invite Code</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-dashed rounded-lg text-center text-xl tracking-widest focus:outline-none focus:border-blue-500"
              placeholder="ABCD1234"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinByCode}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Friend</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name or email"
              />
              <button
                onClick={handleSearchUsers}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Search
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Add
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
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock commentaries data for development
const mockCommentaries = [
  {
    id: 'mock-uuid-1',
    video_id: 'XumjP_-8URs',
    user_id: 'mock-user-1',
    username: 'John Doe',
    profile_picture_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    audio_url: 'https://example.com/audio1.webm',
    created_at: '2024-05-01T12:00:00Z',
    likes: 124,
    play_count: 124
  },
  {
    id: 'mock-uuid-2',
    video_id: 'XumjP_-8URs',
    user_id: 'mock-user-2',
    username: 'Jake11',
    profile_picture_url: 'https://randomuser.me/api/portraits/men/2.jpg',
    audio_url: 'https://example.com/audio2.webm',
    created_at: '2024-05-02T12:00:00Z',
    likes: 13,
    play_count: 13
  },
  {
    id: 'mock-uuid-3',
    video_id: 'XumjP_-8URs',
    user_id: 'mock-user-3',
    username: 'Jonah',
    profile_picture_url: 'https://randomuser.me/api/portraits/men/3.jpg',
    audio_url: 'https://example.com/audio3.webm',
    created_at: '2024-05-03T12:00:00Z',
    likes: 56,
    play_count: 56
  }
];

// Expose to window for content script access
window.mockCommentaries = mockCommentaries; 
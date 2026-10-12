import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Story, Rundown, Ticker, User, RolePermission, DashboardData,Rundown_Story, StoryHistory } from '../types';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'; 

import { logout } from '../app/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  credentials: 'include', // still send cookies if any
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage (if you store it there)
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Wrapper to handle response interceptors
const baseQueryWithInterceptor: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Request logging in dev
  if (import.meta.env.DEV) {
    console.log(`[API Request] ${typeof args === 'string' ? args : args.url}`, args);
  }

  const result = await baseQuery(args, api, extraOptions);

  if (import.meta.env.DEV) {
    if (result.error) {
      console.error('[API Error]', result.error);
    } else {
      console.log('[API Response]', result.data);
    }
  }

  // Handle 401 Unauthorized – clear token and logout
  if (result.error && result.error.status === 401) {
    localStorage.removeItem('access_token');
    api.dispatch(logout());
    // Optional: redirect to login
    // window.location.href = '/login';
  }

  return result;
};


export const api = createApi({
  reducerPath: '',
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ['Story', 'Rundown', 'Ticker', 'User', 'Permission', 'Prompter'],
  endpoints: (builder) => ({
    login: builder.mutation<
      { access_token: string; user: any },
      { username: string; password: string }
    >({
      query: ({ username, password }) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return {
          url: '/login',
          method: 'POST',          
          body: { username, password },
        };
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
    getDashboard: builder.query<DashboardData, void>({
      query: () => '/api/dashboard',
      providesTags: ['Story', 'Rundown', 'Ticker', 'User'],
    }),
    getStories: builder.query<Story[], void>({
      query: () => '/stories',
      providesTags: ['Story'],
    }),
    createStory: builder.mutation<Story, Partial<Omit<Story, 'id' | 'created_at' | 'updated_at'>>>({
      query: (body) => ({ url: '/stories', method: 'POST', body }),
      invalidatesTags: ['Story'],
    }),
    updateStory: builder.mutation<Story, { id: number; body: Partial<Story> }>({
      query: ({ id, body }) => ({ url: `/stories/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Story'],
    }),
    deleteStory: builder.mutation<void, { story_id: number }>({
      query: ({ story_id }) => ({ url: `/stories/${story_id}`, method: 'DELETE', body: { story_id } }),
      invalidatesTags: ['Story'],
    }),

    deleteStories: builder.mutation<void, { story_ids: number[] }>({
      query: ({ story_ids }) => ({ url: '/stories/delete', method: 'POST', body: { story_ids } }),
      invalidatesTags: ['Story'],
    }),

    lockStory: builder.mutation<any, { id: number; force?: boolean }>({
      query: ({ id, force }) => ({ url: `/stories/${id}/lock`, method: 'POST', params: { force } }),
      invalidatesTags: ['Story'],
    }),
    unlockStory: builder.mutation<void, { id: number; force?: boolean }>({
      query: ({ id, force }) => ({ url: `/stories/${id}/unlock`, method: 'POST', params: { force } }),
      invalidatesTags: ['Story'],
    }),
    getRundowns: builder.query<Rundown[], void>({
      query: () => '/rundowns',
      providesTags: ['Rundown'],
    }),
    createRundown: builder.mutation<Rundown, Partial<Omit<Rundown, 'id' | 'created_at' | 'updated_at'>>>({
      query: (body) => ({ url: '/rundowns', method: 'POST', body }),
      invalidatesTags: ['Rundown'],
    }),   
    updateRundown: builder.mutation<Rundown, { id: number; body: Partial<Rundown> }>({
      query: ({ id, body }) => ({ url: `/rundowns/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Rundown'],
    }),

    updateRundownAddStory: builder.mutation<void, { rundown_id: number; story_id: number }>({
      query: ({ rundown_id, story_id }) => ({ 
        url: `/rundowns/${rundown_id}/stories/${story_id}`, 
        method: 'PUT' 
      }),
      invalidatesTags: ['Rundown'],
    }),
    
    deleteRundowns: builder.mutation<void, { ids: number[] }>({
      query: ({ ids }) => ({ url: '/rundowns/delete', method: 'POST', body: { ids } }),
      invalidatesTags: ['Rundown'],
    }),
    getTickers: builder.query<Ticker[], void>({
      query: () => '/tickers',
      providesTags: ['Ticker'],
    }),
    createTicker: builder.mutation<Ticker, Partial<Omit<Ticker, 'id' | 'created_at'>>>({
      query: (body) => ({ url: '/tickers', method: 'POST', body }),
      invalidatesTags: ['Ticker'],
    }),
    updateTicker: builder.mutation<Ticker, { id: number; body: Partial<Ticker> }>({
      query: ({ id, body }) => ({ url: `/tickers/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Ticker'],
    }),
    deleteTicker: builder.mutation<void, number>({
      query: (id) => ({ url: `/tickers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Ticker'],
    }),
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, Partial<Omit<User, 'id' | 'created_at'>> & 
      { password?: string, 
        permission?: number }>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: number; body: Partial<User> & 
      { password?: string, 
        permission?: number } }>({
      query: ({ id, body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

    getRolePermission: builder.query<RolePermission[], void>({
      query: () => '/rolePermissions',
      providesTags: ['Permission'],
    }),
    
    // In api.ts
  updateSinglePermission: builder.mutation<void, 
      { role_name: string; 
        column_name: string; 
        value: boolean
      }>({
    query: (body) => ({
      url: '/rolePermissions/single',
      method: 'PATCH',
      body,
    }),
    invalidatesTags: ['Permission'],
  }),

    setLiveStory: builder.mutation<void, { slug: string; text: string }>({
      query: (body) => ({ url: '/setLive', method: 'POST', body }),
    }),

    getLiveStory: builder.query<{ slug: string; text: string }, void>({
      query: () => '/getLive',
      providesTags: ['Prompter']
    }),

    // inside endpoints: (builder) => ({ ... }) — add these:

    getUserPermissions: builder.query<Record<string, boolean>, number>({
      query: (userId) => `/users/${userId}/permissions`,
      providesTags: (_r, _e, userId) => [{ type: 'Permission', id: `user-${userId}` }],
    }),

    // Bulk set/replace all permissions for a user
    setUserPermissions: builder.mutation<
      { status: string },
      { userId: number; permissions: Record<string, boolean> }
    >({
      query: ({ userId, permissions }) => ({
        url: `/users/${userId}/permissions`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'Permission', id: `user-${userId}` },
        'User',
      ],
    }),

    // Single toggle (matches the pattern of updateSinglePermission)
    updateSingleUserPermission: builder.mutation<
      { status: string },
      { userId: number; permission_key: string; is_granted: boolean }
    >({
      query: ({ userId, permission_key, is_granted }) => ({
        url: `/users/${userId}/permissions/single`,
        method: 'PATCH',
        body: { permission_key, is_granted },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'Permission', id: `user-${userId}` },
      ],
    }),

    // History
    getStoryHistory: builder.query<StoryHistory[], number>({
      query: (storyId) => `api/stories/${storyId}/history`,
      providesTags: (_r, _e, id) => [{ type: 'Story', id: `history-${id}` }],
    }),

    restoreStoryFromHistory: builder.mutation<
      { status: string; story_id: number },
      { storyId: number; historyId: number }
    >({
      query: ({ storyId, historyId }) => ({
        url: `api/stories/${storyId}/restore/${historyId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Story'],
    }),

    // Lock rundown
  lockRundown: builder.mutation<{ status: string; locked_by_name?: string }, { id: number; force?: boolean }>({
    query: ({ id, force }) => ({
      url: `/rundowns/${id}/lock`,
      method: 'POST',
      params: { force },
    }),
    invalidatesTags: ['Rundown'],
  }),

  // Unlock rundown
 unlockRundown: builder.mutation<void, number>({
  query: (id) => ({ url: `/rundowns/${id}/unlock`, method: 'POST' }),
  invalidatesTags: ['Rundown'],
 }),
    
    
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetDashboardQuery,
  useGetStoriesQuery,
  useCreateStoryMutation,
  useUpdateStoryMutation,
  useDeleteStoryMutation,
  useDeleteStoriesMutation,
  useLockStoryMutation,
  useUnlockStoryMutation,
  useGetRundownsQuery,
  useCreateRundownMutation,
  useUpdateRundownMutation,
  useUpdateRundownAddStoryMutation,
  useDeleteRundownsMutation,
  useGetTickersQuery,
  useCreateTickerMutation,
  useUpdateTickerMutation,
  useDeleteTickerMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolePermissionQuery,
  useUpdateSinglePermissionMutation,
  useSetLiveStoryMutation,
  useGetLiveStoryQuery,
  useGetUserPermissionsQuery,
  useSetUserPermissionsMutation,
  useUpdateSingleUserPermissionMutation,
  useGetStoryHistoryQuery,
  useRestoreStoryFromHistoryMutation, 
  useLockRundownMutation,
  useUnlockRundownMutation,
} = api;
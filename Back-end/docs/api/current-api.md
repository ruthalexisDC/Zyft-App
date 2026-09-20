# Zyft API — Current State

> This document describes the API before the REST API refactoring.
> It represents the current implementation and is used as a baseline.

Base URL:

/api

---

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/exchange` | Exchange authentication data |
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/facebook` | Start Facebook OAuth |
| GET | `/auth/facebook/callback` | Facebook OAuth callback |
| POST | `/auth/register/email` | Register with email |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current authenticated user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Request/perform email verification |
| POST | `/auth/verify-email/confirm` | Confirm email verification |

---

## Users

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get current user |
| POST | `/users/heartbeat` | Update heartbeat |
| PATCH | `/users/active-status` | Update active status |
| PATCH | `/users/goal` | Update goal |
| PATCH | `/users/privacy` | Update privacy |
| GET | `/users/notification-preferences` | Get notification preferences |
| PATCH | `/users/notification-preferences` | Update notification preferences |
| GET | `/users/suggested` | Get suggested users |
| GET | `/users/id/:id` | Get user by ID |
| GET | `/users/id/:id/posts` | Get user's posts |
| POST | `/users/id/:id/follow` | Follow user |
| GET | `/users/id/:id/follow-status` | Get follow status |
| GET | `/users/id/:id/followers` | Get followers |
| GET | `/users/id/:id/following` | Get following |
| GET | `/users/id/:id/split` | Get workout split |
| PUT | `/users/id/:id/split` | Update workout split |
| GET | `/users/:handle` | Get user by handle |
| POST | `/users/:handle/follow` | Follow by handle |
| POST | `/users/:handle/follow-only` | Follow-only operation |
| POST | `/users/:handle/unfollow` | Unfollow |
| PUT | `/users/profile` | Update profile |
| PUT | `/users/avatar` | Update avatar |
| DELETE | `/users/account` | Delete account |
| GET | `/users` | Get users |

---

## Workouts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/workouts` | Get workouts |
| GET | `/workouts/:id` | Get workout |
| POST | `/workouts` | Create workout |
| GET | `/workouts/by-post/:postId` | Get workout associated with post |

---

## Posts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/posts/feed` | Get social feed |
| POST | `/posts` | Create post |
| GET | `/posts/user/:userId` | Get user's posts |
| GET | `/posts/:postId` | Get post |
| PUT | `/posts/:postId` | Update post |
| PATCH | `/posts/:postId` | Partially update post |
| DELETE | `/posts/:postId` | Delete post |
| POST | `/posts/:postId/respect` | Respect post |
| GET | `/posts/:postId/respects` | Get respects |
| POST | `/posts/:postId/repost` | Repost |
| POST | `/posts/:postId/save` | Save post |
| DELETE | `/posts/:postId/save` | Unsave post |
| POST | `/posts/:postId/hide` | Hide post |
| DELETE | `/posts/:postId/hide` | Unhide post |
| POST | `/posts/:postId/report` | Report post |
| POST | `/posts/:postId/share` | Share post |
| POST | `/posts/:postId/comments` | Create comment |
| GET | `/posts/:postId/comments` | Get comments |
| PUT | `/posts/:postId/comments/:commentId` | Update comment |
| DELETE | `/posts/:postId/comments/:commentId` | Delete comment |
| POST | `/posts/:postId/comments/:commentId/react` | React to comment |

---

## Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications/unread-count` | Get unread count |
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |
| PATCH | `/notifications/read-all` | Mark all notifications as read |
| DELETE | `/notifications/:id` | Delete notification |

---

## Stats

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Get statistics |
| POST | `/stats/reset` | Reset statistics |
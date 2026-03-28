# 🧪 API Test Results — StreamMG

**Date :** 25/03/2026 11:20:21

| Catégorie | Méthode | Endpoint | Status | Résultat | Détails |
|---|---|---|---|---|---|


| Auth | POST | `/auth/login (User)` | 200 | ✅ | Token received |
| Auth | POST | `/auth/login (Premium)` | 200 | ✅ | Role verified |
| Auth | POST | `/auth/login (Provider)` | 200 | ✅ |  |
| Auth | POST | `/auth/login (Admin)` | 429 | ❌ |  |
| Auth | POST | `/auth/refresh` | 429 | ❌ | Expected fail in CLI due to cookie |
| Auth | POST | `/auth/logout` | 429 | ❌ |  |
| Catalog | GET | `/contents` | 200 | ✅ | Found 13 items |
| Catalog | GET | `/contents/featured` | 200 | ✅ |  |
| Catalog | GET | `/contents/trending` | 200 | ✅ |  |
| Catalog | GET | `/contents/:id` | 200 | ✅ |  |
| Catalog | POST | `/contents/:id/view` | 200 | ✅ | Now undefined |
| Playback | GET | `/hls/:id/token (Forbidden)` | 403 | ✅ | subscription_required |
| Playback | GET | `/hls/:id/token (Success)` | 200 | ✅ |  |
| Playback | GET | `/hls/:id/index.m3u8` | 404 | ❌ |  |
| Playback | GET | `/audio/:id/url` | 404 | ❌ |  |
| History | POST | `/history/:contentId` | 200 | ✅ |  |
| History | GET | `/history` | 200 | ✅ | Found 1 items |
| Payment | GET | `/payment/status` | 200 | ✅ | isPremium: true |
| Payment | POST | `/payment/purchase` | 500 | ❌ |  |
| Payment | GET | `/payment/purchases` | 200 | ✅ |  |
| User | GET | `/user/profile` | 404 | ❌ |  |
| User | PATCH | `/user/profile` | 404 | ❌ |  |
| Provider | GET | `/provider/contents` | 200 | ✅ |  |
| Admin | GET | `/admin/stats` | 401 | ❌ |  |
| Admin | GET | `/admin/users` | 401 | ❌ |  |
export const ROUTES = {
  // Public
  home: "/",
  games: "/games",
  game: (slug: string) => `/games/${slug}`,
  about: "/about",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund",

  // Auth
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  verifyEmail: "/verify-email",

  // User
  dashboard: "/dashboard",
  orders: "/orders",
  order: (id: string) => `/orders/${id}`,
  orderProgress: (id: string) => `/orders/${id}/progress`,
  orderReview: (id: string) => `/orders/${id}/review`,
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  // wishlist: '/wishlist',
  notifications: "/notifications",
  chat: "/chat",
  account: "/account",
  accountSettings: "/account/settings",

  // Admin
  admin: {
    dashboard: "/admin",
    games: "/admin/games",
    game: (id: string) => `/admin/games/${id}`,
    services: "/admin/services",
    orders: "/admin/orders",
    order: (id: string) => `/admin/orders/${id}`,
    joki: "/admin/joki",
    jokiDetail: (id: string) => `/admin/joki/${id}`,
    users: "/admin/users",
    vouchers: "/admin/vouchers",
    notifications: "/admin/notifications",
    reviews: "/admin/reviews",
    content: "/admin/content",
    chat: "/admin/chat",
    analytics: "/admin/analytics",
  },

  // Joki
  joki: {
    dashboard: "/joki",
    orders: "/joki/orders",
    order: (id: string) => `/joki/orders/${id}`,
  },

  // API
  api: {
    auth: {
      register: "/api/auth/register",
      verifyEmail: "/api/auth/verify-email",
      resetPassword: "/api/auth/reset-password",
    },
    games: "/api/games",
    game: (slug: string) => `/api/games/${slug}`,
    gameServices: (slug: string) => `/api/games/${slug}/services`,
    orders: "/api/orders",
    order: (id: string) => `/api/orders/${id}`,
    orderProgress: (id: string) => `/api/orders/${id}/progress`,
    orderReview: (id: string) => `/api/orders/${id}/review`,
    orderCancel: (id: string) => `/api/orders/${id}/cancel`,
    checkout: "/api/payments/checkout",
    webhook: "/api/payments/webhook",
    voucherValidate: "/api/vouchers/validate",
    profile: "/api/user/profile",
    wishlist: "/api/user/wishlist",
    notifications: "/api/user/notifications",
  },
} as const;

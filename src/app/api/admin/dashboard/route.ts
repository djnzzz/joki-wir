import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ok, handleError } from "@/lib/api-response";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Semua query dijalankan paralel — lebih cepat
    const [
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      ordersByStatus,
      revenueByGame,
      topServices,
      orderVolumeByDay,
      totalUsers,
      activeJoki,
      avgRating,
    ] = await Promise.all([
      // Total order keseluruhan
      prisma.order.count({ where: { status: { not: "CANCELLED" } } }),

      // Order bulan ini
      prisma.order.count({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: "CANCELLED" },
        },
      }),

      // Order bulan lalu
      prisma.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { not: "CANCELLED" },
        },
      }),

      // Revenue bulan ini (dari payment PAID)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "PAID",
          createdAt: { gte: startOfMonth },
        },
      }),

      // Revenue bulan lalu
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "PAID",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Distribusi order per status
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),

      // Revenue per game (dari orderItem — pakai priceSnapshot)
      prisma.orderItem.groupBy({
        by: ["gameName"],
        _sum: { priceSnapshot: true },
        _count: true,
        where: {
          order: {
            status: { notIn: ["CANCELLED"] },
            payment: { status: "PAID" },
          },
        },
        orderBy: { _sum: { priceSnapshot: "desc" } },
      }),

      // Top 5 service terlaris
      prisma.orderItem.groupBy({
        by: ["serviceName", "gameName"],
        _count: true,
        _sum: { priceSnapshot: true },
        where: { order: { status: { notIn: ["CANCELLED"] } } },
        orderBy: { _count: { serviceId: "desc" } },
        take: 5,
      }),

      // Volume order per hari (30 hari terakhir) — raw query lebih efisien
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT 
          DATE(created_at)::text AS date,
          COUNT(*)::bigint AS count
        FROM orders
        WHERE 
          created_at >= NOW() - INTERVAL '30 days'
          AND status != 'CANCELLED'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Total user terdaftar
      prisma.user.count({ where: { role: "USER", isActive: true } }),

      // Joki aktif (punya order IN_PROGRESS)
      prisma.user.count({
        where: {
          role: "JOKI",
          isActive: true,
          jokiOrders: { some: { status: "IN_PROGRESS" } },
        },
      }),

      // Rata-rata rating
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: true,
        where: { isVisible: true },
      }),
    ]);

    // Hitung growth rate bulan ini vs bulan lalu
    const orderGrowth =
      ordersLastMonth > 0
        ? Math.round(
            ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100,
          )
        : 100;

    const revenueThisMonthNum = revenueThisMonth._sum.amount ?? 0;
    const revenueLastMonthNum = revenueLastMonth._sum.amount ?? 0;
    const revenueGrowth =
      revenueLastMonthNum > 0
        ? Math.round(
            ((revenueThisMonthNum - revenueLastMonthNum) /
              revenueLastMonthNum) *
              100,
          )
        : 100;

    return ok({
      summary: {
        totalOrders,
        ordersThisMonth,
        orderGrowth,
        revenueThisMonth: revenueThisMonthNum,
        revenueGrowth,
        totalUsers,
        activeJoki,
        avgRating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
        totalReviews: avgRating._count,
      },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      revenueByGame,
      topServices,
      orderVolumeByDay: orderVolumeByDay.map((d) => ({
        date: d.date,
        count: Number(d.count), // bigint → number
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

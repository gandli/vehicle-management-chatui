import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicles, bookings, drivers } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// GET /api/vehicles - 获取所有可用车辆
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = searchParams.get("type");
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];
    
    let query = db.select().from(vehicles).where(eq(vehicles.status, 'available'));
    
    if (vehicleType) {
      query = query.where(eq(vehicles.type, vehicleType));
    }
    
    // 检查指定日期是否有预订冲突
    const availableVehicles = await query;
    
    return Response.json({ 
      success: true, 
      vehicles: availableVehicles,
      date 
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return Response.json({ 
      success: false, 
      error: "Failed to fetch vehicles" 
    }, { status: 500 });
  }
}

// POST /api/vehicles/book - 预订车辆
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, vehicleId, startDate, endDate, purpose, passengers } = body;
    
    // 验证车辆是否可用
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId)
    });
    
    if (!vehicle || vehicle.status !== 'available') {
      return Response.json({ 
        success: false, 
        error: "Vehicle not available" 
      }, { status: 400 });
    }
    
    // 检查时间冲突
    const conflictingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.vehicleId, vehicleId),
        or(
          and(gte(bookings.startDate, startDate), lte(bookings.startDate, endDate)),
          and(gte(bookings.endDate, startDate), lte(bookings.endDate, startDate))
        )
      )
    });
    
    if (conflictingBookings.length > 0) {
      return Response.json({ 
        success: false, 
        error: "Vehicle already booked for this time period" 
      }, { status: 400 });
    }
    
    // 创建预订
    const [booking] = await db.insert(bookings).values({
      userId,
      vehicleId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      purpose,
      passengers,
      status: 'confirmed',
      createdAt: new Date()
    }).returning();
    
    // 更新车辆状态
    await db.update(vehicles).set({
      status: 'booked'
    }).where(eq(vehicles.id, vehicleId));
    
    return Response.json({ 
      success: true, 
      booking,
      message: "Vehicle booked successfully"
    });
  } catch (error) {
    console.error("Error booking vehicle:", error);
    return Response.json({ 
      success: false, 
      error: "Failed to book vehicle" 
    }, { status: 500 });
  }
}
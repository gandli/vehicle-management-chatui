import { NextRequest } from "next/server";
import { vehicles, bookings, drivers } from "@/lib/db/schema";
import { eq, and, or, gte, lte } from "drizzle-orm";

// Mock data for testing without database
const mockVehicles = [
  { id: 1, vehicleId: 'V001', type: 'sedan', brand: 'Toyota', model: 'Camry', licensePlate: '京A12345', capacity: 4, status: 'available', location: '北京总部' },
  { id: 2, vehicleId: 'V002', type: 'sedan', brand: 'Honda', model: 'Accord', licensePlate: '京A12346', capacity: 4, status: 'available', location: '北京总部' },
  { id: 3, vehicleId: 'V003', type: 'suv', brand: 'BMW', model: 'X5', licensePlate: '京B12345', capacity: 5, status: 'available', location: '北京总部' },
  { id: 4, vehicleId: 'V004', type: 'suv', brand: 'Mercedes', model: 'GLE', licensePlate: '京B12346', capacity: 5, status: 'booked', location: '上海分部' },
  { id: 5, vehicleId: 'V005', type: 'van', brand: 'Buick', model: 'GL8', licensePlate: '京C12345', capacity: 7, status: 'available', location: '北京总部' },
  { id: 6, vehicleId: 'V006', type: 'van', brand: 'Toyota', model: 'Hiace', licensePlate: '京C12346', capacity: 9, status: 'maintenance', location: '广州分部' },
  { id: 7, vehicleId: 'V007', type: 'truck', brand: 'Ford', model: 'F-150', licensePlate: '京D12345', capacity: 3, status: 'available', location: '北京总部' },
];

// GET /api/vehicles - 获取所有可用车辆
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = searchParams.get("type");
    const date = searchParams.get("date") || new Date().toISOString().split('T')[0];
    
    // For now, use mock data since database may not be configured
    let availableVehicles = mockVehicles.filter(v => v.status === 'available');
    
    if (vehicleType) {
      availableVehicles = availableVehicles.filter(v => v.type === vehicleType);
    }
    
    return Response.json({ 
      success: true, 
      vehicles: availableVehicles,
      date,
      total: availableVehicles.length
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
    
    // Find vehicle in mock data
    const vehicleIndex = mockVehicles.findIndex(v => v.id === vehicleId);
    
    if (vehicleIndex === -1 || mockVehicles[vehicleIndex].status !== 'available') {
      return Response.json({ 
        success: false, 
        error: "Vehicle not available" 
      }, { status: 400 });
    }
    
    // Create booking (mock)
    const booking = {
      bookingId: `BK${Date.now()}`,
      userId,
      vehicleId,
      vehicleType: mockVehicles[vehicleIndex].type,
      vehicleModel: mockVehicles[vehicleIndex].model,
      startDate,
      endDate,
      purpose,
      passengers,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    // Update vehicle status
    mockVehicles[vehicleIndex].status = 'booked';
    
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

// DELETE /api/vehicles - 取消预订
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    
    if (!bookingId) {
      return Response.json({
        success: false,
        error: "Booking ID is required"
      }, { status: 400 });
    }
    
    // Mock cancellation
    return Response.json({
      success: true,
      message: `Booking ${bookingId} cancelled successfully`
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return Response.json({
      success: false,
      error: "Failed to cancel booking"
    }, { status: 500 });
  }
}
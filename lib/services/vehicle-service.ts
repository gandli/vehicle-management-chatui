import { db } from '@/lib/db/queries';
import { vehicles, bookings, drivers } from '@/lib/db/schema';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { generateId } from 'ai';

export interface VehicleInfo {
  id: number;
  vehicleId: string;
  type: string;
  brand: string;
  model: string;
  licensePlate: string;
  capacity: number;
  status: string;
  location: string;
  available?: boolean;
  features?: string[];
}

export interface BookingResult {
  bookingId: string;
  vehicleType: string;
  date: string;
  startTime: string;
  endTime: string;
  driverAssigned: boolean;
  driverName?: string;
}

export interface CreateBookingInput {
  userId: string;
  conversationId: string;
  vehicleType: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}

export class VehicleService {
  // Mock data for testing when database is not available
  private mockVehicles: VehicleInfo[] = [
    { id: 1, vehicleId: 'V001', type: 'sedan', brand: 'Toyota', model: 'Camry', licensePlate: '京A12345', capacity: 4, status: 'available', location: '北京总部', available: true, features: ['GPS', '蓝牙'] },
    { id: 2, vehicleId: 'V002', type: 'sedan', brand: 'Honda', model: 'Accord', licensePlate: '京A12346', capacity: 4, status: 'available', location: '北京总部', available: true, features: ['GPS', '倒车影像'] },
    { id: 3, vehicleId: 'V003', type: 'suv', brand: 'BMW', model: 'X5', licensePlate: '京B12345', capacity: 5, status: 'available', location: '北京总部', available: true, features: ['GPS', '全景天窗', '座椅加热'] },
    { id: 4, vehicleId: 'V004', type: 'suv', brand: 'Mercedes', model: 'GLE', licensePlate: '京B12346', capacity: 5, status: 'booked', location: '上海分部', available: false, features: ['GPS', '按摩座椅'] },
    { id: 5, vehicleId: 'V005', type: 'van', brand: 'Buick', model: 'GL8', licensePlate: '京C12345', capacity: 7, status: 'available', location: '北京总部', available: true, features: ['商务座椅', '车载冰箱'] },
    { id: 6, vehicleId: 'V006', type: 'van', brand: 'Toyota', model: 'Hiace', licensePlate: '京C12346', capacity: 9, status: 'maintenance', location: '广州分部', available: false, features: ['对开门', '行李架'] },
    { id: 7, vehicleId: 'V007', type: 'truck', brand: 'Ford', model: 'F-150', licensePlate: '京D12345', capacity: 3, status: 'available', location: '北京总部', available: true, features: ['四驱', '拖车钩'] },
  ];

  private mockDrivers = [
    { id: 1, driverId: 'D001', name: '张师傅', phone: '13800138001', licenseNumber: 'BJ123456', status: 'available', rating: 5, totalTrips: 150 },
    { id: 2, driverId: 'D002', name: '李师傅', phone: '13800138002', licenseNumber: 'BJ123457', status: 'assigned', rating: 4.8, totalTrips: 200 },
    { id: 3, driverId: 'D003', name: '王师傅', phone: '13800138003', licenseNumber: 'BJ123458', status: 'available', rating: 4.9, totalTrips: 180 },
  ];

  private useMockData = true; // Set to false when database is properly configured

  async getVehicleFleet(): Promise<VehicleInfo[]> {
    if (this.useMockData) {
      return this.mockVehicles;
    }

    try {
      const result = await db.select().from(vehicles);
      return result.map(v => ({
        ...v,
        available: v.status === 'available',
        features: ['GPS', '蓝牙'] // Default features
      }));
    } catch (error) {
      console.error('Error fetching vehicle fleet:', error);
      return this.mockVehicles;
    }
  }

  async checkAvailability(date: string): Promise<Record<string, VehicleInfo[]>> {
    if (this.useMockData) {
      const grouped: Record<string, VehicleInfo[]> = {};
      for (const vehicle of this.mockVehicles) {
        if (!grouped[vehicle.type]) {
          grouped[vehicle.type] = [];
        }
        grouped[vehicle.type].push({
          ...vehicle,
          available: vehicle.status === 'available'
        });
      }
      return grouped;
    }

    try {
      const result = await db.select().from(vehicles);
      const grouped: Record<string, VehicleInfo[]> = {};
      
      for (const vehicle of result) {
        if (!grouped[vehicle.type]) {
          grouped[vehicle.type] = [];
        }
        grouped[vehicle.type].push({
          ...vehicle,
          available: vehicle.status === 'available'
        });
      }
      
      return grouped;
    } catch (error) {
      console.error('Error checking availability:', error);
      return {};
    }
  }

  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    const bookingId = `BK${Date.now()}`;
    
    // Find an available vehicle of the requested type
    const availableVehicle = this.mockVehicles.find(
      v => v.type === input.vehicleType.toLowerCase() && v.status === 'available'
    );

    if (!availableVehicle) {
      throw new Error(`No available ${input.vehicleType} vehicles found`);
    }

    // Find an available driver
    const availableDriver = this.mockDrivers.find(d => d.status === 'available');

    // Update mock data
    if (this.useMockData) {
      const vehicleIndex = this.mockVehicles.findIndex(v => v.id === availableVehicle.id);
      if (vehicleIndex >= 0) {
        this.mockVehicles[vehicleIndex].status = 'booked';
        this.mockVehicles[vehicleIndex].available = false;
      }
      
      if (availableDriver) {
        const driverIndex = this.mockDrivers.findIndex(d => d.id === availableDriver.id);
        if (driverIndex >= 0) {
          this.mockDrivers[driverIndex].status = 'assigned';
        }
      }
    }

    return {
      bookingId,
      vehicleType: availableVehicle.type,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      driverAssigned: !!availableDriver,
      driverName: availableDriver?.name
    };
  }

  async cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; message: string }> {
    // In a real implementation, we would:
    // 1. Find the booking by ID
    // 2. Verify the user owns it
    // 3. Update booking status to 'cancelled'
    // 4. Release the vehicle
    
    return {
      success: true,
      message: `Booking ${bookingId} has been cancelled successfully`
    };
  }

  async getBookingById(bookingId: string): Promise<any> {
    // Mock implementation
    return {
      bookingId,
      status: 'confirmed',
      vehicleType: 'sedan',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00'
    };
  }

  async getUserBookings(userId: string): Promise<any[]> {
    // Mock implementation
    return [
      {
        bookingId: 'BK123456',
        vehicleType: 'sedan',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        status: 'confirmed'
      }
    ];
  }

  async getCostEstimate(
    vehicleType: string,
    duration: number
  ): Promise<{ baseFee: number; estimatedTotal: number; currency: string }> {
    const rates: Record<string, number> = {
      sedan: 200,
      suv: 350,
      van: 400,
      truck: 500
    };

    const baseFee = rates[vehicleType.toLowerCase()] || 200;
    const estimatedTotal = baseFee * Math.ceil(duration / 8); // 8-hour day rate

    return {
      baseFee,
      estimatedTotal,
      currency: 'CNY'
    };
  }
}
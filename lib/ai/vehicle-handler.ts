import { CoreMessage, generateId } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { VehicleService } from '@/lib/services/vehicle-service';

export interface VehicleChatContext {
  userId: string;
  conversationId: string;
}

export class VehicleChatHandler {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  async handleVehicleRequest(
    messages: CoreMessage[],
    context: VehicleChatContext
  ) {
    const stream = createStreamableValue<string>();
    
    // Get the latest user message
    const latestMessage = messages[messages.length - 1]?.content;
    
    if (typeof latestMessage === 'string') {
      // Process vehicle-related requests
      await this.processVehicleIntent(latestMessage, stream, context);
    }
    
    return { stream };
  }

  private async processVehicleIntent(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    const lowerMsg = message.toLowerCase();
    
    try {
      if (lowerMsg.includes('book') || lowerMsg.includes('reserve') || lowerMsg.includes('预定') || lowerMsg.includes('预约')) {
        await this.handleBookingRequest(message, stream, context);
      } else if (lowerMsg.includes('available') || lowerMsg.includes('availability') || lowerMsg.includes('可用') || lowerMsg.includes('空闲')) {
        await this.handleAvailabilityRequest(message, stream, context);
      } else if (lowerMsg.includes('list') || lowerMsg.includes('show') || lowerMsg.includes('view') || lowerMsg.includes('查看') || lowerMsg.includes('列表')) {
        await this.handleVehicleListRequest(message, stream, context);
      } else if (lowerMsg.includes('cancel') || lowerMsg.includes('取消')) {
        await this.handleCancelRequest(message, stream, context);
      } else {
        // General vehicle information
        await this.handleGeneralInfo(message, stream, context);
      }
    } catch (error) {
      stream.append(`Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      stream.done();
    }
  }

  private async handleBookingRequest(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    stream.append("Processing your vehicle booking request...\n");
    
    try {
      // Parse booking details from message
      const bookingDetails = this.parseBookingDetails(message);
      
      if (!bookingDetails) {
        stream.append("Could you please provide more details about your booking? I need:\n");
        stream.append("- Vehicle type (sedan, SUV, van, truck)\n");
        stream.append("- Date and time\n");
        stream.append("- Duration or return time\n");
        stream.append("- Purpose (optional)\n");
        stream.done();
        return;
      }

      const result = await this.vehicleService.createBooking({
        ...bookingDetails,
        userId: context.userId,
        conversationId: context.conversationId
      });

      stream.append(`✅ Booking confirmed!\n`);
      stream.append(`- Vehicle: ${result.vehicleType}\n`);
      stream.append(`- Date: ${result.date}\n`);
      stream.append(`- Time: ${result.startTime} - ${result.endTime}\n`);
      stream.append(`- Booking ID: ${result.bookingId}\n`);
      
      if (result.driverAssigned) {
        stream.append(`- Driver: ${result.driverName}\n`);
      }
      
      stream.append(`\nYou can track your booking status anytime!`);
    } catch (error) {
      stream.append(`❌ Booking failed: ${error instanceof Error ? error.message : 'Please try again'}`);
    }
    
    stream.done();
  }

  private async handleAvailabilityRequest(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    stream.append("Checking vehicle availability...\n");
    
    try {
      const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
      const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
      
      const availability = await this.vehicleService.checkAvailability(date);
      
      stream.append(`📅 Availability for ${date}:\n\n`);
      
      for (const [type, vehicles] of Object.entries(availability)) {
        const availableCount = vehicles.filter(v => v.available).length;
        const totalCount = vehicles.length;
        stream.append(`🚗 ${type}: ${availableCount}/${totalCount} available\n`);
      }
      
      stream.append(`\nUse "book [vehicle type] on [date]" to make a reservation!`);
    } catch (error) {
      stream.append(`❌ Failed to check availability: ${error instanceof Error ? error.message : 'Please try again'}`);
    }
    
    stream.done();
  }

  private async handleVehicleListRequest(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    stream.append("Retrieving vehicle fleet information...\n");
    
    try {
      const vehicles = await this.vehicleService.getVehicleFleet();
      
      stream.append("🚛 Our Vehicle Fleet:\n\n");
      
      vehicles.forEach(vehicle => {
        stream.append(`• ${vehicle.type} - ${vehicle.model} (${vehicle.licensePlate})\n`);
        stream.append(`  Status: ${vehicle.available ? 'Available' : 'In Use'}\n`);
        if (vehicle.features) {
          stream.append(`  Features: ${vehicle.features.join(', ')}\n`);
        }
        stream.append('\n');
      });
      
      stream.append(`Total vehicles: ${vehicles.length}`);
    } catch (error) {
      stream.append(`❌ Failed to retrieve vehicle list: ${error instanceof Error ? error.message : 'Please try again'}`);
    }
    
    stream.done();
  }

  private async handleCancelRequest(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    stream.append("Processing cancellation request...\n");
    
    try {
      const bookingIdMatch = message.match(/(?:booking|reservation|id)[\s:]*([A-Z0-9]+)/i);
      const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;
      
      if (!bookingId) {
        stream.append("Please provide your booking ID to cancel the reservation.\n");
        stream.append("You can find it in your confirmation message.");
        stream.done();
        return;
      }
      
      const result = await this.vehicleService.cancelBooking(bookingId, context.userId);
      
      if (result.success) {
        stream.append(`✅ Booking ${bookingId} has been successfully cancelled.\n`);
        stream.append(`Refund will be processed according to our policy.`);
      } else {
        stream.append(`❌ Cancellation failed: ${result.message}`);
      }
    } catch (error) {
      stream.append(`❌ Cancellation error: ${error instanceof Error ? error.message : 'Please contact support'}`);
    }
    
    stream.done();
  }

  private async handleGeneralInfo(
    message: string,
    stream: ReturnType<typeof createStreamableValue>,
    context: VehicleChatContext
  ) {
    stream.append("Welcome to our Enterprise Vehicle Management System! 🚗\n\n");
    stream.append("I can help you with:\n");
    stream.append("• 📅 Check vehicle availability\n");
    stream.append("• 🚗 Book/reserve vehicles\n");
    stream.append("• 📋 View vehicle fleet\n");
    stream.append("• ❌ Cancel bookings\n");
    stream.append("• 💰 Get cost estimates\n");
    stream.append("• 🧑‍💼 Driver assignment\n\n");
    stream.append("Just ask me what you need! For example:\n");
    stream.append('"Show me available SUVs tomorrow"\n');
    stream.append('"Book a sedan for March 15th from 9 AM to 5 PM"\n');
    stream.append('"What vehicles do we have in our fleet?"');
    
    stream.done();
  }

  private parseBookingDetails(message: string): {
    vehicleType: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  } | null {
    // Simple parsing logic - in production, use proper NLP
    const vehicleTypes = ['sedan', 'suv', 'van', 'truck', '轿车', 'SUV', '面包车', '卡车'];
    let vehicleType = 'sedan'; // default
    
    for (const type of vehicleTypes) {
      if (message.toLowerCase().includes(type.toLowerCase())) {
        vehicleType = type;
        break;
      }
    }
    
    // Extract date (simple regex)
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
    
    // Extract time (very basic)
    const timeMatch = message.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)/g);
    const startTime = timeMatch?.[0] || '09:00';
    const endTime = timeMatch?.[1] || '17:00';
    
    return {
      vehicleType,
      date,
      startTime,
      endTime,
      purpose: message.includes('for') ? message.split('for')[1]?.trim() : undefined
    };
  }
}
import { cookies } from "next/headers";
import { Suspense } from "react";
import { VehicleChat } from "@/components/chat/vehicle-chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { VEHICLE_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <VehicleChatPage />
    </Suspense>
  );
}

async function VehicleChatPage() {
  const id = generateUUID();

  return (
    <>
      <VehicleChat
        autoResume={false}
        id={id}
        initialChatModel={VEHICLE_CHAT_MODEL}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}